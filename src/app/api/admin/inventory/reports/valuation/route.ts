import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/db/db';
import { getEnv } from '@/lib/cloudflare';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/reports/valuation - Inventory valuation report
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdmin(request);
    if (admin instanceof NextResponse) {
      return admin;
    }

    // Get Cloudflare env for D1 database
    const env = await getEnv(request);

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const countryOfOrigin = searchParams.get('countryOfOrigin') || undefined;

    // Build WHERE conditions
    const whereConditions: string[] = ['p.isActive = 1'];
    const params: unknown[] = [];

    if (categoryId) {
      whereConditions.push('p.categoryId = ?');
      params.push(categoryId);
    }
    if (brandId) {
      whereConditions.push('p.brandId = ?');
      params.push(brandId);
    }
    if (countryOfOrigin) {
      whereConditions.push('p.countryOfOrigin = ?');
      params.push(countryOfOrigin);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Get all products with categories
    const products = await queryAll<any>(
      env,
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.stock,
        p.basePrice,
        p.costPrice,
        p.averageCost,
        p.hasVariants,
        p.brandName,
        p.countryOfOrigin,
        c.id as categoryId,
        c.name as categoryName
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      ${whereClause}`,
      ...params
    );

    // Get variants for all products
    const variantParams = products.length > 0 ? products.map(() => '?') : [];
    const variants = products.length > 0
      ? await queryAll<any>(
          env,
          `SELECT 
            v.id,
            v.productId,
            v.stock,
            v.price,
            v.costPrice,
            v.averageCost
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

    // Calculate valuation
    let totalProducts = 0;
    let totalStock = 0;
    let totalValue = 0;
    let totalCost = 0;
    let potentialProfit = 0;

    const productValuations = products.map((product) => {
      let productStock = 0;
      let productValue = 0;
      let productCost = 0;

      const productVariants = variantsByProduct[product.id] || [];

      // If product has variants, calculate variant values
      if (product.hasVariants === 1 && productVariants.length > 0) {
        productVariants.forEach((variant) => {
          productStock += variant.stock;
          productValue += variant.stock * variant.price;
          productCost += variant.stock * (variant.averageCost || variant.costPrice || 0);
        });
      } else {
        // Product without variants
        productStock = product.stock;
        productValue = product.stock * product.basePrice;
        productCost = product.stock * (product.averageCost || product.costPrice || 0);
      }

      const productProfit = productValue - productCost;

      totalProducts++;
      totalStock += productStock;
      totalValue += productValue;
      totalCost += productCost;
      potentialProfit += productProfit;

      return {
        id: product.id,
        name: product.name,
        sku: product.slug,
        category: product.categoryName || 'N/A',
        brand: product.brandName || 'N/A',
        stock: productStock,
        avgPrice: productStock > 0 ? productValue / productStock : 0,
        avgCost: productStock > 0 ? productCost / productStock : 0,
        totalValue: productValue,
        totalCost: productCost,
        potentialProfit: productProfit,
        margin: productCost > 0 ? ((productProfit / productCost) * 100).toFixed(2) + '%' : 'N/A',
      };
    });

    // Sort by total value descending
    productValuations.sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalStock,
          totalValue,
          totalCost,
          potentialProfit,
          averageMargin: totalCost > 0 ? ((potentialProfit / totalCost) * 100) : 0,
        },
        items: productValuations.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          stock: p.stock,
          price: p.avgPrice,
          cost: p.avgCost,
          value: p.totalValue,
          marginPercent: parseFloat(p.margin.replace('%', '') || '0'),
          margin: parseFloat(p.margin.replace('%', '') || '0'),
        })),
      },
    });
  } catch (error) {
    console.error('Error generating valuation report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate valuation report' },
      { status: 500 }
    );
  }
}
