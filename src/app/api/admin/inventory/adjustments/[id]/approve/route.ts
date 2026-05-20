import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// POST /api/admin/inventory/adjustments/[id]/approve - Approve a stock adjustment
export async function POST(
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

    // Find the adjustment
    const adjustment = await db.inventory_adjustments.findUnique({
      where: { id },
    });

    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    // Check if already approved
    if (adjustment.approved) {
      return NextResponse.json(
        { success: false, error: 'Adjustment is already approved' },
        { status: 400 }
      );
    }

    // Update stock
    if (adjustment.variantId) {
      await db.product_variants.update({
        where: { id: adjustment.variantId },
        data: { stock: adjustment.quantityAfter },
      });
    } else {
      await db.products.update({
        where: { id: adjustment.productId },
        data: { stock: adjustment.quantityAfter },
      });
    }

    // Create inventory movement
    await inventoryMovementRepository.create({
      productId: adjustment.productId,
      variantId: adjustment.variantId,
      movementType: 'ADJUSTMENT',
      quantity: adjustment.quantityDiff,
      notes: adjustment.reason || null,
      unitCost: 0,
      totalCost: 0,
      referenceId: adjustment.id,
      referenceType: 'ADJUSTMENT',
      supplierId: null,
      approved: 1,
      approvedAt: new Date(),
    });

    // Update adjustment as approved
    const updatedAdjustment = await db.inventory_adjustments.update({
      where: { id },
      data: {
        approved: 1,
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAdjustment,
      message: 'Stock adjustment approved successfully',
    });
  } catch (error) {
    console.error('Error approving stock adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve stock adjustment' },
      { status: 500 }
    );
  }
}
