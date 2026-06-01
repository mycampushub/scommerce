import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { queryFirst, execute } from '@/db/db';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/audit-logger';

// POST /api/admin/inventory/adjustments/[id]/approve - Approve a stock adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = await getEnv();
    const { id } = await params;

    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    // Find the adjustment
    const adjustment = await queryFirst<{
      id: string;
      productId: string;
      variantId: string | null;
      quantityAfter: number;
      quantityDiff: number;
      reason: string | null;
      approved: number;
      adjustmentType: string;
    }>(
      env,
      `SELECT id, productId, variantId, quantityAfter, quantityDiff, reason, approved, adjustmentType
       FROM inventory_adjustments
       WHERE id = ?`,
      id
    );

    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    // Check if already approved
    if (adjustment.approved === 1) {
      return NextResponse.json(
        { success: false, error: 'Adjustment is already approved' },
        { status: 400 }
      );
    }

    // Update stock
    if (adjustment.variantId) {
      await execute(
        env,
        'UPDATE product_variants SET stock = ? WHERE id = ?',
        adjustment.quantityAfter,
        adjustment.variantId
      );
    } else {
      await execute(
        env,
        'UPDATE products SET stock = ? WHERE id = ?',
        adjustment.quantityAfter,
        adjustment.productId
      );
    }

    // Create inventory movement
    await inventoryMovementRepository.create(env, {
      productId: adjustment.productId,
      variantId: adjustment.variantId,
      movementType: 'ADJUSTMENT',
      quantity: adjustment.quantityDiff,
      notes: adjustment.reason || null,
      unitCost: null,
      totalCost: null,
      referenceId: adjustment.id,
      referenceType: 'ADJUSTMENT',
      supplierId: null,
      approved: 1,
      approvedAt: new Date().toISOString(),
    });

    // Update adjustment as approved
    await execute(
      env,
      `UPDATE inventory_adjustments
       SET approved = 1, approvedBy = ?, approvedAt = ?
       WHERE id = ?`,
      admin.id,
      new Date().toISOString(),
      id
    );

    // Log audit event
    const quantityBefore = adjustment.quantityAfter - adjustment.quantityDiff;
    await logAdminAction(
      env,
      request,
      admin.id,
      'APPROVE',
      'AdminLog',
      id,
      `Approved inventory adjustment: ${adjustment.quantityDiff > 0 ? '+' : ''}${adjustment.quantityDiff} units (from ${quantityBefore} to ${adjustment.quantityAfter}) for ${adjustment.adjustmentType} - ${adjustment.reason || 'No reason provided'}`
    );

    // Fetch the updated adjustment
    const updatedAdjustment = await queryFirst<{
      id: string;
      productId: string;
      variantId: string | null;
      adjustmentType: string;
      quantityBefore: number;
      quantityAfter: number;
      quantityDiff: number;
      reason: string;
      notes: string | null;
      approvedBy: string | null;
      approved: number;
      approvedAt: string | null;
      createdAt: string;
    }>(
      env,
      `SELECT id, productId, variantId, adjustmentType, quantityBefore, quantityAfter,
              quantityDiff, reason, notes, approvedBy, approved, approvedAt, createdAt
       FROM inventory_adjustments
       WHERE id = ?`,
      id
    );

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
