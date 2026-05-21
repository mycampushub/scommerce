import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';
import { logAdminAction } from '@/lib/audit-logger';

// GET /api/admin/purchase-orders/[id] - Get single purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = await getEnv();
    const { id } = await params;
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const purchaseOrder = await purchaseOrderRepository.findById(env, id);

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('[Purchase Orders API] Error fetching purchase order:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch purchase order',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = await getEnv();
    const { id } = await params;
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const admin = userOrResponse as { id: string; email: string; role: string; name?: string };

    const po = await purchaseOrderRepository.findById(env, id);
    if (!po) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Cannot update if already received
    if (po.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: 'Cannot update a received purchase order' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { supplierId, orderDate, expectedDate, notes, status } = body;

    console.log('[Purchase Orders API] Updating PO:', id, body);

    // Prepare update data
    const updateData: any = {};
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (orderDate !== undefined) updateData.orderDate = new Date(orderDate);
    if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined && status !== 'RECEIVED') {
      updateData.status = status;
    }

    const updatedPO = await purchaseOrderRepository.update(env, id, updateData);

    console.log('[Purchase Orders API] PO updated successfully:', updatedPO?.orderNumber);

    // Log audit event
    try {
      await logAdminAction(
        env,
        request,
        admin.id,
        'UPDATE',
        'PurchaseOrder',
        id,
        `Updated purchase order "${po.orderNumber}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('[Purchase Orders API] Failed to log audit event:', error);
    }

    return NextResponse.json({
      success: true,
      data: updatedPO,
    });
  } catch (error) {
    console.error('[Purchase Orders API] Error updating purchase order:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update purchase order',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/purchase-orders/[id] - Cancel/delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = await getEnv();
    const { id } = await params;
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const admin = userOrResponse as { id: string; email: string; role: string; name?: string };

    const po = await purchaseOrderRepository.findById(env, id);
    if (!po) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      );
    }

    // Cannot delete if already received
    if (po.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a received purchase order' },
        { status: 400 }
      );
    }

    await purchaseOrderRepository.delete(env, id);

    console.log('[Purchase Orders API] PO deleted successfully:', po.orderNumber);

    // Log audit event
    try {
      await logAdminAction(
        env,
        request,
        admin.id,
        'DELETE',
        'PurchaseOrder',
        id,
        `Deleted purchase order "${po.orderNumber}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('[Purchase Orders API] Failed to log audit event:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase order cancelled successfully',
    });
  } catch (error) {
    console.error('[Purchase Orders API] Error deleting purchase order:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete purchase order',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
