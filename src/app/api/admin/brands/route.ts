import { NextRequest, NextResponse } from 'next/server';
import { brandRepository } from '@/db/brand.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/brands - List all brands
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    const includeProductCount = searchParams.get('includeProductCount') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let brands;

    if (search) {
      brands = await brandRepository.search(search, activeOnly);
    } else {
      brands = await brandRepository.findAll({
        activeOnly,
        featuredOnly,
        includeProductCount,
      });
    }

    // Apply limit if specified
    if (limit && limit > 0 && brands.length > limit) {
      brands = brands.slice(0, limit);
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

// POST /api/admin/brands - Create new brand
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, logo, website, description, country, isActive = 1, featured = 0, sortOrder = 0 } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const brandSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if brand with same name or slug already exists
    const existingByName = await brandRepository.findBySlug(brandSlug);
    if (existingByName) {
      return NextResponse.json(
        { success: false, error: 'Brand with this name or slug already exists' },
        { status: 400 }
      );
    }

    // Create brand
    const brand = await brandRepository.create({
      name,
      slug: brandSlug,
      logo: logo || null,
      website: website || null,
      description: description || null,
      country: country || null,
      isActive,
      featured,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    );
  }
}
