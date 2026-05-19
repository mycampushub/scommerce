import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/reports/stock - Stock status report
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const status = searchParams.get('status') || 'all'; // all, low, out, overstock

    // Get all products with filters
    let where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;

    const products = await db.products.findMany({
      where,
      include: {
        categories: true,
        product_variants: true,
      },
    });

    const stockStatus: any[] = [];
    let totalProducts = 0;
    let totalVariants = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let healthyStock = 0;
    let overstock = 0;

    products.forEach((product) => {
      if (product.hasVariants && product.product_variants.length > 0) {
        // Product with variants
        product.product_variants.forEach((variant) => {
          totalVariants++;
          const statusInfo = getStockStatus(variant.stock, variant.lowStockAlert, variant.reorderLevel);
          stockStatus.push({
            id: variant.id,
            type: 'variant',
            productId: product.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            category: product.categories?.name || 'N/A',
            stock: variant.stock,
            lowStockAlert: variant.lowStockAlert,
            reorderLevel: variant.reorderLevel,
            reorderQty: variant.reorderQty,
            status: statusInfo.status,
            statusLabel: statusInfo.label,
            needsReorder: variant.stock <= variant.reorderLevel,
            price: variant.price,
            cost: variant.averageCost || variant.costPrice || 0,
          });

          if (variant.stock === 0) outOfStock++;
          else if (variant.stock <= variant.lowStockAlert) lowStock++;
          else if (variant.stock > variant.lowStockAlert * 2) overstock++;
          else healthyStock++;
        });
      } else {
        // Product without variants
        totalProducts++;
        const statusInfo = getStockStatus(product.stock, product.lowStockAlert, product.reorderLevel);
        stockStatus.push({
          id: product.id,
          type: 'product',
          productId: product.id,
          productName: product.name,
          variantName: null,
          sku: product.slug,
          category: product.categories?.name || 'N/A',
          stock: product.stock,
          lowStockAlert: product.lowStockAlert,
          reorderLevel: product.reorderLevel,
          reorderQty: product.reorderQty,
          status: statusInfo.status,
          statusLabel: statusInfo.label,
          needsReorder: product.stock <= product.reorderLevel,
          price: product.basePrice,
          cost: product.averageCost || product.costPrice || 0,
        });

        if (product.stock === 0) outOfStock++;
        else if (product.stock <= product.lowStockAlert) lowStock++;
        else if (product.stock > product.lowStockAlert * 2) overstock++;
        else healthyStock++;
      }
    });

    // Filter by status if specified
    let filteredStatus = stockStatus;
    if (status === 'low') {
      filteredStatus = stockStatus.filter((item) => item.stock <= item.lowStockAlert);
    } else if (status === 'out') {
      filteredStatus = stockStatus.filter((item) => item.stock === 0);
    } else if (status === 'overstock') {
      filteredStatus = stockStatus.filter((item) => item.stock > item.lowStockAlert * 2);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalVariants,
          outOfStock,
          lowStock,
          healthy: healthyStock,
          overstock,
        },
        items: filteredStatus.map(s => ({
          id: s.id,
          name: s.type === 'variant' ? `${s.productName} - ${s.variantName}` : s.productName,
          category: s.category,
          stock: s.stock,
          reorderLevel: s.reorderLevel,
          status: s.statusLabel.toLowerCase().replace(' ', '_'),
        })),
      },
    });
  } catch (error) {
    console.error('Error generating stock report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate stock report' },
      { status: 500 }
    );
  }
}

function getStockStatus(stock: number, lowStockAlert: number, reorderLevel: number) {
  if (stock === 0) {
    return { status: 'OUT_OF_STOCK', label: 'Out of Stock' };
  } else if (stock <= reorderLevel) {
    return { status: 'REORDER_NEEDED', label: 'Reorder Needed' };
  } else if (stock <= lowStockAlert) {
    return { status: 'LOW_STOCK', label: 'Low Stock' };
  } else if (stock > lowStockAlert * 2) {
    return { status: 'OVERSTOCK', label: 'Overstock' };
  } else {
    return { status: 'HEALTHY', label: 'In Stock' };
  }
}
