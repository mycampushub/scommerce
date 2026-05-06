import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { createOrderSchema } from '@/lib/validations'
import { queryAll, execute, parseJSON, generateId, generateOrderNumber, now, count } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'total', 'customerName', 'orderNumber', 'status']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Build WHERE clause for filters
    const conditions: string[] = []
    const params: unknown[] = []

    // Apply search to SQL WHERE clause
    if (search) {
      conditions.push('(orderNumber LIKE ? OR customerName LIKE ? OR customerEmail LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    // Apply status filter to SQL WHERE clause
    if (status && status !== 'all') {
      conditions.push('o.status = ?')
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Fetch orders with user details and pagination
    const orders = await queryAll<any>(
      env,
      `SELECT
         o.*,
         u.id as userId,
         u.name as userName,
         u.email as userEmail,
         u.role as userRole
       FROM orders o
       LEFT JOIN users u ON o.userId = u.id
       ${whereClause}
       ORDER BY o.${validSortBy} ${validSortOrder}
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    // Fetch order items for these orders (single query)
    let orderItems: any[] = []
    if (orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id)
      const placeholders = orderIds.map(() => '?').join(',')

      orderItems = await queryAll<any>(
        env,
        `SELECT oi.*
         FROM order_items oi
         WHERE oi.orderId IN (${placeholders})
         ORDER BY oi.createdAt ASC`,
        ...orderIds
      )
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

    // Get total count for pagination
    const totalOrders = await count(
      env,
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      ...params
    )

    const totalPages = Math.ceil(totalOrders / limit)

    return NextResponse.json({
      success: true,
      data: enrichedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      sort: {
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
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
  const env = getEnv()
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
            'Retry-After': Math.ceil(((rateLimitResult.resetTime || 0) - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  }

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

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

    const orderNumber = generateOrderNumber()

    // Use transaction-based order creation for data integrity
    // This ensures all order items are created atomically with the order
    // If any item creation fails, the entire order is rolled back
    if (validatedData.orderItems && Array.isArray(validatedData.orderItems) && validatedData.orderItems.length > 0) {
      // Create order with items in a single transaction
      const order = await OrderRepository.createWithItems(
        env,
        {
          userId: validatedData.userId,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          shippingAddress: typeof validatedData.shippingAddress === 'string'
            ? validatedData.shippingAddress
            : JSON.stringify(validatedData.shippingAddress),
          billingAddress: validatedData.billingAddress
            ? (typeof validatedData.billingAddress === 'string'
                ? validatedData.billingAddress
                : JSON.stringify(validatedData.billingAddress))
            : undefined,
          city: body.city,
          district: body.district,
          division: body.division,
          subtotal: validatedData.subtotal,
          shipping: validatedData.shipping,
          tax: validatedData.tax,
          discount: validatedData.discount,
          total: validatedData.total,
          paymentMethod: validatedData.paymentMethod,
        },
        validatedData.orderItems
      )

      // Enrich with user and items for response
      if (order.userId) {
        const user = await UserRepository.findById(env, order.userId)
        ;(order as any).user = user || null
      }
      const items = await OrderRepository.getItems(env, order.id)
      ;(order as any).orderItems = items

      return NextResponse.json({
        success: true,
        data: order,
      })
    } else {
      // Fallback: Create order without items (legacy behavior)
      // This path is used when orderItems is not provided or empty
      const order = await OrderRepository.create(env, {
        userId: validatedData.userId,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        shippingAddress: typeof validatedData.shippingAddress === 'string'
          ? validatedData.shippingAddress
          : JSON.stringify(validatedData.shippingAddress),
        billingAddress: validatedData.billingAddress
          ? (typeof validatedData.billingAddress === 'string'
              ? validatedData.billingAddress
              : JSON.stringify(validatedData.billingAddress))
          : undefined,
        city: body.city,
        district: body.district,
        division: body.division,
        subtotal: validatedData.subtotal,
        shipping: validatedData.shipping,
        tax: validatedData.tax,
        discount: validatedData.discount,
        total: validatedData.total,
        paymentMethod: validatedData.paymentMethod,
      })

      // Create order items (non-transactional - legacy behavior)
      if (validatedData.orderItems && Array.isArray(validatedData.orderItems)) {
        for (const item of validatedData.orderItems) {
          await OrderRepository.addItem(env, {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName,
            productImage: item.productImage,
          })
        }
      }

      // Enrich with user and items
      if (order.userId) {
        const user = await UserRepository.findById(env, order.userId)
        ;(order as any).user = user || null
      }
      const items = await OrderRepository.getItems(env, order.id)
      ;(order as any).orderItems = items

      return NextResponse.json({
        success: true,
        data: order,
      })
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
