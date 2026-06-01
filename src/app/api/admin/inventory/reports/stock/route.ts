import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryFirst } from '@/db/db';
import { getEnv } from '@/lib/cloudflare';
import { verifyAdmin } from '@/lib/admin-auth';

// GET /api/admin/inventory/reports/stock - Stock status report with pagination
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    // Get Cloudflare env for D1 database
    const env = await getEnv();

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const status = searchParams.get('status') || 'all'; // all, low, out, overstock

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const whereConditions: string[] = [];
    const params: unknown[] = [];

    if (categoryId) {
      whereConditions.push('p.categoryId = ?');
      params.push(categoryId);
    }
    if (brandId) {
      whereConditions.push('p.brandId = ?');
      params.push(brandId);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count of products for pagination
    const countResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM products p ${whereClause}`,
      ...params
    );
    const totalProducts = countResult?.count || 0;

    // Get products with pagination
    const products = await queryAll<any>(
      env,
      `SELECT
        p.id,
        p.name,
        p.slug,
        p.stock,
        p.lowStockAlert,
        p.reorderLevel,
        p.reorderQty,
        p.basePrice,
        p.costPrice,
        p.averageCost,
        p.hasVariants,
        p.brandName,
        c.id as categoryId,
        c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      ${whereClause}
      LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    // Get variants for all products
    const variantParams = products.length > 0 ? products.map(() => '?') : [];
    const variants = products.length > 0
      ? await queryAll<any>(
          env,
          `SELECT
            v.id,
            v.productId,
            v.sku,
            v.name,
            v.stock,
            v.lowStockAlert,
            v.reorderLevel,
            v.reorderQty,
            v.price,
            v.costPrice,
            v.averageCost,
            v.totalSold,
            v.totalPurchased
          FROM product_variants v
          WHERE v.productId IN (${variantParams.join(',')})`,
          ...products.map(p => p.id)
        )
      : [];

    // Group variants by product
    const variantsByProduct: Record<string, any[]> = {};
    variants.forEach((variant) => {
      if (!variantsByProduct[variant.productId]) {
        variantsByProduct[variant.productId] = [];
      }
      variantsByProduct[variant.productId].push(variant);
    });

    const stockStatus: any[] = [];
    let totalVariants = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let healthyStock = 0;
    let overstock = 0;

    products.forEach((product) => {
      const productVariants = variantsByProduct[product.id] || [];

      if (product.hasVariants === 1 && productVariants.length > 0) {
        // Product with variants
        productVariants.forEach((variant) => {
          totalVariants++;
          const statusInfo = getStockStatus(variant.stock, variant.lowStockAlert, variant.reorderLevel);
          stockStatus.push({
            id: variant.id,
            type: 'variant',
            productId: product.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            category: product.categoryName || 'N/A',
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
        const statusInfo = getStockStatus(product.stock, product.lowStockAlert, product.reorderLevel);
        stockStatus.push({
          id: product.id,
          type: 'product',
          productId: product.id,
          productName: product.name,
          variantName: null,
          sku: product.slug,
          category: product.categoryName || 'N/A',
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

    // Apply pagination to filtered results
    const paginatedItems = filteredStatus.slice(offset, offset + limit);
    const totalCount = filteredStatus.length;
    const totalPages = Math.ceil(totalCount / limit);

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
        items: paginatedItems.map(s => ({
          id: s.id,
          name: s.type === 'variant' ? `${s.productName} - ${s.variantName}` : s.productName,
          category: s.category,
          stock: s.stock,
          reorderLevel: s.reorderLevel,
          status: s.statusLabel.toLowerCase().replace(' ', '_'),
        })),
      },
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
