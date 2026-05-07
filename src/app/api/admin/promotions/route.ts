import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { promotionSchema } from '@/lib/validations'
import { queryAll, queryFirst, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now, generateId } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'


export async function GET(request: NextRequest) {
  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let sql = 'SELECT * FROM promotions'
    let params: any[] = []

    if (activeOnly) {
      sql += ' WHERE isActive = 1'
    }

    sql += ' ORDER BY `order` ASC, createdAt DESC'

    const promotions = await queryAll<any>(env, sql, ...params)

    // Parse JSON fields
    const promotionsWithParsedFields = promotions.map(p => ({
      ...p,
      discountRules: parseJSON<any>(p.discountRules) || null,
      applicableProducts: parseJSON<string[]>(p.applicableProducts) || [],
      applicableCategories: parseJSON<string[]>(p.applicableCategories) || [],
      isActive: typeof p.isActive === 'boolean' ? p.isActive : numberToBool(p.isActive),
    }))

    return NextResponse.json({
      success: true,
      data: promotionsWithParsedFields
    })
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotions'
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

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const body = await request.json() as any

    // Validate with Zod
    const validation = promotionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message
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
      `INSERT INTO promotions (id, title, description, image, discountType, discountValue,
       discountRules, applicableProducts, applicableCategories, startDate, endDate,
       ctaText, ctaLink, isActive, \`order\`, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      validatedData.title,
      validatedData.description || null,
      validatedData.image,
      validatedData.discountType,
      validatedData.discountValue,
      validatedData.discountRules ? stringifyJSON(validatedData.discountRules) : null,
      validatedData.applicableProducts ? stringifyJSON(validatedData.applicableProducts) : null,
      validatedData.applicableCategories ? stringifyJSON(validatedData.applicableCategories) : null,
      validatedData.startDate || null,
      validatedData.endDate || null,
      validatedData.ctaText || null,
      validatedData.ctaLink || null,
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
        isActive: typeof promotion.isActive === 'boolean' ? promotion.isActive : numberToBool(promotion.isActive),
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating promotion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create promotion'
      },
      { status: 500 }
    )
  }
}
