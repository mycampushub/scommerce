import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    // Fetch order with tracking information
    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      )
    }

    // Simulate courier tracking (Pathao, RedX, SA Paribahan)
    // In production, this would integrate with actual courier APIs
    const courierProviders = [
      { name: 'Pathao', trackingUrl: 'https://pathao.com/track' },
      { name: 'RedX', trackingUrl: 'https://redx.com.bd/track' },
      { name: 'SA Paribahan', trackingUrl: 'https://paribahan.com/track' },
    ]

    // Select courier based on tracking number hash
    const selectedCourier = order.trackingNumber
      ? courierProviders[
          order.trackingNumber.charCodeAt(0) % courierProviders.length
        ]
      : null

    // Generate tracking timeline
    const trackingTimeline = generateTrackingTimeline(order)

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          trackingStatus: order.trackingStatus,
          trackingNumber: order.trackingNumber,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
        },
        shipping: {
          address: order.shippingAddress,
          city: order.city,
          district: order.district,
          division: order.division,
        },
        courier: selectedCourier
          ? {
              name: selectedCourier.name,
              trackingUrl: `${selectedCourier.trackingUrl}/${order.trackingNumber}`,
            }
          : null,
        timeline: trackingTimeline,
        items: order.orderItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching order tracking:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tracking information',
      },
      { status: 500 }
    )
  }
}

function generateTrackingTimeline(order: any) {
  const timeline = [
    {
      status: 'Ordered',
      description: 'Order has been placed successfully',
      date: order.createdAt,
      completed: true,
    },
  ]

  // Add timeline steps based on order status
  if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
    timeline.push({
      status: 'Confirmed',
      description: 'Order has been confirmed',
      date: new Date(order.createdAt.getTime() + 30 * 60 * 1000), // +30 minutes
      completed: true,
    })
  } else {
    timeline.push({
      status: 'Confirmed',
      description: 'Order confirmation pending',
      date: null,
      completed: false,
    })
  }

  if (['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    timeline.push({
      status: 'Processing',
      description: 'Order is being processed and packed',
      date: new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000), // +2 hours
      completed: true,
    })
  } else {
    timeline.push({
      status: 'Processing',
      description: 'Order processing pending',
      date: null,
      completed: false,
    })
  }

  if (['SHIPPED', 'DELIVERED'].includes(order.status) && order.trackingStatus) {
    const trackingStatuses = {
      PENDING: 'Awaiting pickup',
      IN_TRANSIT: 'In transit',
      OUT_FOR_DELIVERY: 'Out for delivery',
      DELIVERED: 'Delivered',
    }

    timeline.push({
      status: 'Shipped',
      description: `Order is ${trackingStatuses[order.trackingStatus] || 'shipped'}`,
      date: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000), // +1 day
      completed: true,
    })
  } else {
    timeline.push({
      status: 'Shipped',
      description: order.status === 'CANCELLED' ? 'Order cancelled' : 'Awaiting shipment',
      date: null,
      completed: false,
    })
  }

  if (order.status === 'DELIVERED' && order.trackingStatus === 'DELIVERED') {
    timeline.push({
      status: 'Delivered',
      description: 'Order has been delivered successfully',
      date: order.estimatedDeliveryDate || new Date(),
      completed: true,
    })
  } else {
    timeline.push({
      status: 'Delivered',
      description: order.status === 'CANCELLED'
        ? 'Order cancelled'
        : order.estimatedDeliveryDate
          ? `Estimated delivery by ${order.estimatedDeliveryDate.toLocaleDateString()}`
          : 'Delivery date pending',
      date: order.estimatedDeliveryDate || null,
      completed: order.status === 'DELIVERED',
    })
  }

  return timeline
}
