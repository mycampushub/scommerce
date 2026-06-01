import { NextRequest, NextResponse } from 'next/server';
import { purchaseOrderRepository } from '@/db/purchase-order.repository';
import { getEnv } from '@/lib/cloudflare';
import { queryAll } from '@/db/db';
import { verifyAdmin } from '@/lib/admin-auth';

// GET /api/admin/inventory/reports/purchase - Purchase history report
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const env = await getEnv();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const productId = searchParams.get('productId') || undefined;

    // Get purchase orders
    const purchaseOrders = await purchaseOrderRepository.findAll(env, {
      supplierId,
      status: 'RECEIVED',
      startDate,
      endDate,
    });

    // Get all unique product IDs from PO items
    const productIds = new Set<string>();
    purchaseOrders.forEach(po => {
      po.items.forEach(item => productIds.add(item.productId));
    });

    // Fetch all products using raw SQL
    let products: any[] = [];
    if (productIds.size > 0) {
      const placeholders = Array.from(productIds).map(() => '?').join(',');
      products = await queryAll<any>(
        env,
        `SELECT id, name FROM products WHERE id IN (${placeholders})`,
        ...Array.from(productIds)
      );
    }

    // Create product name map
    const productNames = new Map(products.map(p => [p.id, p.name]));

    // Calculate statistics
    let totalPOs = 0;
    let totalAmount = 0;
    let totalQuantity = 0;
    const supplierStats = new Map<string, { name: string; count: number; amount: number; quantity: number }>();
    const productPurchases = new Map<string, { name: string; quantity: number; cost: number }>();

    for (const po of purchaseOrders) {
      totalPOs++;
      totalAmount += po.totalAmount;
      totalQuantity += po.totalQuantity;

      // Supplier stats
      if (!supplierStats.has(po.supplierId)) {
        supplierStats.set(po.supplierId, {
          name: po.supplier.name,
          count: 0,
          amount: 0,
          quantity: 0,
        });
      }
      const supplier = supplierStats.get(po.supplierId)!;
      supplier.count++;
      supplier.amount += po.totalAmount;
      supplier.quantity += po.totalQuantity;

      // Product stats
      for (const item of po.items) {
        const productName = productNames.get(item.productId) || 'Unknown';
        if (!productPurchases.has(item.productId)) {
          productPurchases.set(item.productId, {
            name: productName,
            quantity: 0,
            cost: 0,
          });
        }
        const product = productPurchases.get(item.productId)!;
        product.quantity += item.receivedQty;
        product.cost += item.receivedQty * item.unitCost;
      }
    }

    // Convert maps to arrays and sort
    const supplierBreakdown = Array.from(supplierStats.values())
      .sort((a, b) => b.amount - a.amount);

    const productBreakdown = Array.from(productPurchases.values())
      .sort((a, b) => b.cost - a.cost);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPOs,
          totalAmount,
          totalQuantity,
        },
        suppliers: supplierBreakdown.map(s => ({
          supplier: s.name,
          poCount: s.count,
          totalAmount: s.amount,
          totalQuantity: s.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('Error generating purchase report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate purchase report' },
      { status: 500 }
    );
  }
}
