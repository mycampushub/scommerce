import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { promotionSchema } from '@/lib/validations'
import { queryAll, queryFirst, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now, generateId } from '@/db/db'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { checkEnv } from '@/lib/api-helpers'


export async function GET(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()

    // Check if database is available
    const envCheck = checkEnv(env)
    if (envCheck) {
      return envCheck
    }

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

  // Get environment and check availability
  const env = await getEnv()

  // Check if database is available
  const envCheck = checkEnv(env)
  if (envCheck) {
    return envCheck
  }

  // Rate limiting: 20 requests per minute per admin
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
    // Handle date fields - empty strings should be null, otherwise convert to ISO format
    // Convert numeric fields from strings to numbers if needed
    const formatDateToISO = (dateStr: string | null | undefined): string | null => {
      if (!dateStr || dateStr.trim().length === 0) return null
      // If it's already in ISO format (has 'T'), return as-is
      if (dateStr.includes('T')) return dateStr.trim()
      // Otherwise, convert 'YYYY-MM-DD' to ISO format
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return null
        return date.toISOString()
      } catch {
        return null
      }
    }

    const sanitizedBody = {
      ...body,
      promoCode: body.promoCode && body.promoCode.trim().length > 0 ? body.promoCode.trim().toUpperCase() : null,
      startDate: formatDateToISO(body.startDate),
      endDate: formatDateToISO(body.endDate),
      ctaText: (body.ctaText && body.ctaText.trim().length > 0) ? body.ctaText.trim() : null,
      ctaLink: (body.ctaLink && body.ctaLink.trim().length > 0) ? body.ctaLink.trim() : null,
      conditions: (body.conditions && body.conditions.trim().length > 0) ? body.conditions.trim() : null,
      // Ensure numeric fields are numbers (not strings)
      discountValue: body.discountValue !== undefined ? parseFloat(String(body.discountValue)) : undefined,
      minOrderAmount: body.minOrderAmount !== undefined ? parseFloat(String(body.minOrderAmount)) : undefined,
      maxDiscountAmount: body.maxDiscountAmount !== undefined ? parseFloat(String(body.maxDiscountAmount)) : undefined,
      usageLimit: body.usageLimit !== undefined ? parseInt(String(body.usageLimit), 10) : undefined,
      userLimit: body.userLimit !== undefined ? parseInt(String(body.userLimit), 10) : undefined,
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

    console.log('[Promotions POST] Inserting promotion with params:', {
      id,
      title: validatedData.title,
      type: validatedData.type,
      promoCode: validatedData.promoCode,
      discountValue: validatedData.discountValue,
      minOrderAmount: validatedData.minOrderAmount,
      maxDiscountAmount: validatedData.maxDiscountAmount,
      usageLimit: validatedData.usageLimit,
      userLimit: validatedData.userLimit,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      applicableCategories: validatedData.applicableCategories,
      applicableProducts: validatedData.applicableProducts,
      order: promotionOrder,
    })

    const values = [
      id,
      validatedData.title,
      validatedData.description || null,
      validatedData.image || null,
      validatedData.ctaText || null,
      validatedData.ctaLink || null,
      validatedData.type || 'banner',
      validatedData.promoCode || null,
      validatedData.discountType || 'percentage',
      validatedData.discountValue ?? null,
      validatedData.minOrderAmount ?? null,
      validatedData.maxDiscountAmount ?? null,
      validatedData.startDate || null,
      validatedData.endDate || null,
      validatedData.usageLimit ?? null,
      0, // usedCount
      validatedData.userLimit ?? null,
      validatedData.applicableCategories ? stringifyJSON(validatedData.applicableCategories) : null,
      validatedData.applicableProducts ? stringifyJSON(validatedData.applicableProducts) : null,
      validatedData.conditions || null,
      validatedData.discountRules ? stringifyJSON(validatedData.discountRules) : null,
      boolToNumber(validatedData.isActive ?? true),
      promotionOrder,
      currentTime,
      currentTime
    ]

    console.log('[Promotions POST] Values count:', values.length)
    console.log('[Promotions POST] Values:', values)

    await execute(
      env,
      `INSERT INTO promotions (id, title, description, image, ctaText, ctaLink, type,
       promoCode, discountType, discountValue, minOrderAmount, maxDiscountAmount,
       startDate, endDate, usageLimit, usedCount, userLimit, applicableCategories,
       applicableProducts, conditions, discountRules, isActive, \`order\`, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...values
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
    console.error('[Promotions POST] Error stack:', error instanceof Error ? error.stack : 'No stack available')

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[Promotions POST] Error message:', errorMessage)
    console.error('[Promotions POST] Error name:', error instanceof Error ? error.name : 'Unknown')

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

    // Check if it's a database column/type error
    if (errorMessage.includes('has no column') || errorMessage.includes('datatype mismatch') || errorMessage.includes('wrong number of parameters')) {
      console.error('[Promotions POST] Database structure error:', errorMessage)
      return NextResponse.json(
        {
          success: false,
          error: 'Database structure error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : 'Contact administrator'
        },
        { status: 500 }
      )
    }

    // Return more detailed error even in production for now to debug
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create promotion',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
