import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { parseJSON } from '@/db/db'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get D1 database from request context
  const env = getEnv(request)

  try {
    const { id } = await params

    // Fetch order by ID
    const order = await OrderRepository.findById(env, id)

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // Fetch order items
    const orderItems = await OrderRepository.getItems(env, id)

    // Fetch user if exists
    let user = null
    if (order.userId) {
      user = await UserRepository.findById(env, order.userId)
    }

    // Parse JSON fields
    const shippingAddress = order.shippingAddress ? parseJSON(order.shippingAddress) : null
    const billingAddress = order.billingAddress ? parseJSON(order.billingAddress) : null

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        shippingAddress,
        billingAddress,
        orderItems,
        user,
      },
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order',
      },
      { status: 500 }
    )
  }
}
