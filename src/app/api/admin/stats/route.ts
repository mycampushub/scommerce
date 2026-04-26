import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30'

    const now = new Date()
    const daysAgo = new Date(now)
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))

    // Calculate previous period for comparison
    const previousDaysAgo = new Date(daysAgo)
    previousDaysAgo.setDate(previousDaysAgo.getDate() - parseInt(period))

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      activeCustomers,
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      db.product.count({ where: { stock: { gt: 0, lt: 10 } } }),
      db.product.count({ where: { stock: 0 } }),
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'PROCESSING' } }),
      db.order.count({ where: { status: 'DELIVERED' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
      db.user.count(),
      db.user.count({ where: { role: 'user' } }),
    ])

    const orders = await db.order.findMany({
      where: {
        createdAt: {
          gte: daysAgo,
        },
      },
      include: {
        orderItems: true,
      },
    })

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.total,
      0
    )

    const totalItemsSold = orders.reduce(
      (sum, order) => sum + order.orderItems.reduce((s, i) => s + i.quantity, 0),
      0
    )

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    // Calculate previous period for comparison
    const previousOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: previousDaysAgo,
          lt: daysAgo,
        },
      },
      include: {
        orderItems: true,
      },
    })

    const previousRevenue = previousOrders.reduce(
      (sum, order) => sum + order.total,
      0
    )

    const previousOrdersCount = previousOrders.length

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const ordersGrowth = previousOrdersCount > 0
      ? ((orders.length - previousOrdersCount) / previousOrdersCount) * 100
      : 0

    // Customer metrics
    const currentPeriodCustomers = await db.user.findMany({
      where: {
        role: 'user',
        createdAt: {
          gte: daysAgo,
        },
      },
    })

    const previousPeriodCustomers = await db.user.findMany({
      where: {
        role: 'user',
        createdAt: {
          gte: previousDaysAgo,
          lt: daysAgo,
        },
      },
    })

    const newCustomerGrowth = previousPeriodCustomers.length > 0
      ? ((currentPeriodCustomers.length - previousPeriodCustomers.length) / previousPeriodCustomers.length) * 100
      : 0

    // Calculate returning customers
    const customerOrderCounts: Record<string, number> = {}
    for (const order of orders) {
      if (order.userId) {
        customerOrderCounts[order.userId] = (customerOrderCounts[order.userId] || 0) + 1
      }
    }

    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length
    const returningRate = orders.length > 0 ? (returningCustomers / orders.length) * 100 : 0

    const topProducts = await db.product.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        orderItems: {
          _count: 'desc',
        },
      },
    })

    const topCustomers = await db.user.findMany({
      take: 5,
      where: {
        role: 'user',
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        orders: {
          _count: 'desc',
        },
      },
    })

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
        period: parseInt(period),
        topProducts: topProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          sales: product._count.orderItems,
        })),
        topCustomers: topCustomers.map((customer) => ({
          id: customer.id,
          name: customer.name || customer.email,
          email: customer.email,
          orders: customer._count.orders,
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
