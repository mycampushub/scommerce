import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Bangladesh divisions
const BANGLADESH_DIVISIONS = [
  'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi',
  'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'
]

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

    // Fetch current period data
    const currentPeriodOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: daysAgo,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    // Fetch previous period data for comparison
    const previousPeriodOrders = await db.order.findMany({
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

    // Calculate totals
    const currentRevenue = currentPeriodOrders.reduce((sum, order) => sum + order.total, 0)
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total, 0)

    const currentOrdersCount = currentPeriodOrders.length
    const previousOrdersCount = previousPeriodOrders.length

    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    const ordersGrowth = previousOrdersCount > 0
      ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
      : 0

    const avgOrderValue = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0

    // Sales by category
    const salesByCategory: Record<string, { revenue: number; count: number }> = {}

    for (const order of currentPeriodOrders) {
      for (const item of order.orderItems) {
        const categoryName = item.product?.category?.name || 'Uncategorized'
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

    for (const order of currentPeriodOrders) {
      for (const item of order.orderItems) {
        const productName = item.productName || 'Unknown'
        if (!salesByProduct[productName]) {
          salesByProduct[productName] = {
            name: productName,
            revenue: 0,
            count: 0,
            category: item.product?.category?.name || 'Uncategorized',
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

    for (const order of currentPeriodOrders) {
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

    for (const order of currentPeriodOrders) {
      statusDistribution[order.status]++
    }

    const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value,
    }))

    // Customer metrics
    const currentCustomers = await db.user.findMany({
      where: {
        role: 'user',
        createdAt: {
          gte: daysAgo,
        },
      },
    })

    const previousCustomers = await db.user.findMany({
      where: {
        role: 'user',
        createdAt: {
          gte: previousDaysAgo,
          lt: daysAgo,
        },
      },
    })

    const totalCustomers = await db.user.count({
      where: { role: 'user' },
    })

    const newCustomerGrowth = previousCustomers.length > 0
      ? ((currentCustomers.length - previousCustomers.length) / previousCustomers.length) * 100
      : 0

    // Calculate returning customers (customers with more than 1 order)
    const customerOrderCounts: Record<string, number> = {}
    for (const order of currentPeriodOrders) {
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

    for (const order of currentPeriodOrders) {
      const address = order.shippingAddress as any
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
