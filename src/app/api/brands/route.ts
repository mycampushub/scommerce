import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { BrandRepository } from '@/db/brand.repository';
import { rateLimitMiddleware } from '@/lib/rate-limit';

// GET /api/brands - Public endpoint for active brands
export async function GET(request: NextRequest) {
  // Apply rate limiting for public API
  const rateLimitResponse = await rateLimitMiddleware(request, 'public');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const env = await getEnv();
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured') === 'true';

    let brands;

    if (featured) {
      brands = await BrandRepository.getFeatured(env, 20);
    } else {
      brands = await BrandRepository.findAll(env, { activeOnly: true });
    }

    return NextResponse.json({
      success: true,
      data: brands,
      count: brands.length,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
