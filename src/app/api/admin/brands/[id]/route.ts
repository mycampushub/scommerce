import { NextRequest, NextResponse } from 'next/server';
import { BrandRepository } from '@/db/brand.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';
import { updateBrandSchema } from '@/lib/validations';
import { logAdminAction } from '@/lib/audit-logger';
import { boolToNumber } from '@/db/db';

// GET /api/admin/brands/[id] - Get single brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const env = await getEnv();
    const brand = await BrandRepository.findById(env, id);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Get product count
    const usage = await BrandRepository.checkUsage(env, id);

    return NextResponse.json({
      success: true,
      data: {
        ...brand,
        productCount: usage.products,
      },
    });
  } catch (error) {
    console.error('[Brand API] Error fetching brand:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch brand',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/brands/[id] - Update brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const admin = userOrResponse as { id: string; email: string; role: string; name?: string };
    const env = await getEnv();

    const brand = await BrandRepository.findById(env, id);
    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const validation = updateBrandSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message, details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // If updating slug, check uniqueness
    if (validatedData.slug && validatedData.slug !== brand.slug) {
      const existingBySlug = await BrandRepository.findBySlug(env, validatedData.slug);
      if (existingBySlug) {
        return NextResponse.json(
          { success: false, error: 'Brand with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.logo !== undefined) updateData.logo = validatedData.logo;
    if (validatedData.website !== undefined) updateData.website = validatedData.website;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.country !== undefined) updateData.country = validatedData.country;
    if (validatedData.isActive !== undefined) updateData.isActive = boolToNumber(validatedData.isActive);
    if (validatedData.featured !== undefined) updateData.featured = boolToNumber(validatedData.featured);
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder;

    const updatedBrand = await BrandRepository.update(env, id, updateData);

    // Log audit event
    try {
      await logAdminAction(
        env,
        request,
        admin.id,
        'UPDATE',
        'Brand',
        brand.id,
        `Updated brand "${brand.name}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('[Brand API] Failed to log audit event:', error);
    }

    return NextResponse.json({
      success: true,
      data: updatedBrand,
    });
  } catch (error) {
    console.error('[Brand API] Error updating brand:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update brand',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/brands/[id] - Delete brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const admin = userOrResponse as { id: string; email: string; role: string; name?: string };
    const env = await getEnv();

    const brand = await BrandRepository.findById(env, id);
    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Check if brand is in use
    const usage = await BrandRepository.checkUsage(env, id);
    if (usage.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete brand. It is used by ${usage.products} product(s).`,
        },
        { status: 400 }
      );
    }

    await BrandRepository.delete(env, id);

    // Log audit event
    try {
      await logAdminAction(
        env,
        request,
        admin.id,
        'DELETE',
        'Brand',
        id,
        `Deleted brand "${brand.name}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('[Brand API] Failed to log audit event:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    console.error('[Brand API] Error deleting brand:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete brand',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
