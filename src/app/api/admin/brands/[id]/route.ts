import { NextRequest, NextResponse } from 'next/server';
import { brandRepository } from '@/db/brand.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';
import { updateBrandSchema } from '@/lib/validations';
import { logAdminAction } from '@/lib/audit-logger';

// GET /api/admin/brands/[id] - Get single brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const brand = await brandRepository.findById(id);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Get product count
    const usage = await brandRepository.checkUsage(id);

    return NextResponse.json({
      success: true,
      data: {
        ...brand,
        productCount: usage.products,
      },
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand' },
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
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const brand = await brandRepository.findById(id);
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
      const existingBySlug = await brandRepository.findBySlug(validatedData.slug);
      if (existingBySlug) {
        return NextResponse.json(
          { success: false, error: 'Brand with this slug already exists' },
          { status: 400 }
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
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive ? 1 : 0;
    if (validatedData.featured !== undefined) updateData.featured = validatedData.featured ? 1 : 0;
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder;

    const updatedBrand = await brandRepository.update(id, updateData);

    // Log audit event
    await logAdminAction(
      null,
      request,
      admin.id,
      'UPDATE',
      'Brand',
      brand.id,
      `Updated brand "${brand.name}"`
    );

    return NextResponse.json({
      success: true,
      data: updatedBrand,
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update brand' },
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
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const brand = await brandRepository.findById(id);
    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Check if brand is in use
    const usage = await brandRepository.checkUsage(id);
    if (usage.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete brand. It is used by ${usage.products} product(s).`,
        },
        { status: 400 }
      );
    }

    await brandRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand' },
      { status: 500 }
    );
  }
}
