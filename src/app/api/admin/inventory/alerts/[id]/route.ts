import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, execute, numberToBool, boolToNumber, now } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'

export const runtime = 'edge';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    const body = await request.json()
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
    const params: any[] = []

    if (body.isRead !== undefined) {
      updates.push('isRead = ?')
      params.push(boolToNumber(body.isRead))
    }

    if (body.isResolved !== undefined) {
      updates.push('isResolved = ?')
      params.push(boolToNumber(body.isResolved))
      if (body.isResolved === true) {
        updates.push('resolvedAt = ?')
        params.push(now())
      } else {
        updates.push('resolvedAt = NULL')
      }
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?')
      params.push(now())
      params.push(alertId)

      await execute(
        env,
        `UPDATE inventory_alerts SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      )
    }

    const alert = await queryFirst<any>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      alertId
    )

    // Enrich with product data
    const product = await ProductRepository.findById(env, alert.productId)
    ;(alert as any).product = product
    alert.isRead = numberToBool(alert.isRead)
    alert.isResolved = numberToBool(alert.isResolved)

    return NextResponse.json({
      success: true,
      data: alert,
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
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
