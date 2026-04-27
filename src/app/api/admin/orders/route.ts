import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { queryAll, execute, parseJSON, generateId, generateOrderNumber, now } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
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
  try {
    const env = getEnv(request)
    const body = await request.json()

    const orderNumber = generateOrderNumber()

    const order = await OrderRepository.create(env, {
      userId: body.userId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      shippingAddress: typeof body.shippingAddress === 'string'
        ? body.shippingAddress
        : JSON.stringify(body.shippingAddress),
      billingAddress: typeof body.billingAddress === 'string'
        ? body.billingAddress
        : JSON.stringify(body.billingAddress),
      city: body.city,
      district: body.district,
      division: body.division,
      subtotal: parseFloat(body.subtotal),
      shipping: parseFloat(body.shipping) || 0,
      tax: parseFloat(body.tax) || 0,
      discount: parseFloat(body.discount) || 0,
      total: parseFloat(body.total),
      paymentMethod: body.paymentMethod,
    })

    // Create order items
    if (body.orderItems && Array.isArray(body.orderItems)) {
      for (const item of body.orderItems) {
        await OrderRepository.addItem(env, {
          orderId: order.id,
          productId: item.productId,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
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
