import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { execute, parseJSON } from '@/db/db'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
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

    // Enrich with user and order items
    if (order.userId) {
      const user = await UserRepository.findById(env, order.userId)
      ;(order as any).user = user || null
    }

    const items = await OrderRepository.getItems(env, id)
    ;(order as any).orderItems = items

    // Parse addresses if they're JSON strings
    if (order.shippingAddress && typeof order.shippingAddress === 'string') {
      try {
        ;(order as any).shippingAddress = parseJSON(order.shippingAddress)
      } catch {
        // Keep as string if not valid JSON
      }
    }
    if (order.billingAddress && typeof order.billingAddress === 'string') {
      try {
        ;(order as any).billingAddress = parseJSON(order.billingAddress)
      } catch {
        // Keep as string if not valid JSON
      }
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
    const env = getEnv(request)
    const body = await request.json()

    // Prepare update data
    const updates: any = {}

    if (body.status) {
      await OrderRepository.updateStatus(env, id, body.status)
      // Need to re-fetch after status update
      const updated = await OrderRepository.findById(env, id)
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        )
      }
      Object.assign(updates, {
        status: updated.status,
        cancelledAt: updated.cancelledAt,
        cancelledBy: updated.cancelledBy,
        cancellationReason: updated.cancellationReason,
      })
    }

    if (body.paymentStatus) {
      await OrderRepository.updatePaymentStatus(env, id, body.paymentStatus)
      const updated = await OrderRepository.findById(env, id)
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        )
      }
      Object.assign(updates, {
        paymentStatus: updated.paymentStatus,
        refundedAt: updated.refundedAt,
        refundedAmount: updated.refundedAmount,
        refundMethod: updated.refundMethod,
        refundReason: updated.refundReason,
      })
    }

    if (body.trackingNumber !== undefined && body.trackingStatus) {
      await OrderRepository.updateTracking(env, id, body.trackingNumber, body.trackingStatus)
      const updated = await OrderRepository.findById(env, id)
      if (updated) {
        Object.assign(updates, {
          trackingNumber: updated.trackingNumber,
          trackingStatus: updated.trackingStatus,
        })
      }
    }

    if (body.shipping !== undefined) {
      await execute(env, 'UPDATE orders SET shipping = ?, updatedAt = ? WHERE id = ?', body.shipping, new Date().toISOString(), id)
    }
    if (body.tax !== undefined) {
      await execute(env, 'UPDATE orders SET tax = ?, updatedAt = ? WHERE id = ?', body.tax, new Date().toISOString(), id)
    }
    if (body.discount !== undefined) {
      await execute(env, 'UPDATE orders SET discount = ?, updatedAt = ? WHERE id = ?', body.discount, new Date().toISOString(), id)
    }
    if (body.notes !== undefined) {
      await execute(env, 'UPDATE orders SET notes = ?, updatedAt = ? WHERE id = ?', body.notes, new Date().toISOString(), id)
    }

    // Fetch final order
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

    // Enrich with user and items
    if (order.userId) {
      const user = await UserRepository.findById(env, order.userId)
      ;(order as any).user = user || null
    }

    const items = await OrderRepository.getItems(env, id)
    ;(order as any).orderItems = items

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
    const env = getEnv(request)

    // Delete order items first
    await execute(env, 'DELETE FROM order_items WHERE orderId = ?', id)

    // Then delete order
    await execute(env, 'DELETE FROM orders WHERE id = ?', id)

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
