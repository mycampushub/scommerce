import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';
import { logAdminAction } from '@/lib/audit-logger';
import { checkEnv } from '@/lib/api-helpers';

// GET /api/admin/purchase-orders - List all purchase orders
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const env = await getEnv();

    // Check if database is available
    const envCheck = checkEnv(env);
    if (envCheck) {
      return envCheck;
    }

    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get('supplierId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    console.log('[Purchase Orders API] Fetching orders with filters:', { supplierId, status, startDate, endDate });

    const purchaseOrders = await purchaseOrderRepository.findAll(env, {
      supplierId,
      status,
      startDate,
      endDate,
    });

    console.log('[Purchase Orders API] Fetched orders count:', purchaseOrders.length);

    return NextResponse.json({
      success: true,
      data: purchaseOrders,
      count: purchaseOrders.length,
    });
  } catch (error) {
    console.error('[Purchase Orders API] Error fetching purchase orders:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch purchase orders',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin']);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const admin = userOrResponse as { id: string; email: string; role: string; name?: string };
    const env = await getEnv();

    // Check if database is available
    const envCheck = checkEnv(env);
    if (envCheck) {
      return envCheck;
    }

    const body = await request.json();
    const { supplierId, items, orderDate, expectedDate, notes } = body;

    console.log('[Purchase Orders API] Creating PO with body:', body);
    console.log('[Purchase Orders API] Env available:', !!env);

    // Validation
    if (!supplierId) {
      console.error('[Purchase Orders API] Supplier ID is required');
      return NextResponse.json(
        { success: false, error: 'Supplier is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('[Purchase Orders API] Items array is required');
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`[Purchase Orders API] Validating item ${i + 1}:`, item);
      if (!item.productId) {
        console.error('[Purchase Orders API] Product ID is required for each item');
        return NextResponse.json(
          { success: false, error: 'Product ID is required for each item' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity <= 0) {
        console.error('[Purchase Orders API] Valid quantity is required for each item');
        return NextResponse.json(
          { success: false, error: 'Valid quantity is required for each item' },
          { status: 400 }
        );
      }
      if (!item.unitCost || item.unitCost <= 0) {
        console.error('[Purchase Orders API] Valid unit cost is required for each item');
        return NextResponse.json(
          { success: false, error: 'Valid unit cost is required for each item' },
          { status: 400 }
        );
      }
    }

    // Create purchase order
    console.log('[Purchase Orders API] Calling purchaseOrderRepository.create...');
    const purchaseOrder = await purchaseOrderRepository.create(env, {
      supplierId,
      items,
      orderDate: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString(),
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
      status: 'PENDING',
      notes: notes || null,
    });

    console.log('[Purchase Orders API] Repository returned:', purchaseOrder);

    if (!purchaseOrder) {
      console.error('[Purchase Orders API] Failed to create purchase order - no data returned from repository');
      return NextResponse.json(
        { success: false, error: 'Failed to create purchase order - no data returned from repository' },
        { status: 500 }
      );
    }

    console.log('[Purchase Orders API] Purchase order created successfully:', purchaseOrder.orderNumber);

    // Log audit event
    try {
      await logAdminAction(
        env,
        request,
        admin.id,
        'CREATE',
        'PurchaseOrder',
        purchaseOrder.id,
        `Created purchase order "${purchaseOrder.orderNumber}"`
      );
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('[Purchase Orders API] Failed to log audit event:', error);
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    }, { status: 201 });
  } catch (error) {
    console.error('[Purchase Orders API] Error creating purchase order:', error);
    console.error('[Purchase Orders API] Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('[Purchase Orders API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Purchase Orders API] Error name:', error instanceof Error ? error.name : 'Unknown');

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if it's a database constraint error
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A purchase order with this order number already exists',
          details: 'Please try again'
        },
        { status: 409 }
      );
    }

    // Check if it's a database structure error
    if (errorMessage.includes('has no column') || errorMessage.includes('datatype mismatch') || errorMessage.includes('wrong number of parameters')) {
      console.error('[Purchase Orders API] Database structure error:', errorMessage);
      return NextResponse.json(
        {
          success: false,
          error: 'Database structure error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : 'Contact administrator'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create purchase order',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
