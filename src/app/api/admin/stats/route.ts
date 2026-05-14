import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { count, queryAll, numberToBool, parseJSON } from '@/db/db'
import prisma from '@/lib/database'
import { shouldUsePrisma } from '@/db/unified-db'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
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

    // Check if we should use Prisma (local development) or D1 (production)
    const usePrisma = shouldUsePrisma(env)

    let totalProducts = 0
    let activeProducts = 0
    let lowStockProducts = 0
    let outOfStockProducts = 0

    if (usePrisma) {
      // Use Prisma for local development
      const products = await prisma.products.findMany({
        select: {
          id: true,
          isActive: true,
          stock: true,
        },
      })
      totalProducts = products.length
      activeProducts = products.filter(p => p.isActive === 1).length
      lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length
      outOfStockProducts = products.filter(p => p.stock === 0).length
    } else {
      // Use D1 for production
      const productStats = await Promise.all([
        count(env, 'SELECT COUNT(*) as count FROM products'),
        count(env, 'SELECT COUNT(*) as count FROM products WHERE isActive = 1'),
        count(env, 'SELECT COUNT(*) as count FROM products WHERE stock > 0 AND stock < 10'),
        count(env, 'SELECT COUNT(*) as count FROM products WHERE stock = 0'),
      ])
      totalProducts = productStats[0]
      activeProducts = productStats[1]
      lowStockProducts = productStats[2]
      outOfStockProducts = productStats[3]
    }

    let totalOrders = 0
    let pendingOrders = 0
    let processingOrders = 0
    let completedOrders = 0
    let cancelledOrders = 0

    if (usePrisma) {
      // Use Prisma for local development
      const orders = await prisma.orders.findMany({
        select: {
          status: true,
        },
      })
      totalOrders = orders.length
      pendingOrders = orders.filter(o => o.status === 'PENDING').length
      processingOrders = orders.filter(o => o.status === 'PROCESSING').length
      completedOrders = orders.filter(o => o.status === 'DELIVERED').length
      cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length
    } else {
      // Use D1 for production
      const orderStats = await Promise.all([
        count(env, 'SELECT COUNT(*) as count FROM orders'),
        count(env, 'SELECT COUNT(*) as count FROM orders WHERE status = ?', 'PENDING'),
        count(env, 'SELECT COUNT(*) as count FROM orders WHERE status = ?', 'PROCESSING'),
        count(env, 'SELECT COUNT(*) as count FROM orders WHERE status = ?', 'DELIVERED'),
        count(env, 'SELECT COUNT(*) as count FROM orders WHERE status = ?', 'CANCELLED'),
      ])
      totalOrders = orderStats[0]
      pendingOrders = orderStats[1]
      processingOrders = orderStats[2]
      completedOrders = orderStats[3]
      cancelledOrders = orderStats[4]
    }

    let totalCustomers = 0
    let activeCustomers = 0

    if (usePrisma) {
      // Use Prisma for local development
      const customers = await prisma.users.findMany({
        where: { role: 'user' },
        select: {
          id: true,
          isBanned: true,
        },
      })
      totalCustomers = customers.length
      activeCustomers = customers.filter(c => !c.isBanned).length
    } else {
      // Use D1 for production
      const customerStats = await Promise.all([
        count(env, 'SELECT COUNT(*) as count FROM users WHERE role = ?', 'user'),
        count(env, 'SELECT COUNT(*) as count FROM users WHERE role = ? AND (isBanned IS NULL OR isBanned = 0)', 'user'),
      ])
      totalCustomers = customerStats[0]
      activeCustomers = customerStats[1]
    }

    // Get orders with items for the period
    let ordersList: any[] = []

    if (usePrisma) {
      // Use Prisma for local development
      const prismaOrders = await prisma.orders.findMany({
        where: {
          createdAt: { gte: daysAgo },
        },
        include: {
          order_items: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      ordersList = prismaOrders.map(order => {
        const total = order.order_items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
        const itemsCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0)
        return {
          ...order,
          total,
          itemsCount,
        }
      })
    } else {
      // Use D1 for production
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

      ordersList = Array.from(ordersMap.values())
    }

    const totalRevenue = ordersList.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalItemsSold = ordersList.reduce((sum, order) => sum + (order.itemsCount || 0), 0)
    const avgOrderValue = ordersList.length > 0 ? totalRevenue / ordersList.length : 0

    // Get previous period orders for comparison
    let previousOrdersList: any[] = []

    if (usePrisma) {
      // Use Prisma for local development
      const prismaPreviousOrders = await prisma.orders.findMany({
        where: {
          createdAt: {
            gte: previousDaysAgo,
            lt: daysAgo,
          },
        },
        include: {
          order_items: true,
        },
      })

      previousOrdersList = prismaPreviousOrders.map(order => {
        const total = order.order_items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
        return {
          id: order.id,
          total,
        }
      })
    } else {
      // Use D1 for production
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

      previousOrdersList = Array.from(previousOrdersMap.values())
    }

    const previousRevenue = previousOrdersList.reduce((sum, order) => sum + (order.total || 0), 0)
    const previousOrdersCount = previousOrdersList.length

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const ordersGrowth = previousOrdersCount > 0
      ? ((ordersList.length - previousOrdersCount) / previousOrdersCount) * 100
      : 0

    // Customer metrics for the period
    let currentPeriodCustomers: any[] = []
    let previousPeriodCustomers: any[] = []

    if (usePrisma) {
      // Use Prisma for local development
      currentPeriodCustomers = await prisma.users.findMany({
        where: {
          role: 'user',
          createdAt: { gte: daysAgo },
        },
      })

      previousPeriodCustomers = await prisma.users.findMany({
        where: {
          role: 'user',
          createdAt: {
            gte: previousDaysAgo,
            lt: daysAgo,
          },
        },
      })
    } else {
      // Use D1 for production
      currentPeriodCustomers = await queryAll<any>(
        env,
        `SELECT * FROM users WHERE role = ? AND createdAt >= ?`,
        'user',
        daysAgoIso
      )

      previousPeriodCustomers = await queryAll<any>(
        env,
        `SELECT * FROM users WHERE role = ? AND createdAt >= ? AND createdAt < ?`,
        'user',
        previousDaysAgoIso,
        daysAgoIso
      )
    }

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
    let topProductsData: any[] = []

    if (usePrisma) {
      // Use Prisma for local development
      const products = await prisma.products.findMany({
        include: {
          order_items: {
            include: {
              orders: true,
            },
          },
        },
      })

      topProductsData = products
        .map(p => ({
          id: p.id,
          name: p.name,
          price: p.basePrice || 0,
          sales: p.order_items.filter(oi => oi.orders.createdAt >= daysAgo).length,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
    } else {
      // Use D1 for production
      topProductsData = await queryAll<any>(
        env,
        `SELECT p.id, p.name, p.basePrice as price,
                COUNT(CASE WHEN o.createdAt >= ? THEN oi.id END) as sales
         FROM products p
         LEFT JOIN order_items oi ON p.id = oi.productId
         LEFT JOIN orders o ON oi.orderId = o.id
         GROUP BY p.id
         ORDER BY sales DESC
         LIMIT 5`,
        daysAgoIso
      )
    }

    // Top customers (by orders in period)
    let topCustomersData: any[] = []

    if (usePrisma) {
      // Use Prisma for local development
      const customers = await prisma.users.findMany({
        where: { role: 'user' },
        include: {
          orders: {
            where: {
              createdAt: { gte: daysAgo },
            },
          },
        },
      })

      topCustomersData = customers
        .map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          orders: c.orders.length,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5)
    } else {
      // Use D1 for production
      topCustomersData = await queryAll<any>(
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
    }

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
