import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';
import { logAdminAction } from '@/lib/audit-logger';
import { checkEnv } from '@/lib/api-helpers';
import { purchaseOrderSchema } from '@/lib/validations';
import { queryFirst } from '@/db/db';
import { ZodError } from 'zod';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit;

    console.log('[Purchase Orders API] Fetching orders with filters:', { supplierId, status, startDate, endDate, page, limit });

    const purchaseOrders = await purchaseOrderRepository.findAll(env, {
      supplierId,
      status,
      startDate,
      endDate,
      limit,
      offset,
    });

    console.log('[Purchase Orders API] Fetched orders count:', purchaseOrders.length);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as count FROM purchase_orders WHERE 1=1'
    const countParams: any[] = []
    
    if (supplierId) {
      countSql += ' AND supplierId = ?'
      countParams.push(supplierId)
    }
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    if (startDate) {
      countSql += ' AND createdAt >= ?'
      countParams.push(startDate.toISOString())
    }
    if (endDate) {
      countSql += ' AND createdAt <= ?'
      countParams.push(endDate.toISOString())
    }

    const countResult = await queryFirst<{ count: number }>(
      env,
      countSql,
      ...countParams
    )
    const totalCount = countResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
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
    const { orderDate } = body;

    console.log('[Purchase Orders API] Creating PO with body:', body);
    console.log('[Purchase Orders API] Env available:', !!env);

    // Validate using purchaseOrderSchema
    const validatedData = purchaseOrderSchema.parse(body);
    const { supplierId, items, expectedDate, notes, status } = validatedData;

    // Create purchase order
    console.log('[Purchase Orders API] Calling purchaseOrderRepository.create...');
    const purchaseOrder = await purchaseOrderRepository.create(env, {
      supplierId,
      items,
      orderDate: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString(),
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
      status: status ? status.toUpperCase() : 'PENDING',
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

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errorMessages
        },
        { status: 400 }
      );
    }

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
