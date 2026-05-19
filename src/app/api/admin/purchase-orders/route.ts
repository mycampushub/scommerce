import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/purchase-orders - List all purchase orders
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get('supplierId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const purchaseOrders = await purchaseOrderRepository.findAll({
      supplierId,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrders,
      count: purchaseOrders.length,
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

// POST /api/admin/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const body = await request.json();
    const { supplierId, items, orderDate, expectedDate, notes } = body;

    // Validation
    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: 'Supplier is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for each item' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid quantity is required for each item' },
          { status: 400 }
        );
      }
      if (!item.unitCost || item.unitCost <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid unit cost is required for each item' },
          { status: 400 }
        );
      }
    }

    // Create purchase order
    const purchaseOrder = await purchaseOrderRepository.create({
      supplierId,
      items,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      totalAmount: 0, // Will be calculated in repository
      totalQuantity: 0, // Will be calculated in repository
      status: 'PENDING',
      orderNumber: '', // Will be generated in repository
      receivedDate: null, // Will be set when received
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
