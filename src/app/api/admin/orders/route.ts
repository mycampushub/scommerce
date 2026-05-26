import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { createOrderSchema } from '@/lib/validations/index'
import { queryAll, queryFirst, execute, generateId, generateOrderNumber, now } from '@/db/db'
import { rateLimit } from '@/lib/rate-limit'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { withTransaction, trackInsertForRollback } from '@/db/transaction'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    console.log('[orders API] Fetching orders with filters:', { search, status, dateFrom, dateTo, page, limit })

    let orders: any[] = []
    let orderItems: any[] = []

    // Build WHERE clause with all filters
    let whereClause = ' AND o.deletedAt IS NULL'
    const whereParams: any[] = []

    if (search) {
      whereClause += ' AND (o.orderNumber LIKE ? OR o.customerName LIKE ? OR o.customerEmail LIKE ?)'
      const searchPattern = `%${search}%`
      whereParams.push(searchPattern, searchPattern, searchPattern)
    }

    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?'
      whereParams.push(status)
    }

    if (dateFrom) {
      whereClause += ' AND o.createdAt >= ?'
      whereParams.push(dateFrom)
    }

    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      whereClause += ' AND o.createdAt < ?'
      whereParams.push(endDate.toISOString())
    }

    // Get total count for pagination
    const countResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM orders o WHERE 1=1${whereClause}`,
      ...(whereParams || [])
    )
    const totalCount = countResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Fetch orders with user details in a single query using JOIN with pagination
    orders = await queryAll<any>(
      env,
      `SELECT
         o.*,
         u.id as userId,
         u.name as userName,
         u.email as userEmail,
         u.role as userRole
       FROM orders o
       LEFT JOIN users u ON o.userId = u.id
       WHERE 1=1${whereClause}
       ORDER BY o.createdAt DESC
       LIMIT ? OFFSET ?`,
      ...(whereParams || []),
      limit,
      offset
    )

    console.log('[orders API] Fetched orders:', orders.length)

    // Fetch order items only for the fetched orders
    if (orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id)
      const placeholders = orderIds.map(() => '?').join(',')

      orderItems = await queryAll<any>(
        env,
        `SELECT oi.*
         FROM order_items oi
         WHERE oi.orderId IN (${placeholders})
         ORDER BY oi.createdAt ASC`,
        ...(orderIds || [])
      )

      console.log('[orders API] Fetched order items:', orderItems.length)
    }

    // Group order items by orderId
    const itemsByOrderId = new Map<string, any[]>()
    for (const item of orderItems) {
      if (!itemsByOrderId.has(item.orderId)) {
        itemsByOrderId.set(item.orderId, [])
      }
      itemsByOrderId.get(item.orderId)!.push(item)
    }

    // Combine orders with their items and user info
    const enrichedOrders = orders.map((order: any) => ({
      ...order,
      user: order.userId ? {
        id: order.userId,
        name: order.userName,
        email: order.userEmail,
        role: order.userRole
      } : null,
      orderItems: itemsByOrderId.get(order.id) || []
    }))

    return NextResponse.json({
      success: true,
      data: enrichedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('[orders API] Error fetching orders:', error)
    console.error('[orders API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Get admin user ID for rate limiting
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('session')?.value
  const token = extractTokenFromHeader(authHeader) || cookieToken
  let userId: string | undefined

  if (token) {
    const payload = await verifyToken(token)
    if (payload && payload.userId) {
      userId = payload.userId
    }
  }

  // Rate limiting: 100 orders per hour per admin
  const env = await getEnv()
  if (userId) {
    const rateLimitKey = `admin-order-create:${userId}`
    const rateLimitResult = await rateLimit(env, rateLimitKey, {
      maxRequests: 100,
      windowMs: 3600000, // 1 hour in milliseconds
    })

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many order attempts. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(((rateLimitResult.reset || 0) - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }

  // Use transaction to ensure atomicity of order + order items creation
  return withTransaction(env, async (transaction) => {
    try {
      const body: any = await request.json() as any

      // Validate with Zod
      const validation = createOrderSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.issues[0].message },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      // Extract city, district, division from address (they're in the address object)
      const shippingAddr = typeof validatedData.shippingAddress === 'string'
        ? null
        : validatedData.shippingAddress;
      const billingAddr = typeof validatedData.billingAddress === 'string'
        ? null
        : validatedData.billingAddress;

      const orderNumber = generateOrderNumber()
      const orderId = generateId()

      // Create order within transaction
      await execute(
        transaction.env,
        `INSERT INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone, shippingAddress, billingAddress, city, district, division, subtotal, shipping, tax, discount, total, paymentMethod, status, paymentStatus, trackingStatus, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          validatedData.userId || null,
          validatedData.customerName,
          validatedData.customerEmail,
          validatedData.customerPhone || null,
          typeof validatedData.shippingAddress === 'string'
            ? validatedData.shippingAddress
            : JSON.stringify(validatedData.shippingAddress),
          validatedData.billingAddress
            ? (typeof validatedData.billingAddress === 'string'
                ? validatedData.billingAddress
                : JSON.stringify(validatedData.billingAddress))
            : null,
          shippingAddr?.city || null,
          shippingAddr?.district || null,
          shippingAddr?.division || null,
          validatedData.subtotal,
          validatedData.shipping,
          validatedData.tax,
          validatedData.discount,
          validatedData.total,
          validatedData.paymentMethod || null,
          'PENDING',
          'PENDING',
          'PENDING',
          now(),
          now()
        ]
      )

      // Track order for rollback
      trackInsertForRollback(transaction, 'orders', orderId)

      // Create order items within transaction
      if (validatedData.orderItems && Array.isArray(validatedData.orderItems)) {
        for (const item of validatedData.orderItems) {
          const itemId = generateId()
          await execute(
            transaction.env,
            `INSERT INTO order_items (id, orderId, productId, variantId, quantity, price, productName, productImage, variantSku, variantSize, variantColor, variantMaterial, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              orderId,
              item.productId,
              item.variantId || null,
              item.quantity,
              item.price,
              item.productName,
              item.productImage || null,
              item.variantSku || null,
              item.variantSize || null,
              item.variantColor || null,
              item.variantMaterial || null,
              now()
            ]
          )
          // Track order item for rollback
          trackInsertForRollback(transaction, 'order_items', itemId)
        }
      }

      // Fetch the created order with user details
      let order: any = await queryFirst<any>(
        transaction.env,
        `SELECT * FROM orders WHERE id = ?`,
        orderId
      )

      // Enrich with user and items
      if (order.userId) {
        const user = await UserRepository.findById(transaction.env, order.userId)
        ;(order as any).user = user || null
      }

      const items = await queryAll<any>(
        transaction.env,
        `SELECT * FROM order_items WHERE orderId = ?`,
        orderId
      )
      ;(order as any).orderItems = items

      return NextResponse.json({
        success: true,
        data: order,
      })
    } catch (error) {
      console.error('Error creating order:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
}
