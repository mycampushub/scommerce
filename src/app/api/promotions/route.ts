import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, numberToBool, parseJSON } from '@/db/db'
import { addCacheHeaders, CachePresets } from '@/lib/http-cache'


export async function GET() {
  // Get D1 database from request context
  const env = await getEnv(new Request('https://example.com'))

  try {
    // Only fetch banner promotions for homepage display (not coupons)
    const promotions = await queryAll(
      env,
      'SELECT id, title, description, image, ctaText, ctaLink FROM promotions WHERE type = ? AND isActive = 1 ORDER BY `order` ASC, createdAt DESC',
      'banner'
    )

    // Transform promotions to match frontend expectations
    const transformedPromotions = promotions.map((promo: any) => ({
      id: promo.id,
      title: promo.title,
      subtitle: promo.description || '',
      image: promo.image || '',
      href: promo.ctaLink || '#'
    }))

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
