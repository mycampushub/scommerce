import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// DELETE /api/admin/inventory/adjustments/[id] - Delete a stock adjustment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Prevent deletion if already approved
    if (adjustment.approved) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete an approved adjustment' },
        { status: 400 }
      );
    }

    // Delete the adjustment
    await db.inventory_adjustments.delete({
      where: { id },
    });

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
