import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now, generateId } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
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
  try {
    const env = getEnv(request)
    const body = await request.json()
    const {
      title,
      description,
      image,
      discountType,
      discountValue,
      discountRules,
      applicableProducts,
      applicableCategories,
      startDate,
      endDate,
      ctaText,
      ctaLink,
      isActive,
      order
    } = body

    // Validate required fields
    if (!title || !image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and image are required'
        },
        { status: 400 }
      )
    }

    // Get highest order value if not provided
    let promotionOrder = order
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
      title,
      description || null,
      image,
      discountType || 'percentage',
      discountValue || 0,
      discountRules ? stringifyJSON(discountRules) : null,
      applicableProducts ? stringifyJSON(applicableProducts) : null,
      applicableCategories ? stringifyJSON(applicableCategories) : null,
      startDate || null,
      endDate || null,
      ctaText || null,
      ctaLink || null,
      boolToNumber(isActive !== undefined ? isActive : true),
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
