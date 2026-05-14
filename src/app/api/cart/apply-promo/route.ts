import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { validatePromoCode, getUserPromoCodes } from '@/lib/promotion-validation'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const env = await getEnv()


  try {
    const body = await request.json() as { promoCode?: string; subtotal?: number; cartItems?: Array<{ productId: string; variantId?: string; quantity: number }> }

    if (!body.promoCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promo code is required',
        },
        { status: 400 }
      )
    }

    const { promoCode, subtotal, cartItems } = body

    // Get user ID if authenticated
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken
    let userId: string | undefined

    if (token) {
      try {
        const payload = await verifyToken(token)
        if (payload && payload.userId) {
          userId = payload.userId
        }
      } catch {
        // Invalid token, continue without user ID
      }
    }

    // If subtotal not provided, calculate from cart items
    const calculatedSubtotal = subtotal || 0

    // Validate promo code using the new promotion validation logic
    const validation = await validatePromoCode(env, {
      promoCode,
      subtotal: calculatedSubtotal,
      userId,
      cartItems,
    })

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid promo code',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        promoCode: promoCode.toUpperCase(),
        title: validation.promotion?.title,
        description: validation.promotion?.description,
        discountType: validation.promotion?.discountType,
        discountValue: validation.promotion?.discountValue,
        discountAmount: validation.discountAmount || 0,
      },
    })
  } catch (error) {
    console.error('Error applying promo code:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply promo code',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cart/apply-promo - Get available promo codes for user
 */
export async function GET(request: NextRequest) {
  const env = await getEnv()

  try {
    // Get user ID if authenticated
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken
    let userId: string | undefined

    if (token) {
      try {
        const payload = await verifyToken(token)
        if (payload && payload.userId) {
          userId = payload.userId
        }
      } catch {
        // Invalid token, continue without user ID
      }
    }

    // Get available promo codes
    const promoCodes = await getUserPromoCodes(env, userId)

    return NextResponse.json({
      success: true,
      data: promoCodes.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        promoCode: p.promoCode,
        discountType: p.discountType,
        discountValue: p.discountValue,
        minOrderAmount: p.minOrderAmount,
        maxDiscountAmount: p.maxDiscountAmount,
        startDate: p.startDate,
        endDate: p.endDate,
        userUsageCount: p.userUsageCount,
        userLimit: p.userLimit,
      })),
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promo codes',
      },
      { status: 500 }
    )
  }
}
