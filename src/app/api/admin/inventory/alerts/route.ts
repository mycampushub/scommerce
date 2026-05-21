import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, generateId, now, numberToBool, boolToNumber } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'
import { verifyAdminAuth } from '@/lib/admin-auth'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const alertType = searchParams.get('alertType')
    const isRead = searchParams.get('isRead')
    const isResolved = searchParams.get('isResolved')

    console.log('[inventory alerts API] Fetching alerts with filters:', { alertType, isRead, isResolved })

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

    console.log('[inventory alerts API] Using D1 for alerts query')
    console.log('[inventory alerts API] Fetched', alerts.length, 'alerts')

    // Enrich with product and variant data - Fix N+1 query by batching
    // Collect unique product IDs
    const productIds = [...new Set(alerts.map(alert => alert.productId).filter(Boolean))]
    const variantIds = [...new Set(alerts.map(alert => alert.variantId).filter(Boolean))]

    // Batch fetch all products in a single query
    const productsMap = new Map<string, any>()
    if (productIds.length > 0) {
      console.log('[inventory alerts API] Using D1 to fetch products')
      const placeholders = productIds.map(() => '?').join(',')
      const products = await queryAll<any>(
        env,
        `SELECT id, name, slug, images FROM products WHERE id IN (${placeholders})`,
        ...productIds
      )
      products.forEach(p => productsMap.set(p.id, p))
    }

    // Batch fetch all variants in a single query
    const variantsMap = new Map<string, any>()
    if (variantIds.length > 0) {
      console.log('[inventory alerts API] Using D1 to fetch variants')
      const variantPlaceholders = variantIds.map(() => '?').join(',')
      const variants = await queryAll<any>(
        env,
        `SELECT id, name, sku, stock FROM product_variants WHERE id IN (${variantPlaceholders})`,
        ...variantIds
      )
      variants.forEach(v => variantsMap.set(v.id, v))
    }

    // Attach product and variant data to alerts
    for (const alert of alerts) {
      ;(alert as any).product = productsMap.get(alert.productId) || null
      ;(alert as any).variant = variantsMap.get(alert.variantId) || null
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
  // Verify admin authentication (admin only for creating alerts)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const body: any = await request.json() as any

    console.log('[inventory alerts API] Creating alert:', body)

    // Validate required fields
    if (!body.productId || !body.alertType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    // Validate alertType
    const validAlertTypes = ['LOW_STOCK', 'OUT_OF_STOCK', 'REORDER_NEEDED']
    if (!validAlertTypes.includes(body.alertType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid alert type',
        },
        { status: 400 }
      )
    }

    // Use D1 to create alert
    console.log('[inventory alerts API] Using D1 to create alert')

    let alert: any
    const id = generateId()
    const currentTime = now()

    // Try to insert, if duplicate constraint violation, fetch existing
    try {
      await execute(
        env,
        `INSERT OR IGNORE INTO inventory_alerts (id, productId, variantId, alertType, quantity, isRead, isResolved, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        body.productId,
        body.variantId || null,
        body.alertType,
        body.quantity || 0,
        boolToNumber(false),
        boolToNumber(false),
        currentTime,
        currentTime
      )

      // Fetch the alert (either newly created or existing)
      alert = await queryFirst<any>(
        env,
        'SELECT * FROM inventory_alerts WHERE productId = ? AND (variantId = ? OR (variantId IS NULL AND ? IS NULL)) AND alertType = ? ORDER BY createdAt DESC LIMIT 1',
        body.productId,
        body.variantId || null,
        body.variantId || null,
        body.alertType
      )
    } catch (error: any) {
      console.error('[inventory alerts API] Error creating alert:', error)
      // If constraint violation, try to fetch existing alert
      alert = await queryFirst<any>(
        env,
        'SELECT * FROM inventory_alerts WHERE productId = ? AND (variantId = ? OR (variantId IS NULL AND ? IS NULL)) AND alertType = ? ORDER BY createdAt DESC LIMIT 1',
        body.productId,
        body.variantId || null,
        body.variantId || null,
        body.alertType
      )
    }

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

    ;(alert as any).product = product
    ;(alert as any).variant = variant
    alert.isRead = numberToBool(alert.isRead)
    alert.isResolved = numberToBool(alert.isResolved)

    console.log('[inventory alerts API] Alert created successfully:', alert.id)

    return NextResponse.json({
      success: true,
      data: alert,
      message: 'Alert created successfully',
    })
  } catch (error) {
    console.error('[inventory alerts API] Error creating inventory alert:', error)
    console.error('[inventory alerts API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create inventory alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
