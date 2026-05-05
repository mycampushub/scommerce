import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'

// Simple promo codes for demo (in production, use promotions table)
const PROMO_CODES: Record<string, { discount: number; type: 'percentage' | 'fixed'; minOrder?: number }> = {
  'SAVE10': { discount: 10, type: 'percentage' },
  'SAVE20': { discount: 20, type: 'percentage' },
  'FLAT50': { discount: 50, type: 'fixed', minOrder: 2000 },
  'FREESHIP': { discount: 150, type: 'fixed', minOrder: 1000 },
}

export async function POST(request: NextRequest) {
  const env = getEnv()

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const body = await request.json() as { promoCode?: string }

    if (!body.promoCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Promo code is required',
        },
        { status: 400 }
      )
    }

    const { promoCode } = body

    // Check if promo code exists
    const promoData = PROMO_CODES[promoCode.toUpperCase()]

    if (!promoData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid promo code',
        },
        { status: 404 }
      )
    }

    // Check minimum order requirement
    const cartData = await queryFirst<{ subtotal: number }>(
      env,
      'SELECT COALESCE(SUM(price * quantity), 0) as subtotal FROM cart_items ci JOIN products p ON ci.productId = p.id'
    )

    const subtotal = cartData?.subtotal || 0

    if (promoData.minOrder && subtotal < promoData.minOrder) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order of ${promoData.minOrder} required for this promo code`,
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (promoData.type === 'percentage') {
      discountAmount = subtotal * (promoData.discount / 100)
    } else {
      discountAmount = promoData.discount
    }

    return NextResponse.json({
      success: true,
      data: {
        promoCode: promoCode.toUpperCase(),
        discount: promoData.discount,
        discountType: promoData.type,
        discountAmount: Math.round(discountAmount * 100) / 100,
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
