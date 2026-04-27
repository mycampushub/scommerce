import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge';

// Bangladesh division-based shipping rates
const SHIPPING_RATES: Record<string, { base: number; perKg: number; freeThreshold: number }> = {
  'Dhaka': { base: 60, perKg: 10, freeThreshold: 5000 },
  'Chittagong': { base: 80, perKg: 15, freeThreshold: 5000 },
  'Khulna': { base: 100, perKg: 20, freeThreshold: 5000 },
  'Rajshahi': { base: 100, perKg: 20, freeThreshold: 5000 },
  'Barisal': { base: 100, perKg: 20, freeThreshold: 5000 },
  'Sylhet': { base: 120, perKg: 25, freeThreshold: 5000 },
  'Rangpur': { base: 120, perKg: 25, freeThreshold: 5000 },
  'Mymensingh': { base: 100, perKg: 20, freeThreshold: 5000 },
}

// Default shipping rate for unknown divisions
const DEFAULT_RATE = { base: 120, perKg: 25, freeThreshold: 5000 }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subtotal, division, weight = 1 } = body

    // Validate required fields
    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid subtotal value' },
        { status: 400 }
      )
    }

    // Get shipping rate for the division
    const rate = division && SHIPPING_RATES[division] ? SHIPPING_RATES[division] : DEFAULT_RATE

    // Calculate shipping cost
    let shippingCost = 0

    // Check if order qualifies for free shipping
    if (subtotal >= rate.freeThreshold) {
      shippingCost = 0
    } else {
      // Base rate + weight-based charge
      shippingCost = rate.base + (rate.perKg * weight)
    }

    return NextResponse.json({
      success: true,
      data: {
        shippingCost,
        baseRate: rate.base,
        perKgRate: rate.perKg,
        freeThreshold: rate.freeThreshold,
        isFreeShipping: subtotal >= rate.freeThreshold,
        division: division || 'Unknown',
      },
    })
  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve all available shipping zones
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      zones: Object.keys(SHIPPING_RATES).map((division) => ({
        division,
        ...SHIPPING_RATES[division],
      })),
      default: DEFAULT_RATE,
    },
  })
}
