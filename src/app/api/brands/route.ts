import { NextRequest, NextResponse } from 'next/server';
import { brandRepository } from '@/db/brand.repository';

// GET /api/brands - Public endpoint for active brands
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured') === 'true';

    let brands;

    if (featured) {
      brands = await brandRepository.getFeatured(20);
    } else {
      brands = await brandRepository.findAll({ activeOnly: true });
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
