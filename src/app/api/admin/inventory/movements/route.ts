import { NextRequest, NextResponse } from 'next/server';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';
import { queryFirst } from '@/db/db';

// GET /api/admin/inventory/movements - Get inventory movements
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const env = await getEnv();

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId') || undefined;
    const variantId = searchParams.get('variantId') || undefined;
    const movementType = searchParams.get('movementType') || undefined;
    const referenceId = searchParams.get('referenceId') || undefined;
    const referenceType = searchParams.get('referenceType') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // Return summary statistics
      const summaryData = await inventoryMovementRepository.getSummary(env, {
        productId,
        variantId,
        movementType,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      });

      return NextResponse.json({
        success: true,
        data: summaryData,
      });
    }

    const movements = await inventoryMovementRepository.findAll(env, {
      productId,
      variantId,
      movementType,
      referenceId,
      referenceType,
      limit,
      offset,
    });

    // Get total count for pagination
    const countResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM inventory_movements
       WHERE 1=1
       ${productId ? 'AND productId = ?' : ''}
       ${variantId ? 'AND variantId = ?' : ''}
       ${movementType ? 'AND movementType = ?' : ''}
       ${referenceId ? 'AND referenceId = ?' : ''}
       ${referenceType ? 'AND referenceType = ?' : ''}`,
      ...[productId, variantId, movementType, referenceId, referenceType].filter(v => v !== undefined)
    );
    const totalCount = countResult?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory movements' },
      { status: 500 }
    );
  }
}

// POST /api/admin/inventory/movements - Create manual inventory movement
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const env = await getEnv();

    const body = await request.json();
    const { productId, variantId, movementType, quantity, unitCost, totalCost, referenceId, referenceType, notes, supplierId } = body;

    // Validation
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    if (!movementType) {
      return NextResponse.json(
        { success: false, error: 'Movement type is required' },
        { status: 400 }
      );
    }
    if (quantity === undefined || quantity === 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity is required' },
        { status: 400 }
      );
    }

    // Create movement
    const movement = await inventoryMovementRepository.create(env, {
      productId,
      variantId: variantId || null,
      movementType,
      quantity,
      unitCost: unitCost || null,
      totalCost: totalCost || null,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      supplierId: supplierId || null,
      notes: notes || null,
      approved: 1,
      approvedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: movement,
    });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create inventory movement' },
      { status: 500 }
    );
  }
}
