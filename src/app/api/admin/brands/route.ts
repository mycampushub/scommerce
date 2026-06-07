import { NextRequest, NextResponse } from 'next/server';
import { BrandRepository } from '@/db/brand.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';
import { brandSchema } from '@/lib/validations';
import { logAdminAction } from '@/lib/audit-logger';
import { queryFirst } from '@/db/db';

// GET /api/admin/brands - List all brands
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const env = await getEnv();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    const includeProductCount = searchParams.get('includeProductCount') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Get total count for pagination
    let totalCount = 0;
    if (search) {
      const searchPattern = `%${search}%`;
      const countConditions = ['(name LIKE ? OR slug LIKE ?)'];
      const countParams: any[] = [searchPattern, searchPattern];
      if (activeOnly) {
        countConditions.push('isActive = 1');
      }
      if (featuredOnly) {
        countConditions.push('featured = 1');
      }
      const countWhere = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';
      const countResult = await queryFirst<{ count: number }>(
        env,
        `SELECT COUNT(*) as count FROM brands ${countWhere}`,
        ...countParams
      );
      totalCount = countResult?.count || 0;
    } else {
      const countConditions: string[] = [];
      const countParams: any[] = [];
      if (activeOnly) countConditions.push('isActive = 1');
      if (featuredOnly) countConditions.push('featured = 1');
      const countWhere = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';
      const countResult = await queryFirst<{ count: number }>(
        env,
        `SELECT COUNT(*) as count FROM brands ${countWhere}`,
        ...countParams
      );
      totalCount = countResult?.count || 0;
    }

    const totalPages = Math.ceil(totalCount / limit);

    let brands: any[] = [];

    if (search) {
      brands = await BrandRepository.searchPaginated(env, search, activeOnly, featuredOnly, includeProductCount, limit, offset);
    } else {
      brands = await BrandRepository.findAllPaginated(env, {
        activeOnly,
        featuredOnly,
        includeProductCount,
      }, limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: brands,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[Brands API] Error fetching brands:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch brands',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/brands - Create new brand
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const admin = userOrResponse as { id: string; email: string; role: string; name?: string };
    const env = await getEnv();

    const body = await request.json();

    console.log('[Brands API] Creating brand with body:', body);

    // Validate with Zod
    const validation = brandSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Brands API] Validation failed:', validation.error.issues);
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Generate slug if not provided
    const brandSlug = validatedData.slug || validatedData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    console.log('[Brands API] Generated slug:', brandSlug);

    // Check if brand with same name or slug already exists
    const existingByName = await BrandRepository.findBySlug(env, brandSlug);
    if (existingByName) {
      console.error('[Brands API] Brand already exists with slug:', brandSlug);
      return NextResponse.json(
        { success: false, error: 'Brand with this name or slug already exists' },
        { status: 409 }
      );
    }

    // Create brand
    const brand = await BrandRepository.create(env, {
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
      console.error('[Brands API] Failed to create brand - no data returned');
      return NextResponse.json(
        { success: false, error: 'Failed to create brand - no data returned' },
        { status: 500 }
      );
    }

    console.log('[Brands API] Brand created successfully:', brand);

    // Log audit event
    try {
      await logAdminAction(
        env,
        request,
        admin.id,
        'CREATE',
        'Brand',
        brand.id,
        `Created brand "${brand.name}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('[Brands API] Failed to log audit event:', error);
    }

    return NextResponse.json({
      success: true,
      data: brand,
    }, { status: 201 });
  } catch (error) {
    console.error('[Brands API] Error creating brand:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if it's a database constraint error
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Brand with this name or slug already exists',
          details: 'Please use a different name or slug'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create brand',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
