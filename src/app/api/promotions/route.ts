import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, numberToBool, parseJSON } from '@/db/db'

export const runtime = 'edge';

export async function GET() {
  // Get D1 database from request context
  const env = getEnv(new Request('https://example.com'))

  try {
    const promotions = await queryAll(
      env,
      'SELECT * FROM promotions WHERE isActive = 1 ORDER BY `order` ASC, createdAt DESC'
    )

    // Transform promotions to convert boolean fields and parse JSON
    const transformedPromotions = promotions.map((promo: any) => ({
      ...promo,
      isActive: numberToBool(promo.isActive),
      ...(promo.discountRules ? { discountRules: parseJSON(promo.discountRules) } : {}),
      ...(promo.applicableProducts ? { applicableProducts: parseJSON(promo.applicableProducts) } : {}),
      ...(promo.applicableCategories ? { applicableCategories: parseJSON(promo.applicableCategories) } : {}),
    }))

    return NextResponse.json({
      success: true,
      data: transformedPromotions
    })
  } catch (error) {
    console.error('Error fetching promotions:', error)
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    })
  }
}
