import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, generateId, now, numberToBool, boolToNumber } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const alertType = searchParams.get('alertType')
    const isRead = searchParams.get('isRead')
    const isResolved = searchParams.get('isResolved')

    // Build WHERE clause
    const conditions: string[] = []
    const params: any[] = []

    if (alertType && ['LOW_STOCK', 'OUT_OF_STOCK', 'REORDER_NEEDED'].includes(alertType)) {
      conditions.push('alertType = ?')
      params.push(alertType)
    }

    if (isRead !== null && isRead !== '') {
      conditions.push('isRead = ?')
      params.push(boolToNumber(isRead === 'true'))
    }

    if (isResolved !== null && isResolved !== '') {
      conditions.push('isResolved = ?')
      params.push(boolToNumber(isResolved === 'true'))
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Fetch alerts
    const alerts = await queryAll<any>(
      env,
      `SELECT * FROM inventory_alerts ${whereClause} ORDER BY createdAt DESC`,
      ...params
    )

    // Enrich with product data
    for (const alert of alerts) {
      const product = await ProductRepository.findById(env, alert.productId)
      ;(alert as any).product = product
      alert.isRead = numberToBool(alert.isRead)
      alert.isResolved = numberToBool(alert.isResolved)
    }

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
    const env = getEnv(request)
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
    const existingAlert = await queryFirst<any>(
      env,
      'SELECT * FROM inventory_alerts WHERE productId = ? AND alertType = ? AND isResolved = 0 LIMIT 1',
      body.productId,
      body.alertType
    )

    if (existingAlert) {
      return NextResponse.json({
        success: false,
        error: 'Alert already exists for this product',
      })
    }

    // Create alert
    const id = generateId()
    const currentTime = now()

    await execute(
      env,
      `INSERT INTO inventory_alerts (id, productId, alertType, quantity, isRead, isResolved, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      body.productId,
      body.alertType,
      body.quantity || 0,
      boolToNumber(false),
      boolToNumber(false),
      currentTime,
      currentTime
    )

    const alert = await queryFirst<any>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      id
    )

    // Enrich with product data
    const product = await ProductRepository.findById(env, alert.productId)
    ;(alert as any).product = product
    alert.isRead = numberToBool(alert.isRead)
    alert.isResolved = numberToBool(alert.isResolved)

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
