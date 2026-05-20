import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { promotionSchema } from '@/lib/validations'
import { queryAll, queryFirst, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now, generateId } from '@/db/db'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/rate-limit'


export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let sql = 'SELECT * FROM promotions'
    let params: any[] = []

    if (activeOnly) {
      sql += ' WHERE isActive = 1'
    }

    sql += ' ORDER BY `order` ASC, createdAt DESC'

    const promotions = await queryAll<any>(env, sql, ...params)

    // Ensure promotions is always an array
    const promotionsArray = Array.isArray(promotions) ? promotions : []

    // Parse JSON fields - ensure they are always arrays
    const promotionsWithParsedFields = promotionsArray.map(p => {
      const parsedProducts = parseJSON<any>(p.applicableProducts)
      const parsedCategories = parseJSON<any>(p.applicableCategories)

      const result = {
        ...p,
        discountRules: parseJSON<any>(p.discountRules) || null,
        applicableProducts: Array.isArray(parsedProducts) ? parsedProducts : [],
        applicableCategories: Array.isArray(parsedCategories) ? parsedCategories : [],
        conditions: p.conditions || null, // Keep conditions as string
        isActive: typeof p.isActive === 'boolean' ? p.isActive : numberToBool(p.isActive),
      }

      console.log('[Promotions API] Parsed promotion:', {
        id: p.id,
        applicableProductsRaw: p.applicableProducts,
        applicableProductsParsed: parsedProducts,
        applicableProductsFinal: result.applicableProducts,
        applicableCategoriesRaw: p.applicableCategories,
        applicableCategoriesParsed: parsedCategories,
        applicableCategoriesFinal: result.applicableCategories,
      })

      return result
    })

    console.log('[Promotions API] Returning promotions:', {
      success: true,
      data: promotionsWithParsedFields
    })

    return NextResponse.json({
      success: true,
      data: promotionsWithParsedFields
    })
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotions',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Rate limiting: 20 requests per minute per admin
  const env = await getEnv()
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-promotion-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json() as any

    // Validate with Zod
    const validation = promotionSchema.safeParse(body)
    if (!validation.success) {
      console.error('Promotion validation failed:', validation.error.issues)
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Get highest order value if not provided
    let promotionOrder = body.order
    if (promotionOrder === undefined || promotionOrder === null) {
      const maxOrder = await queryFirst<{ order: number }>(
        env,
        'SELECT `order` FROM promotions ORDER BY `order` DESC LIMIT 1'
      )
      promotionOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const id = generateId()
    const currentTime = now()

    await execute(
      env,
      `INSERT INTO promotions (id, title, description, image, type, ctaText, ctaLink,
       discountType, discountValue, discountRules, applicableProducts, applicableCategories,
       startDate, endDate, promoCode, minOrderAmount, maxDiscountAmount,
       usageLimit, usedCount, userLimit, conditions, isActive, \`order\`, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      validatedData.title,
      validatedData.description || null,
      validatedData.image || null, // Handle undefined/null
      validatedData.type || 'banner',
      validatedData.ctaText || null,
      validatedData.ctaLink || null,
      validatedData.discountType || 'percentage',
      validatedData.discountValue ?? 0,
      validatedData.discountRules ? stringifyJSON(validatedData.discountRules) : null,
      validatedData.applicableProducts ? stringifyJSON(validatedData.applicableProducts) : null,
      validatedData.applicableCategories ? stringifyJSON(validatedData.applicableCategories) : null,
      validatedData.startDate || null,
      validatedData.endDate || null,
      validatedData.promoCode || null,
      validatedData.minOrderAmount ?? null,
      validatedData.maxDiscountAmount ?? null,
      validatedData.usageLimit ?? null,
      0, // usedCount
      validatedData.userLimit ?? null,
      validatedData.conditions || null, // Store conditions as-is (string)
      boolToNumber(validatedData.isActive ?? true),
      promotionOrder,
      currentTime,
      currentTime
    )

    const promotion = await queryFirst<any>(
      env,
      'SELECT * FROM promotions WHERE id = ? LIMIT 1',
      id
    )

    return NextResponse.json({
      success: true,
      data: {
        ...promotion,
        discountRules: parseJSON<any>(promotion.discountRules) || null,
        applicableProducts: parseJSON<string[]>(promotion.applicableProducts) || [],
        applicableCategories: parseJSON<string[]>(promotion.applicableCategories) || [],
        conditions: promotion.conditions || null, // Keep conditions as string
        isActive: typeof promotion.isActive === 'boolean' ? promotion.isActive : numberToBool(promotion.isActive),
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating promotion:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create promotion',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
