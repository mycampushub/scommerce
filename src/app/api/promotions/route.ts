import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, numberToBool, parseJSON } from '@/db/db'
import { addCacheHeaders, CachePresets } from '@/lib/http-cache'


export async function GET() {
  // Get D1 database from request context
  const env = await getEnv(new Request('https://example.com'))

  try {
    const promotions = await queryAll(
      env,
      'SELECT * FROM promotions WHERE isActive = 1 ORDER BY `order` ASC, createdAt DESC'
    )

    // Transform promotions to convert boolean fields and parse JSON
    const transformedPromotions = promotions.map((promo: any) => {
      // Parse JSON fields
      const discountRules = promo.discountRules ? parseJSON(promo.discountRules) as { minOrderValue?: number; maxDiscountAmount?: number; [key: string]: any } | null : null;

      return {
        id: promo.id,
        name: promo.name,
        description: promo.description,
        code: promo.code,
        discountType: promo.discountType, // FIXED, PERCENTAGE, BOGO, etc.
        discountValue: promo.discountValue, // The actual discount amount/percentage customers get
        minOrderValue: discountRules?.minOrderValue || null, // Only expose min order value for transparency
        maxDiscountAmount: discountRules?.maxDiscountAmount || null, // Only expose max discount for transparency
        startDate: promo.startDate,
        endDate: promo.endDate,
        usageLimit: promo.usageLimit,
        usedCount: promo.usedCount,
        isActive: numberToBool(promo.isActive),
        // INTERNAL FIELDS NOT EXPOSED:
        // - discountRules: Contains internal business logic
        // - applicableProducts: Exposes internal product IDs
        // - applicableCategories: Exposes internal category IDs
      };
    })

    const response = NextResponse.json({
      success: true,
      data: transformedPromotions
    })

    // Add caching headers for promotions (static content - 1 hour)
    return addCacheHeaders(response, CachePresets.STATIC);
  } catch (error) {
    console.error('Error fetching promotions:', error)
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    })
  }
}
