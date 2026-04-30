import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, count, parseJSON, numberToBool } from '@/db/db'

export const runtime = 'edge';

// Bangladesh divisions
const BANGLADESH_DIVISIONS = [
  'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi',
  'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'
]

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30'

    const now = new Date()
    const daysAgo = new Date(now)
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Calculate previous period for comparison
    const previousDaysAgo = new Date(daysAgo)
    previousDaysAgo.setDate(previousDaysAgo.getDate() - parseInt(period))

    const daysAgoIso = daysAgo.toISOString()
    const previousDaysAgoIso = previousDaysAgo.toISOString()

    // Fetch current period orders with items and products
    const currentPeriodOrders = await queryAll<any>(
      env,
      `SELECT o.id, o.total, o.status, o.userId, o.createdAt, o.shippingAddress,
              oi.id as itemId, oi.productId, oi.price as itemPrice, oi.quantity,
              p.name as productName, p.basePrice, p.categoryId
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.orderId
       LEFT JOIN products p ON oi.productId = p.id
       WHERE o.createdAt >= ?
       ORDER BY o.createdAt DESC`,
      daysAgoIso
    )

    // Group orders by orderId
    const ordersMap = new Map<string, any>()
    for (const row of currentPeriodOrders) {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          id: row.id,
          total: row.total,
          status: row.status,
          userId: row.userId,
          createdAt: row.createdAt,
          shippingAddress: row.shippingAddress,
          items: [],
        })
      }
      if (row.itemId) {
        ordersMap.get(row.id)!.items.push({
          productId: row.productId,
          productName: row.productName,
          basePrice: row.basePrice,
          price: row.itemPrice,
          quantity: row.quantity,
          categoryId: row.categoryId,
        })
      }
    }

    const ordersList = Array.from(ordersMap.values())

    // Fetch previous period orders for comparison
    const previousOrders = await queryAll<any>(
      env,
      `SELECT o.id, o.total, oi.price as itemPrice, oi.quantity
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.orderId
       WHERE o.createdAt >= ? AND o.createdAt < ?`,
      previousDaysAgoIso,
      daysAgoIso
    )

    const previousOrdersMap = new Map<string, any>()
    for (const row of previousOrders) {
      if (!previousOrdersMap.has(row.id)) {
        previousOrdersMap.set(row.id, { total: 0 })
      }
      if (row.itemPrice) {
        previousOrdersMap.get(row.id)!.total += row.itemPrice * row.quantity
      }
    }

    const previousOrdersList = Array.from(previousOrdersMap.values())

    // Calculate totals
    const currentRevenue = ordersList.reduce((sum, order) => sum + order.total, 0)
    const previousRevenue = previousOrdersList.reduce((sum, order) => sum + order.total, 0)

    const currentOrdersCount = ordersList.length
    const previousOrdersCount = previousOrdersList.length

    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const ordersGrowth = previousOrdersCount > 0
      ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
      : 0

    const avgOrderValue = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0

    // Fetch categories for sales by category
    const allCategories = await queryAll<any>(
      env,
      'SELECT id, name FROM categories'
    )
    const categoryMap = new Map(allCategories.map(c => [c.id, c.name]))

    // Sales by category
    const salesByCategory: Record<string, { revenue: number; count: number }> = {}

    for (const order of ordersList) {
      for (const item of order.items) {
        const categoryName = categoryMap.get(item.categoryId) || 'Uncategorized'
        if (!salesByCategory[categoryName]) {
          salesByCategory[categoryName] = { revenue: 0, count: 0 }
        }
        salesByCategory[categoryName].revenue += item.price * item.quantity
        salesByCategory[categoryName].count += item.quantity
      }
    }

    const categorySales = Object.entries(salesByCategory).map(([name, data]) => ({
      name,
      value: data.revenue,
      count: data.count,
    }))

    // Sales by product (top products)
    const salesByProduct: Record<string, { name: string; revenue: number; count: number; category: string }> = {}

    for (const order of ordersList) {
      for (const item of order.items) {
        const productName = item.productName || 'Unknown'
        const categoryName = categoryMap.get(item.categoryId) || 'Uncategorized'
        if (!salesByProduct[productName]) {
          salesByProduct[productName] = {
            name: productName,
            revenue: 0,
            count: 0,
            category: categoryName,
          }
        }
        salesByProduct[productName].revenue += item.price * item.quantity
        salesByProduct[productName].count += item.quantity
      }
    }

    const topProducts = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Sales over time (daily/weekly/monthly)
    const salesOverTime: Record<string, { revenue: number; orders: number }> = {}
    for (const order of ordersList) {
      const date = new Date(order.createdAt)
      let key: string

      if (period === '7' || period === '30') {
        // Daily
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (period === '90') {
        // Weekly
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `Week ${Math.ceil(date.getDate() / 7)}`
      } else {
        // Monthly
        key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }

      if (!salesOverTime[key]) {
        salesOverTime[key] = { revenue: 0, orders: 0 }
      }
      salesOverTime[key].revenue += order.total
      salesOverTime[key].orders += 1
    }

    const salesChartData = Object.entries(salesOverTime).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }))

    // Order status distribution
    const statusDistribution: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    }

    for (const order of ordersList) {
      const status = order.status as keyof typeof statusDistribution
      if (statusDistribution[status] !== undefined) {
        statusDistribution[status]++
      }
    }

    const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value,
    }))

    // Customer metrics
    const currentCustomers = await queryAll<any>(
      env,
      'SELECT * FROM users WHERE role = ? AND createdAt >= ?',
      'user',
      daysAgoIso
    )

    const previousCustomers = await queryAll<any>(
      env,
      'SELECT * FROM users WHERE role = ? AND createdAt >= ? AND createdAt < ?',
      'user',
      previousDaysAgoIso,
      daysAgoIso
    )

    const totalCustomers = await count(env, 'users', 'WHERE role = ?', 'user')

    const newCustomerGrowth = previousCustomers.length > 0
      ? ((currentCustomers.length - previousCustomers.length) / previousCustomers.length) * 100
      : 0

    // Calculate returning customers (customers with more than 1 order)
    const customerOrderCounts: Record<string, number> = {}
    for (const order of ordersList) {
      if (order.userId) {
        customerOrderCounts[order.userId] = (customerOrderCounts[order.userId] || 0) + 1
      }
    }

    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length
    const newCustomers = currentOrdersCount - returningCustomers

    // Geographic distribution (simulated by shipping address division)
    const geographicDistribution: Record<string, number> = {}
    BANGLADESH_DIVISIONS.forEach(div => {
      geographicDistribution[div] = 0
    })

    for (const order of ordersList) {
      let address = order.shippingAddress
      try {
        address = typeof address === 'string' ? JSON.parse(address) : address
      } catch (e) {
        // address is already an object or invalid
      }
      const division = address?.division || 'Other'
      if (geographicDistribution[division] !== undefined) {
        geographicDistribution[division]++
      } else {
        geographicDistribution['Other'] = (geographicDistribution['Other'] || 0) + 1
      }
    }

    const geographicData = Object.entries(geographicDistribution)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }))

    return NextResponse.json({
      success: true,
      data: {
        period: parseInt(period),
        totalRevenue: currentRevenue,
        totalOrders: currentOrdersCount,
        avgOrderValue,
        topProducts,
        categorySales,
        salesChartData,
        statusChartData,
        customerMetrics: {
          total: totalCustomers,
          new: currentCustomers.length,
          newGrowth: newCustomerGrowth,
          returning: returningCustomers,
          returningRate: currentOrdersCount > 0 ? (returningCustomers / currentOrdersCount) * 100 : 0,
        },
        trends: {
          revenueGrowth,
          ordersGrowth,
          avgOrderValueGrowth: 0, // Would need historical data for this
        },
        geographicData,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
