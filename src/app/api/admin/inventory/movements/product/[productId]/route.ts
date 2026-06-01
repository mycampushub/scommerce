import { NextRequest, NextResponse } from 'next/server';
import { inventoryMovementRepository } from '@/db/inventory-movement.repository';
import { verifyAdmin } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';

// GET /api/admin/inventory/movements/product/[productId] - Get movements for a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const env = await getEnv();
    const searchParams = request.nextUrl.searchParams;
    const variantId = searchParams.get('variantId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const movements = await inventoryMovementRepository.findByProduct(
      env,
      productId,
      variantId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: movements,
      count: movements.length,
    });
  } catch (error) {
    console.error('Error fetching product movements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product movements' },
      { status: 500 }
    );
  }
}
