import { NextRequest, NextResponse } from 'next/server';
import { inventoryAdjustmentRepository } from '@/db/inventory-adjustment.repository';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/adjustments - Get inventory adjustments
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId') || undefined;
    const variantId = searchParams.get('variantId') || undefined;
    const adjustmentType = searchParams.get('adjustmentType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const adjustments = await inventoryAdjustmentRepository.findAll({
      productId,
      variantId,
      adjustmentType,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: adjustments,
      count: adjustments.length,
    });
  } catch (error) {
    console.error('Error fetching inventory adjustments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory adjustments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory/adjustments - Create stock adjustment
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const body = await request.json();
    const { productId, variantId, adjustmentType, quantityBefore, quantityAfter, reason, notes } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    if (!adjustmentType) {
      return NextResponse.json(
        { success: false, error: 'Adjustment type is required' },
        { status: 400 }
      );
    }
    if (quantityBefore === undefined || quantityBefore < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity before is required' },
        { status: 400 }
      );
    }
    if (quantityAfter === undefined || quantityAfter < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity after is required' },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Verify current stock matches quantityBefore
    let currentStock = 0;
    if (variantId) {
      const variant = await db.product_variants.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        return NextResponse.json(
          { success: false, error: 'Variant not found' },
          { status: 404 }
        );
      }
      currentStock = variant.stock;
    } else {
      const product = await db.products.findUnique({
        where: { id: productId },
      });
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }
      currentStock = product.stock;
    }

    // Allow adjustment if stock has changed, but warn user
    if (currentStock !== quantityBefore) {
      console.warn(`Stock adjustment: Current stock (${currentStock}) does not match quantityBefore (${quantityBefore})`);
    }

    // Apply adjustment
    const result = await inventoryAdjustmentRepository.applyAdjustment({
      productId,
      variantId: variantId || null,
      adjustmentType,
      quantityBefore,
      quantityAfter,
      reason,
      approvedBy: admin.id,
    });

    return NextResponse.json({
      success: true,
      data: result.adjustment,
      movement: result.movement,
      message: 'Stock adjustment applied successfully',
    });
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stock adjustment' },
      { status: 500 }
    );
  }
}
