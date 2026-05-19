import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/reports/valuation - Inventory valuation report
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
    const countryOfOrigin = searchParams.get('countryOfOrigin') || undefined;

    // Get all products with filters
    let where: any = {
      isActive: 1,
    };

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (countryOfOrigin) where.countryOfOrigin = countryOfOrigin;

    const products = await db.products.findMany({
      where,
      include: {
        categories: true,
        product_variants: true,
      },
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

      // If product has variants, calculate variant values
      if (product.hasVariants && product.product_variants.length > 0) {
        product.product_variants.forEach((variant) => {
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
        category: product.categories?.name || 'N/A',
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
