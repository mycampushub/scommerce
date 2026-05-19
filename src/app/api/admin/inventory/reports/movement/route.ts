import { NextRequest, NextResponse } from 'next/server';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/reports/movement - Movement summary report
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const productId = searchParams.get('productId') || undefined;
    const variantId = searchParams.get('variantId') || undefined;

    // Get summary for all movement types
    const [purchaseSummary, saleSummary, returnSummary, adjustmentSummary, transferSummary, damageSummary] = await Promise.all([
      inventoryMovementRepository.getSummary({ movementType: 'PURCHASE', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary({ movementType: 'SALE', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary({ movementType: 'RETURN', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary({ movementType: 'ADJUSTMENT', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary({ movementType: 'TRANSFER', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary({ movementType: 'DAMAGE', startDate, endDate, productId, variantId }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDate?.toISOString() || null,
          endDate: endDate?.toISOString() || null,
        },
        summary: {
          purchase: purchaseSummary,
          sale: saleSummary,
          return: returnSummary,
          adjustment: adjustmentSummary,
          transfer: transferSummary,
          damage: damageSummary,
        },
        totals: {
          totalMovements: purchaseSummary.totalMovements + saleSummary.totalMovements + returnSummary.totalMovements + adjustmentSummary.totalMovements + transferSummary.totalMovements + damageSummary.totalMovements,
          totalIn: purchaseSummary.totalQuantityIn + returnSummary.totalQuantityIn + adjustmentSummary.totalQuantityIn,
          totalOut: saleSummary.totalQuantityOut + returnSummary.totalQuantityOut + transferSummary.totalQuantityOut + damageSummary.totalQuantityOut,
        },
      },
    });
  } catch (error) {
    console.error('Error generating movement report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate movement report' },
      { status: 500 }
    );
  }
}
