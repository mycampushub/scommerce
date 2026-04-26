import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    let orders = await db.order.findMany({
      include: {
        user: true,
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (search) {
      orders = orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          order.customerName.toLowerCase().includes(search.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status && status !== 'all') {
      orders = orders.filter((order) => order.status === status)
    }

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
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
    const body = await request.json()

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: body.userId,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
        subtotal: parseFloat(body.subtotal),
        shipping: parseFloat(body.shipping) || 0,
        tax: parseFloat(body.tax) || 0,
        discount: parseFloat(body.discount) || 0,
        total: parseFloat(body.total),
        status: body.status || 'PENDING',
        paymentStatus: body.paymentStatus || 'PENDING',
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        orderItems: {
          create: body.orderItems.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            productName: item.productName,
            productImage: item.productImage,
          })),
        },
      },
      include: {
        user: true,
        orderItems: true,
      },
    })

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
