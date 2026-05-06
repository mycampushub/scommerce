import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, now, numberToBool } from '@/db/db'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30'

    // Parse period to days
    const periodDays = parseInt(period)

    // Create dates in user's timezone (Asia/Dhaka)
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - periodDays)
    startDate.setHours(0, 0, 0, 0)

    // Use UTC date to ensure consistency
    // Note: For Asia/Dhaka timezone, this ensures date boundaries are consistent
    const startDateIso = startDate.toISOString()

    // Get products with sales data from orders
    const products = await queryAll<any>(
      env,
      `SELECT p.id, p.name, p.slug, p.basePrice as price,
         COUNT(DISTINCT o.id) as orderCount,
         SUM(oi.quantity) as totalItems,
         SUM(oi.quantity * p.price) as revenue
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.productId
       LEFT JOIN orders o ON o.id = oi.orderId
       WHERE p.isActive = 1
       AND o.createdAt >= ?
       GROUP BY p.id
       HAVING COUNT(o.id) > 0
       ORDER BY revenue DESC
       LIMIT 1000
    `,
      startDateIso
    )

    // Calculate metrics from product data
    const totalRevenue = products.reduce((sum: number, product: any) => {
      return sum + (product.revenue || 0)
    }, 0)

    const totalOrders = products.reduce((sum: number, product: any) => {
      return sum + (product.orderCount || 0)
    }, 0)

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group sales by date for chart
    const salesByDate: Record<string, { revenue: number; orders: number }> = {}
    const salesByDateRows = await queryAll<any>(
      env,
      `SELECT DATE(o.createdAt) as date, COUNT(DISTINCT o.id) as orders,
         SUM(oi.quantity * p.price) as revenue
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.orderId
       LEFT JOIN products p ON oi.productId = p.id
       WHERE o.createdAt >= ?
       GROUP BY DATE(o.createdAt)
       ORDER BY date ASC`,
      startDateIso
    )

    salesByDateRows.forEach((row: any) => {
        const date = row.date || new Date().toISOString().split('T')[0]
        salesByDate[date] = {
          revenue: (salesByDate[date]?.revenue || 0) + (row.revenue || 0),
          orders: (salesByDate[date]?.orders || 0) + (row.orders || 0)
        }
      })

    const salesChartData = Object.entries(salesByDate).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    }))

    const categorySalesData = await queryAll<any>(
      env,
      `SELECT c.name as name, c.slug as slug, COUNT(DISTINCT o.id) as orderCount,
         SUM(oi.quantity * p.price) as revenue
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       LEFT JOIN order_items oi ON p.id = oi.productId
       LEFT JOIN orders o ON o.id = oi.orderId
       WHERE p.isActive = 1
       AND o.createdAt >= ?
       GROUP BY c.name, c.slug
       HAVING COUNT(o.id) > 0
       ORDER BY revenue DESC
       LIMIT 5
    `,
      startDateIso
    )

    const categoriesData = categorySalesData.map((item: any) => ({
      name: item.name,
      value: item.revenue,
      slug: item.slug
    }))

    const topProducts = await queryAll<any>(
      env,
      `SELECT p.id, p.name, p.slug, p.basePrice as price, c.name as category,
         COUNT(DISTINCT o.id) as orderCount,
         SUM(oi.quantity * p.price) as revenue
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       LEFT JOIN order_items oi ON p.id = oi.productId
       LEFT JOIN orders o ON o.id = oi.orderId
       WHERE p.isActive = 1
       AND o.createdAt >= ?
       GROUP BY p.id
       HAVING COUNT(o.id) > 0
       ORDER BY revenue DESC
       LIMIT 5
    `,
      startDateIso
    )

    const topProductsData = topProducts.map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: item.category,
      price: item.price,
      count: item.orderCount,
      revenue: item.revenue
    }))

    // Order status distribution
    const statusData = await queryAll<any>(
      env,
      `SELECT o.status, COUNT(DISTINCT o.id) as count
       FROM orders o
       WHERE o.createdAt >= ?
       GROUP BY o.status
       ORDER BY COUNT(DISTINCT o.id) DESC
       LIMIT 10
    `,
      startDateIso
    )

    const statusDistribution = statusData.map((item: any) => ({
      name: item.status,
      value: item.count
    }))

    // Customer metrics
    const totalCustomers = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(DISTINCT userId) as count
       FROM users
       WHERE role = 'user'
    `
    )

    const newCustomers = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(DISTINCT userId) as count
       FROM users
       WHERE role = 'user'
       AND createdAt >= ?
    `,
      startDateIso
    )

    // Geographic data - orders by division
    const geographicData = await queryAll<any>(
      env,
      `SELECT 
         COALESCE(o.division, 'Unknown') as name,
         COUNT(DISTINCT o.id) as value
       FROM orders o
       WHERE o.createdAt >= ?
       GROUP BY COALESCE(o.division, 'Unknown')
       ORDER BY COUNT(DISTINCT o.id) DESC
      `,
      startDateIso
    )

    const totalRevenueCalc = salesChartData.reduce((sum: number, item: any) => sum + item.revenue, 0)
    const orderGrowth = 0 // Would need historical data for trends
    const revenueGrowth = 0 // Would need historical data for trends
    const customerGrowth = totalCustomers && totalCustomers.count > 0
      ? ((newCustomers!.count / totalCustomers.count) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        salesChartData,
        categorySales: categorySalesData,
        topProducts,
        statusChartData: statusData,
        customerMetrics: {
          total: totalCustomers?.count || 0,
          new: newCustomers?.count || 0,
          returningRate: totalCustomers && totalCustomers.count > 0
            ? ((totalCustomers.count - (newCustomers!.count || 0)) / totalCustomers.count) * 100
            : 0
        },
        geographicData,
        trends: {
          revenueGrowth,
          orderGrowth,
          customerGrowth
        },
        totalRevenue: totalRevenueCalc,
        totalOrders,
        avgOrderValue,
        period
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
