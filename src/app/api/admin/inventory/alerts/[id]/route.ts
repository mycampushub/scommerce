import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, numberToBool, boolToNumber, now } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params
    const body = await request.json() as any
    const alertId = id

    // Check if alert exists
    const existingAlert = await queryFirst<any>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      alertId
    )

    if (!existingAlert) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert not found',
        },
        { status: 404 }
      )
    }

    // Update alert
    const updates: string[] = []
    const values: any[] = []

    if (body.isRead !== undefined) {
      updates.push('isRead = ?')
      values.push(boolToNumber(body.isRead))
    }

    if (body.isResolved !== undefined) {
      updates.push('isResolved = ?')
      values.push(boolToNumber(body.isResolved))
      if (body.isResolved === true) {
        updates.push('resolvedAt = ?')
        values.push(now())
      } else {
        updates.push('resolvedAt = NULL')
      }
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?')
      values.push(now())
      values.push(alertId)

      await execute(
        env,
        `UPDATE inventory_alerts SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }

    const alert = await queryFirst<any>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      alertId
    )

    // Enrich with product and variant data
    const product = await ProductRepository.findById(env, alert.productId)
    let variant = null
    if (alert.variantId) {
      variant = await queryFirst<any>(
        env,
        'SELECT id, name, sku, stock FROM product_variants WHERE id = ?',
        alert.variantId
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...alert,
        product,
        variant,
        isRead: numberToBool(alert.isRead as number),
        isResolved: numberToBool(alert.isResolved as number),
      },
      message: 'Alert updated successfully',
    })
  } catch (error) {
    console.error('Error updating inventory alert:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update inventory alert',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params
    const env = await getEnv()
    const alertId = id

    // Check if alert exists
    const existingAlert = await queryFirst<any>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      alertId
    )

    if (!existingAlert) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alert not found',
        },
        { status: 404 }
      )
    }

    // Delete alert
    await execute(env, 'DELETE FROM inventory_alerts WHERE id = ?', alertId)

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting inventory alert:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete inventory alert',
      },
      { status: 500 }
    )
  }
}
