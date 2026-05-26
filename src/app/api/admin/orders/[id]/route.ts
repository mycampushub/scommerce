import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import { UserRepository } from '@/db/user.repository'
import { execute, parseJSON } from '@/db/db'
import { updateTrackingSchema } from '@/lib/validations'
import { logAdminAction } from '@/lib/audit-logger'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params
    const env = await getEnv()
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

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const { id } = await params
    const body: any = await request.json() as any

    // Get current order first for audit log
    const currentOrder = await OrderRepository.findById(env, id)
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updates: any = {}
    const changes: string[] = []

    if (body.status) {
      await OrderRepository.updateStatus(env, id, body.status)
      changes.push(`status: ${currentOrder.status} → ${body.status}`)
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
      changes.push(`paymentStatus: ${currentOrder.paymentStatus} → ${body.paymentStatus}`)
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
      // Only validate tracking number if it's provided and not empty
      const trackingValue = body.trackingNumber || ''
      const shouldValidateTracking = trackingValue !== undefined && trackingValue !== ''

      // If tracking number is provided, validate it
      if (shouldValidateTracking) {
        const validation = updateTrackingSchema.safeParse({
          trackingNumber: trackingValue,
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
      }

      // Only update tracking if trackingNumber is provided or trackingStatus is provided
      if (body.trackingNumber || body.trackingStatus) {
        await OrderRepository.updateTracking(env, id, trackingValue, body.trackingStatus || 'PENDING')
        if (body.trackingStatus) {
          changes.push(`trackingStatus: ${currentOrder.trackingStatus} → ${body.trackingStatus}`)
        }
        if (body.trackingNumber) {
          changes.push(`trackingNumber: ${body.trackingNumber}`)
        }
        const updated = await OrderRepository.findById(env, id)
        if (updated) {
          Object.assign(updates, {
            trackingNumber: updated.trackingNumber,
            trackingStatus: updated.trackingStatus,
          })
        }
      }
    }

    const updateFields: Record<string, unknown> = {}
    if (body.shipping !== undefined) {
      updateFields.shipping = body.shipping
      changes.push(`shipping: ${currentOrder.shipping} → ${body.shipping}`)
    }
    if (body.tax !== undefined) {
      updateFields.tax = body.tax
      changes.push(`tax: ${currentOrder.tax} → ${body.tax}`)
    }
    if (body.discount !== undefined) {
      updateFields.discount = body.discount
      changes.push(`discount: ${currentOrder.discount} → ${body.discount}`)
    }
    if (body.notes !== undefined) {
      updateFields.notes = body.notes
      changes.push('notes updated')
    }
    if (body.estimatedDeliveryDate !== undefined) {
      updateFields.estimatedDeliveryDate = body.estimatedDeliveryDate
      changes.push(`estimatedDeliveryDate: ${currentOrder.estimatedDeliveryDate || 'none'} → ${body.estimatedDeliveryDate || 'none'}`)
    }

    if (Object.keys(updateFields).length > 0) {
      // Use consistent D1 pattern with execute()
      for (const [field, value] of Object.entries(updateFields)) {
        await execute(env, `UPDATE orders SET ${field} = ?, updatedAt = ? WHERE id = ?`, value as any, new Date().toISOString(), id)
      }
    }

    // Log audit event
    if (changes.length > 0) {
      await logAdminAction(
        env,
        request,
        admin.id,
        'UPDATE',
        'Order',
        id,
        `Updated order ${currentOrder.orderNumber} (ID: ${id}): ${changes.join(', ')}`
      )
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
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

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Get order info for audit log
    const order = await OrderRepository.findById(env, id)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Soft delete: mark order as deleted instead of removing
    // Use consistent D1 pattern with execute()
    await execute(env,
      `UPDATE orders SET deletedAt = ?, deletedBy = ?, deletedReason = ?, updatedAt = ? WHERE id = ?`,
      new Date().toISOString(),
      admin.id,
      body.reason || 'Manually deleted',
      new Date().toISOString(),
      id
    )

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'Order',
      id,
      `Deleted order ${order.orderNumber} (ID: ${id}). Reason: ${body.reason || 'Manually deleted'}`
    )

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
