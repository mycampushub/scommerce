import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { execute, parseJSON } from '@/db/db'
import { updateTrackingSchema } from '@/lib/validations'
import prisma from '@/lib/database'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const env = getEnv()
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
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = getEnv()

  try {
    const { id } = await params
    const body: any = await request.json() as any

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

    if (body.trackingNumber !== undefined || body.trackingStatus) {
      // Validate tracking number and status
      const validation = updateTrackingSchema.safeParse({
        trackingNumber: body.trackingNumber || '',
        trackingStatus: body.trackingStatus || 'PENDING',
      })

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error.issues[0].message,
          },
          { status: 400 }
        )
      }

      await OrderRepository.updateTracking(env, id, body.trackingNumber, body.trackingStatus)
      const updated = await OrderRepository.findById(env, id)
      if (updated) {
        Object.assign(updates, {
          trackingNumber: updated.trackingNumber,
          trackingStatus: updated.trackingStatus,
        })
      }
    }

    const updateFields: Record<string, unknown> = {}
    if (body.shipping !== undefined) updateFields.shipping = body.shipping
    if (body.tax !== undefined) updateFields.tax = body.tax
    if (body.discount !== undefined) updateFields.discount = body.discount
    if (body.notes !== undefined) updateFields.notes = body.notes

    if (Object.keys(updateFields).length > 0) {
      if (!env || !env.DB) {
        await prisma.order.update({
          where: { id },
          data: { ...updateFields, updatedAt: new Date().toISOString() }
        })
      } else {
        for (const [field, value] of Object.entries(updateFields)) {
          await execute(env, `UPDATE orders SET ${field} = ?, updatedAt = ? WHERE id = ?`, value as any, new Date().toISOString(), id)
        }
      }
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
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = getEnv()

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Soft delete: mark order as deleted instead of removing
    if (!env || !env.DB) {
      await prisma.order.update({
        where: { id },
        data: {
          deletedAt: new Date().toISOString(),
          deletedBy: userOrResponse.id || 'unknown',
          deletedReason: body.reason || 'Manually deleted',
          updatedAt: new Date().toISOString()
        }
      })
    } else {
      await execute(env,
        `UPDATE orders SET deletedAt = ?, deletedBy = ?, deletedReason = ?, updatedAt = ? WHERE id = ?`,
        new Date().toISOString(),
        userOrResponse.id || 'unknown',
        body.reason || 'Manually deleted',
        new Date().toISOString(),
        id
      )
    }

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
