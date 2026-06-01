import { NextRequest, NextResponse } from 'next/server';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';

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

    const env = await getEnv();

    // Get summary for all movement types
    const [purchaseSummary, saleSummary, returnSummary, adjustmentSummary, transferSummary, damageSummary] = await Promise.all([
      inventoryMovementRepository.getSummary(env, { movementType: 'PURCHASE', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary(env, { movementType: 'SALE', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary(env, { movementType: 'RETURN', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary(env, { movementType: 'ADJUSTMENT', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary(env, { movementType: 'TRANSFER', startDate, endDate, productId, variantId }),
      inventoryMovementRepository.getSummary(env, { movementType: 'DAMAGE', startDate, endDate, productId, variantId }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        movements: [
          { type: 'PURCHASE', count: purchaseSummary.totalMovements, totalIn: purchaseSummary.totalQuantityIn, totalOut: 0, totalCost: purchaseSummary.totalCostIn },
          { type: 'SALE', count: saleSummary.totalMovements, totalIn: 0, totalOut: saleSummary.totalQuantityOut, totalCost: saleSummary.totalCostOut },
          { type: 'RETURN', count: returnSummary.totalMovements, totalIn: returnSummary.totalQuantityIn, totalOut: returnSummary.totalQuantityOut, totalCost: returnSummary.totalCostIn + returnSummary.totalCostOut },
          { type: 'ADJUSTMENT', count: adjustmentSummary.totalMovements, totalIn: adjustmentSummary.totalQuantityIn, totalOut: adjustmentSummary.totalQuantityOut, totalCost: adjustmentSummary.totalCostIn + adjustmentSummary.totalCostOut },
          { type: 'TRANSFER', count: transferSummary.totalMovements, totalIn: 0, totalOut: transferSummary.totalQuantityOut, totalCost: transferSummary.totalCostOut },
          { type: 'DAMAGE', count: damageSummary.totalMovements, totalIn: 0, totalOut: damageSummary.totalQuantityOut, totalCost: damageSummary.totalCostOut },
        ],
        summary: {
          total: purchaseSummary.totalMovements + saleSummary.totalMovements + returnSummary.totalMovements + adjustmentSummary.totalMovements + transferSummary.totalMovements + damageSummary.totalMovements,
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
