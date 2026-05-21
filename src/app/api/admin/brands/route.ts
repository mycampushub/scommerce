import { NextRequest, NextResponse } from 'next/server';
import { brandRepository } from '@/db/brand.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { brandSchema } from '@/lib/validations';
import { logAdminAction } from '@/lib/audit-logger';

// GET /api/admin/brands - List all brands
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
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
    if (admin instanceof NextResponse) {
      return admin;
    }

    const body = await request.json();

    // Validate with Zod
    const validation = brandSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Generate slug if not provided
    const brandSlug = validatedData.slug || validatedData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

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
      name: validatedData.name,
      slug: brandSlug,
      logo: validatedData.logo || null,
      website: validatedData.website || null,
      description: validatedData.description || null,
      country: validatedData.country || null,
      isActive: validatedData.isActive !== undefined ? (validatedData.isActive ? 1 : 0) : 1,
      featured: validatedData.featured !== undefined ? (validatedData.featured ? 1 : 0) : 0,
      sortOrder: validatedData.sortOrder || 0,
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Failed to create brand - no data returned' },
        { status: 500 }
      );
    }

    // Log audit event
    try {
      await logAdminAction(
        null,
        request,
        admin.id,
        'CREATE',
        'Brand',
        brand.id,
        `Created brand "${brand.name}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Failed to log audit event:', error);
    }

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
