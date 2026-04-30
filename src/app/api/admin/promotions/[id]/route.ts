import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now } from '@/db/db'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = getEnv()
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
  try {
    const env = getEnv()
    const { id } = await params
    const body = await request.json() as any
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

    const updates: string[] = []
    const values: any[] = []

    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (image !== undefined) {
      updates.push('image = ?')
      values.push(image)
    }
    if (discountType !== undefined) {
      updates.push('discountType = ?')
      values.push(discountType)
    }
    if (discountValue !== undefined) {
      updates.push('discountValue = ?')
      values.push(discountValue)
    }
    if (discountRules !== undefined) {
      updates.push('discountRules = ?')
      values.push(stringifyJSON(discountRules))
    }
    if (applicableProducts !== undefined) {
      updates.push('applicableProducts = ?')
      values.push(stringifyJSON(applicableProducts))
    }
    if (applicableCategories !== undefined) {
      updates.push('applicableCategories = ?')
      values.push(stringifyJSON(applicableCategories))
    }
    if (startDate !== undefined) {
      updates.push('startDate = ?')
      values.push(startDate)
    }
    if (endDate !== undefined) {
      updates.push('endDate = ?')
      values.push(endDate)
    }
    if (ctaText !== undefined) {
      updates.push('ctaText = ?')
      values.push(ctaText)
    }
    if (ctaLink !== undefined) {
      updates.push('ctaLink = ?')
      values.push(ctaLink)
    }
    if (isActive !== undefined) {
      updates.push('isActive = ?')
      values.push(boolToNumber(isActive))
    }
    if (order !== undefined) {
      updates.push('`order` = ?')
      values.push(order)
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
  try {
    const env = getEnv()
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
