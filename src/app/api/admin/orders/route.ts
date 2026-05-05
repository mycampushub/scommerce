import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { createOrderSchema } from '@/lib/validations'
import { queryAll, execute, parseJSON, generateId, generateOrderNumber, now } from '@/db/db'
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

    // Fetch orders with user details in a single query using JOIN
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
       ORDER BY o.createdAt DESC`
    )

    // Fetch all order items in a single query
    const orderItems = await queryAll<any>(
      env,
      `SELECT oi.*
       FROM order_items oi
       INNER JOIN orders o ON oi.orderId = o.id
       ORDER BY o.createdAt DESC`
    )

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

    // Apply filters after fetching
    let filteredOrders = enrichedOrders
    if (search) {
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          order.customerName.toLowerCase().includes(search.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter((order) => order.status === status)
    }

    return NextResponse.json({
      success: true,
      data: filteredOrders,
      total: filteredOrders.length,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
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

    // Create order items
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
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500 }
    )
  }
}
