import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { count, queryAll, numberToBool, parseJSON } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const period = parseInt(searchParams.get('period') || '30')

    const now = new Date()
    const daysAgo = new Date(now)
    daysAgo.setDate(daysAgo.getDate() - period)

    // Calculate previous period for comparison
    const previousDaysAgo = new Date(daysAgo)
    previousDaysAgo.setDate(previousDaysAgo.getDate() - period)

    const daysAgoIso = daysAgo.toISOString()
    const previousDaysAgoIso = previousDaysAgo.toISOString()

    // Product stats
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      count(env, 'products'),
      count(env, 'products', 'WHERE isActive = 1'),
      count(env, 'products', 'WHERE stock > 0 AND stock < 10'),
      count(env, 'products', 'WHERE stock = 0'),
    ])

    // Order stats
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
    ] = await Promise.all([
      count(env, 'orders'),
      count(env, 'orders', 'WHERE status = ?', 'PENDING'),
      count(env, 'orders', 'WHERE status = ?', 'PROCESSING'),
      count(env, 'orders', 'WHERE status = ?', 'DELIVERED'),
      count(env, 'orders', 'WHERE status = ?', 'CANCELLED'),
    ])

    // Customer stats
    const [
      totalCustomers,
      activeCustomers,
    ] = await Promise.all([
      count(env, 'users', 'WHERE role = ?', 'user'),
      count(env, 'users', 'WHERE role = ?', 'user'), // All users are active in this implementation
    ])

    // Get orders with items for the period
    const orders = await queryAll<any>(
      env,
      `SELECT o.*, oi.id as itemId, oi.price as itemPrice, oi.quantity
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.orderId
       WHERE o.createdAt >= ?
       ORDER BY o.createdAt DESC`,
      daysAgoIso
    )

    // Group orders by orderId to calculate totals
    const ordersMap = new Map<string, any>()
    for (const row of orders) {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          ...row,
          total: 0,
          itemsCount: 0,
          orderItems: [],
        })
      }
      const order = ordersMap.get(row.id)!
      if (row.itemId) {
        order.total += row.itemPrice * row.quantity
        order.itemsCount += row.quantity
        order.orderItems.push({
          price: row.itemPrice,
          quantity: row.quantity,
        })
      }
    }

    const ordersList = Array.from(ordersMap.values())

    const totalRevenue = ordersList.reduce((sum, order) => sum + order.total, 0)
    const totalItemsSold = ordersList.reduce((sum, order) => sum + order.itemsCount, 0)
    const avgOrderValue = ordersList.length > 0 ? totalRevenue / ordersList.length : 0

    // Get previous period orders for comparison
    const previousOrders = await queryAll<any>(
      env,
      `SELECT o.*, oi.price as itemPrice, oi.quantity
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.orderId
       WHERE o.createdAt >= ? AND o.createdAt < ?
       ORDER BY o.createdAt DESC`,
      previousDaysAgoIso,
      daysAgoIso
    )

    const previousOrdersMap = new Map<string, any>()
    for (const row of previousOrders) {
      if (!previousOrdersMap.has(row.id)) {
        previousOrdersMap.set(row.id, {
          total: 0,
        })
      }
      const order = previousOrdersMap.get(row.id)!
      if (row.price) {
        order.total += row.price * row.quantity
      }
    }

    const previousOrdersList = Array.from(previousOrdersMap.values())
    const previousRevenue = previousOrdersList.reduce((sum, order) => sum + order.total, 0)
    const previousOrdersCount = previousOrdersList.length

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const ordersGrowth = previousOrdersCount > 0
      ? ((ordersList.length - previousOrdersCount) / previousOrdersCount) * 100
      : 0

    // Customer metrics for the period
    const currentPeriodCustomers = await queryAll<any>(
      env,
      `SELECT * FROM users WHERE role = ? AND createdAt >= ?`,
      'user',
      daysAgoIso
    )

    const previousPeriodCustomers = await queryAll<any>(
      env,
      `SELECT * FROM users WHERE role = ? AND createdAt >= ? AND createdAt < ?`,
      'user',
      previousDaysAgoIso,
      daysAgoIso
    )

    const newCustomerGrowth = previousPeriodCustomers.length > 0
      ? ((currentPeriodCustomers.length - previousPeriodCustomers.length) / previousPeriodCustomers.length) * 100
      : 0

    // Calculate returning customers
    const customerOrderCounts: Record<string, number> = {}
    for (const order of ordersList) {
      if (order.userId) {
        customerOrderCounts[order.userId] = (customerOrderCounts[order.userId] || 0) + 1
      }
    }

    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length
    const returningRate = ordersList.length > 0 ? (returningCustomers / ordersList.length) * 100 : 0

    // Top products (by items sold in period)
    const topProductsData = await queryAll<any>(
      env,
      `SELECT p.id, p.name, p.basePrice as price, COUNT(oi.id) as sales
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.productId
       LEFT JOIN orders o ON oi.orderId = o.id
       WHERE o.createdAt >= ? OR o.createdAt IS NULL
       GROUP BY p.id
       ORDER BY sales DESC
       LIMIT 5`,
      daysAgoIso
    )

    // Top customers (by orders in period)
    const topCustomersData = await queryAll<any>(
      env,
      `SELECT u.id, u.name, u.email, COUNT(o.id) as orders
       FROM users u
       LEFT JOIN orders o ON u.id = o.userId
       WHERE u.role = ?
       GROUP BY u.id
       ORDER BY orders DESC
       LIMIT 5`,
      'user'
    )

    return NextResponse.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          revenue: totalRevenue,
          itemsSold: totalItemsSold,
          avgOrderValue: avgOrderValue,
        },
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          new: currentPeriodCustomers.length,
          returning: returningCustomers,
          returningRate: returningRate,
        },
        trends: {
          revenueGrowth,
          ordersGrowth,
          newCustomerGrowth,
        },
        period,
        topProducts: topProductsData.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          sales: product.sales,
        })),
        topCustomers: topCustomersData.map((customer) => ({
          id: customer.id,
          name: customer.name || customer.email,
          email: customer.email,
          orders: customer.orders,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
      },
      { status: 500 }
    )
  }
}
