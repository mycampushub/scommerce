import { NextRequest, NextResponse } from 'next/server';
import { queryAll, count } from '@/db/db';
import { getEnv } from '@/lib/cloudflare';

// This endpoint doesn't require auth for debugging purposes
export async function GET(request: NextRequest) {
  try {
    const env = await getEnv();
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      database: {
        status: 'unknown',
        tables: {},
      },
      auth: {
        status: 'not_required_for_debug',
      },
    };

    // Check database connection
    try {
      // Count products
      const productCount = await count(env, 'products', 'WHERE isActive = 1');
      debugInfo.database.tables.products = {
        count: productCount,
        active: productCount,
      };

      // Count variants
      const variantCount = await count(env, 'product_variants');
      debugInfo.database.tables.variants = {
        count: variantCount,
      };

      // Count categories
      const categoryCount = await count(env, 'categories');
      debugInfo.database.tables.categories = {
        count: categoryCount,
      };

      // Get sample product data
      const sampleProducts = await queryAll<any>(
        env,
        `SELECT id, name, slug, stock, basePrice, costPrice, hasVariants, categoryId
         FROM products
         WHERE isActive = 1
         LIMIT 5`
      );
      debugInfo.database.tables.products.sample = sampleProducts;

      // Get sample variant data
      const sampleVariants = await queryAll<any>(
        env,
        `SELECT id, productId, sku, name, stock, price, costPrice
         FROM product_variants
         LIMIT 5`
      );
      debugInfo.database.tables.variants.sample = sampleVariants;

      // Check for inventory movements
      const movementCount = await count(env, 'inventory_movements');
      debugInfo.database.tables.inventory_movements = {
        count: movementCount,
      };

      // Check for purchase orders
      const poCount = await count(env, 'purchase_orders');
      debugInfo.database.tables.purchase_orders = {
        count: poCount,
      };

      debugInfo.database.status = 'connected';

    } catch (dbError: any) {
      debugInfo.database.status = 'error';
      debugInfo.database.error = String(dbError);
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
