import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AlertType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const alertType = searchParams.get('alertType')
    const isRead = searchParams.get('isRead')
    const isResolved = searchParams.get('isResolved')

    // Build where clause
    const where: any = {}

    if (alertType && ['LOW_STOCK', 'OUT_OF_STOCK', 'REORDER_NEEDED'].includes(alertType)) {
      where.alertType = alertType
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true'
    }

    if (isResolved !== null) {
      where.isResolved = isResolved === 'true'
    }

    // Fetch alerts
    const alerts = await db.inventoryAlert.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            stock: true,
            lowStockAlert: true,
            reorderLevel: true,
            reorderQty: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: alerts,
      total: alerts.length,
    })
  } catch (error) {
    console.error('Error fetching inventory alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory alerts',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.productId || !body.alertType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    // Check if alert already exists for this product and type
    const existingAlert = await db.inventoryAlert.findFirst({
      where: {
        productId: body.productId,
        alertType: body.alertType,
        isResolved: false,
      },
    })

    if (existingAlert) {
      return NextResponse.json({
        success: false,
        error: 'Alert already exists for this product',
      })
    }

    // Create alert
    const alert = await db.inventoryAlert.create({
      data: {
        productId: body.productId,
        alertType: body.alertType,
        quantity: body.quantity || 0,
        isRead: false,
        isResolved: false,
      },
      include: {
        product: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: alert,
      message: 'Alert created successfully',
    })
  } catch (error) {
    console.error('Error creating inventory alert:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create inventory alert',
      },
      { status: 500 }
    )
  }
}
