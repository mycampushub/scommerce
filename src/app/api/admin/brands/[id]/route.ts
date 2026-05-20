import { NextRequest, NextResponse } from 'next/server';
import { brandRepository } from '@/db/brand.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

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
    const { name, slug, logo, website, description, country, isActive, featured, sortOrder } = body;

    // If updating slug, check uniqueness
    if (slug && slug !== brand.slug) {
      const existingBySlug = await brandRepository.findBySlug(slug);
      if (existingBySlug) {
        return NextResponse.json(
          { success: false, error: 'Brand with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (logo !== undefined) updateData.logo = logo;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;
    if (country !== undefined) updateData.country = country;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (featured !== undefined) updateData.featured = featured;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedBrand = await brandRepository.update(id, updateData);

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
