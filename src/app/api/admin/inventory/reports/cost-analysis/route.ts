import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth/admin-auth';

// GET /api/admin/inventory/reports/cost-analysis - Cost analysis report
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
    const sortBy = searchParams.get('sortBy') || 'margin'; // margin, profit, cost, revenue

    // Get all products with filters
    let where: any = {
      isActive: 1,
    };

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;

    const products = await db.products.findMany({
      where,
      include: {
        categories: true,
        product_variants: true,
      },
    });

    const costAnalysis: any[] = [];

    products.forEach((product) => {
      if (product.hasVariants && product.product_variants.length > 0) {
        // Product with variants
        product.product_variants.forEach((variant) => {
          const cost = variant.averageCost || variant.costPrice || 0;
          const revenue = variant.stock * variant.price;
          const totalCost = variant.stock * cost;
          const profit = revenue - totalCost;
          const margin = cost > 0 ? (profit / totalCost) * 100 : 0;

          costAnalysis.push({
            id: variant.id,
            type: 'variant',
            productId: product.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            category: product.categories?.name || 'N/A',
            brand: product.brandName || 'N/A',
            stock: variant.stock,
            unitCost: cost,
            unitPrice: variant.price,
            totalCost,
            totalRevenue: revenue,
            profit,
            margin: parseFloat(margin.toFixed(2)),
            sold: variant.totalSold,
            purchased: variant.totalPurchased,
          });
        });
      } else {
        // Product without variants
        const cost = product.averageCost || product.costPrice || 0;
        const revenue = product.stock * product.basePrice;
        const totalCost = product.stock * cost;
        const profit = revenue - totalCost;
        const margin = cost > 0 ? (profit / totalCost) * 100 : 0;

        costAnalysis.push({
          id: product.id,
          type: 'product',
          productId: product.id,
          productName: product.name,
          variantName: null,
          sku: product.slug,
          category: product.categories?.name || 'N/A',
          brand: product.brandName || 'N/A',
          stock: product.stock,
          unitCost: cost,
          unitPrice: product.basePrice,
          totalCost,
          totalRevenue: revenue,
          profit,
          margin: parseFloat(margin.toFixed(2)),
          sold: product.totalSold,
          purchased: product.totalPurchased,
        });
      }
    });

    // Sort by specified field
    if (sortBy === 'margin') {
      costAnalysis.sort((a, b) => b.margin - a.margin);
    } else if (sortBy === 'profit') {
      costAnalysis.sort((a, b) => b.profit - a.profit);
    } else if (sortBy === 'cost') {
      costAnalysis.sort((a, b) => b.totalCost - a.totalCost);
    } else if (sortBy === 'revenue') {
      costAnalysis.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    // Calculate totals
    const totalStock = costAnalysis.reduce((sum, item) => sum + item.stock, 0);
    const totalCost = costAnalysis.reduce((sum, item) => sum + item.totalCost, 0);
    const totalRevenue = costAnalysis.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalProfit = costAnalysis.reduce((sum, item) => sum + item.profit, 0);
    const avgMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const totalSold = costAnalysis.reduce((sum, item) => sum + item.sold, 0);
    const totalPurchased = costAnalysis.reduce((sum, item) => sum + item.purchased, 0);

    // Get top and bottom performers
    const topMargin = costAnalysis.slice(0, 10);
    const bottomMargin = costAnalysis.slice(-10).reverse();
    const topProfit = [...costAnalysis].sort((a, b) => b.profit - a.profit).slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalStock,
          totalCost,
          totalRevenue,
          totalProfit,
        },
        items: costAnalysis.map(item => ({
          id: item.id,
          name: item.variantName ? `${item.productName} - ${item.variantName}` : item.productName,
          category: item.category,
          stock: item.stock,
          cost: item.totalCost,
          totalCost: item.totalCost,
          totalSold: item.sold,
          totalRevenue: item.totalRevenue,
          totalProfit: item.profit,
          margin: item.margin,
        })),
      },
    });
  } catch (error) {
    console.error('Error generating cost analysis report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate cost analysis report' },
      { status: 500 }
    );
  }
}
