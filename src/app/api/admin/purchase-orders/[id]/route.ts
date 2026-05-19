import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/purchase-orders/[id] - Get single purchase order
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

    const purchaseOrder = await purchaseOrderRepository.findById(id);

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
    console.error('Error fetching purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase order' },
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
    const { id } = await params;
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const po = await purchaseOrderRepository.findById(id);
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

    // Prepare update data
    const updateData: any = {};
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (orderDate !== undefined) updateData.orderDate = new Date(orderDate);
    if (expectedDate !== undefined) updateData.expectedDate = expectedDate ? new Date(expectedDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined && status !== 'RECEIVED') {
      updateData.status = status;
    }

    const updatedPO = await purchaseOrderRepository.update(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedPO,
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update purchase order' },
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
    const { id } = await params;
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const po = await purchaseOrderRepository.findById(id);
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

    await purchaseOrderRepository.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Purchase order cancelled successfully',
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete purchase order' },
      { status: 500 }
    );
  }
}
