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

    console.log('[Promotions POST] Received body:', body)

    // Check for duplicate promo code if provided
    if (body.promoCode && body.promoCode.trim().length > 0) {
      const existingPromo = await queryFirst<any>(
        env,
        'SELECT id, promoCode FROM promotions WHERE promoCode = ? LIMIT 1',
        body.promoCode.trim().toUpperCase()
      )
      
      if (existingPromo) {
        console.error('[Promotions POST] Duplicate promo code:', body.promoCode)
        return NextResponse.json(
          {
            success: false,
            error: 'A promotion with this promo code already exists',
            details: `Promo code "${body.promoCode}" is already in use`
          },
          { status: 409 }
        )
      }
    }

    // Convert empty strings to null for optional string fields
    const sanitizedBody = {
      ...body,
      promoCode: body.promoCode && body.promoCode.trim().length > 0 ? body.promoCode.trim().toUpperCase() : undefined,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      ctaText: body.ctaText || null,
      ctaLink: body.ctaLink || null,
      conditions: body.conditions || null,
    }

    console.log('[Promotions POST] Sanitized body:', sanitizedBody)

    // Validate with Zod
    const validation = promotionSchema.safeParse(sanitizedBody)
    if (!validation.success) {
      console.error('[Promotions POST] Validation failed:', validation.error.issues)
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
    console.log('[Promotions POST] Validated data:', validatedData)

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

    console.log('[Promotions POST] Inserted promotion with ID:', id)

    const promotion = await queryFirst<any>(
      env,
      'SELECT * FROM promotions WHERE id = ? LIMIT 1',
      id
    )

    if (!promotion) {
      console.error('[Promotions POST] Failed to retrieve created promotion with ID:', id)
      throw new Error('Promotion was created but could not be retrieved')
    }

    console.log('[Promotions POST] Retrieved promotion:', promotion)

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
    console.error('[Promotions POST] Error creating promotion:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    // Check if it's a database constraint error
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A promotion with this promo code already exists',
          details: 'Please use a different promo code'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create promotion',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
