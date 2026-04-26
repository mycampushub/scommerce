import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
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

    return NextResponse.json({
      success: true,
      data: order,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const order = await db.order.update({
      where: {
        id,
      },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.paymentStatus && { paymentStatus: body.paymentStatus }),
        ...(body.trackingNumber !== undefined && { trackingNumber: body.trackingNumber }),
        ...(body.trackingStatus !== undefined && { trackingStatus: body.trackingStatus }),
        ...(body.estimatedDeliveryDate !== undefined && {
          estimatedDeliveryDate: body.estimatedDeliveryDate ? new Date(body.estimatedDeliveryDate) : null,
        }),
        ...(body.shipping !== undefined && { shipping: parseFloat(body.shipping) }),
        ...(body.tax !== undefined && { tax: parseFloat(body.tax) }),
        ...(body.discount !== undefined && { discount: parseFloat(body.discount) }),
        ...(body.notes !== undefined && { notes: body.notes }),
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
    console.error('Error updating order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    await db.order.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete order',
      },
      { status: 500 }
    )
  }
}
