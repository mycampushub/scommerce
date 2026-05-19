import { NextRequest, NextResponse } from 'next/server';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/movements - Get inventory movements
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId') || undefined;
    const variantId = searchParams.get('variantId') || undefined;
    const movementType = searchParams.get('movementType') || undefined;
    const referenceId = searchParams.get('referenceId') || undefined;
    const referenceType = searchParams.get('referenceType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // Return summary statistics
      const summaryData = await inventoryMovementRepository.getSummary({
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

    const movements = await inventoryMovementRepository.findAll({
      productId,
      variantId,
      movementType,
      referenceId,
      referenceType,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: movements,
      count: movements.length,
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
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    const movement = await inventoryMovementRepository.create({
      productId,
      variantId: variantId || null,
      movementType,
      quantity,
      unitCost: unitCost || null,
      totalCost: totalCost || null,
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      supplierId: supplierId || null,
      approved: 1,
      approvedAt: new Date(),
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
