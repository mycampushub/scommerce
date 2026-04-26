import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const alertId = id

    // Check if alert exists
    const existingAlert = await db.inventoryAlert.findUnique({
      where: {
        id: alertId,
      },
    })

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
    const updateData: any = {}

    if (body.isRead !== undefined) {
      updateData.isRead = body.isRead
    }

    if (body.isResolved !== undefined) {
      updateData.isResolved = body.isResolved
      if (body.isResolved === true) {
        updateData.resolvedAt = new Date()
      } else {
        updateData.resolvedAt = null
      }
    }

    const alert = await db.inventoryAlert.update({
      where: {
        id: alertId,
      },
      data: updateData,
      include: {
        product: true,
      },
    })

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
    const alertId = id

    // Check if alert exists
    const existingAlert = await db.inventoryAlert.findUnique({
      where: {
        id: alertId,
      },
    })

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
    await db.inventoryAlert.delete({
      where: {
        id: alertId,
      },
    })

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
