import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { verifyAdmin } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';

// POST /api/admin/purchase-orders/[id]/receive - Receive purchase order and update inventory
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

    const body = await request.json();
    const { items } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items are required' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemId) {
        return NextResponse.json(
          { success: false, error: 'Item ID is required' },
          { status: 400 }
        );
      }
      if (item.quantity === undefined || item.quantity < 0) {
        return NextResponse.json(
          { success: false, error: 'Valid quantity is required for each item' },
          { status: 400 }
        );
      }
    }

    const env = await getEnv();

    // Receive the order
    const updatedPO = await purchaseOrderRepository.receiveOrder(env, id, items);

    return NextResponse.json({
      success: true,
      data: updatedPO,
      message: 'Purchase order received successfully. Inventory updated.',
    });
  } catch (error: any) {
    console.error('Error receiving purchase order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to receive purchase order' },
      { status: 500 }
    );
  }
}
