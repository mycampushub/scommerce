import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { updatePromotionSchema } from '@/lib/validations'
import { queryFirst, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now } from '@/db/db'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params
    const promotion = await queryFirst<any>(
      env,
      'SELECT * FROM promotions WHERE id = ? LIMIT 1',
      id
    )

    if (!promotion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promotion not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...promotion,
        discountRules: parseJSON<any>(promotion.discountRules) || null,
        applicableProducts: parseJSON<string[]>(promotion.applicableProducts) || [],
        applicableCategories: parseJSON<string[]>(promotion.applicableCategories) || [],
        conditions: promotion.conditions || null,
        isActive: typeof promotion.isActive === 'boolean' ? promotion.isActive : numberToBool(promotion.isActive),
      }
    })
  } catch (error) {
    console.error('Error fetching promotion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotion'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params
    const body = await request.json() as any

    // Validate with Zod
    const validation = updatePromotionSchema.safeParse(body)
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

    const updates: string[] = []
    const values: any[] = []

    if (validatedData.title !== undefined) {
      updates.push('title = ?')
      values.push(validatedData.title)
    }
    if (validatedData.description !== undefined) {
      updates.push('description = ?')
      values.push(validatedData.description)
    }
    if (validatedData.image !== undefined) {
      updates.push('image = ?')
      values.push(validatedData.image)
    }
    if (validatedData.type !== undefined) {
      updates.push('type = ?')
      values.push(validatedData.type)
    }
    if (validatedData.promoCode !== undefined) {
      updates.push('promoCode = ?')
      values.push(validatedData.promoCode)
    }
    if (validatedData.discountType !== undefined) {
      updates.push('discountType = ?')
      values.push(validatedData.discountType)
    }
    if (validatedData.discountValue !== undefined) {
      updates.push('discountValue = ?')
      values.push(validatedData.discountValue)
    }
    if (validatedData.minOrderAmount !== undefined) {
      updates.push('minOrderAmount = ?')
      values.push(validatedData.minOrderAmount)
    }
    if (validatedData.maxDiscountAmount !== undefined) {
      updates.push('maxDiscountAmount = ?')
      values.push(validatedData.maxDiscountAmount)
    }
    if (validatedData.discountRules !== undefined) {
      updates.push('discountRules = ?')
      values.push(stringifyJSON(validatedData.discountRules))
    }
    if (validatedData.applicableProducts !== undefined) {
      updates.push('applicableProducts = ?')
      values.push(stringifyJSON(validatedData.applicableProducts))
    }
    if (validatedData.applicableCategories !== undefined) {
      updates.push('applicableCategories = ?')
      values.push(stringifyJSON(validatedData.applicableCategories))
    }
    if (validatedData.startDate !== undefined) {
      updates.push('startDate = ?')
      values.push(validatedData.startDate)
    }
    if (validatedData.endDate !== undefined) {
      updates.push('endDate = ?')
      values.push(validatedData.endDate)
    }
    if (validatedData.ctaText !== undefined) {
      updates.push('ctaText = ?')
      values.push(validatedData.ctaText)
    }
    if (validatedData.ctaLink !== undefined) {
      updates.push('ctaLink = ?')
      values.push(validatedData.ctaLink)
    }
    if (validatedData.usageLimit !== undefined) {
      updates.push('usageLimit = ?')
      values.push(validatedData.usageLimit)
    }
    if (validatedData.userLimit !== undefined) {
      updates.push('userLimit = ?')
      values.push(validatedData.userLimit)
    }
    if (validatedData.conditions !== undefined) {
      updates.push('conditions = ?')
      values.push(validatedData.conditions)
    }
    if (validatedData.isActive !== undefined) {
      updates.push('isActive = ?')
      values.push(boolToNumber(validatedData.isActive))
    }
    if (body.order !== undefined) {
      updates.push('`order` = ?')
      values.push(body.order)
    }

    if (updates.length === 0) {
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
          conditions: promotion.conditions || null,
          isActive: typeof promotion.isActive === 'boolean' ? promotion.isActive : numberToBool(promotion.isActive),
        }
      })
    }

    updates.push('updatedAt = ?')
    values.push(now())
    values.push(id)

    await execute(
      env,
      `UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`,
      ...values
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
        conditions: promotion.conditions || null,
        isActive: typeof promotion.isActive === 'boolean' ? promotion.isActive : numberToBool(promotion.isActive),
      }
    })
  } catch (error) {
    console.error('Error updating promotion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update promotion'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params
    await execute(env, 'DELETE FROM promotions WHERE id = ?', id)

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting promotion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete promotion'
      },
      { status: 500 }
    )
  }
}
