import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { queryFirst, execute } from '@/db/db';
import { verifyAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/audit-logger';

// DELETE /api/admin/inventory/adjustments/[id] - Delete a stock adjustment
export async function DELETE(
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
      approved: number;
    }>(
      env,
      'SELECT id, approved FROM inventory_adjustments WHERE id = ?',
      id
    );

    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: 'Adjustment not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if already approved
    if (adjustment.approved === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete an approved adjustment' },
        { status: 400 }
      );
    }

    // Delete the adjustment
    await execute(env, 'DELETE FROM inventory_adjustments WHERE id = ?', id);

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'InventoryAdjustment',
      id,
      `Deleted inventory adjustment ${id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Stock adjustment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting stock adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete stock adjustment' },
      { status: 500 }
    );
  }
}
