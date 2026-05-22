import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, queryAll } from '@/db/db'

/**
 * Debug endpoint to check product and variants status
 * GET /api/admin/debug/product-variants?productId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'productId parameter is required'
      }, { status: 400 })
    }

    // Get product details
    const product = await queryFirst<any>(
      env,
      'SELECT id, name, hasVariants, basePrice, price FROM products WHERE id = ?',
      productId
    )

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 })
    }

    // Get all variants for this product
    const variants = await queryAll<any>(
      env,
      'SELECT id, sku, name, price, size, color, material, isActive, isDefault, stock FROM product_variants WHERE productId = ?',
      productId
    )

    // Count active variants
    const activeVariants = variants.filter(v => v.isActive === 1 || v.isActive === true)

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          hasVariants: product.hasVariants,
          hasVariantsType: typeof product.hasVariants,
          hasVariantsBoolean: product.hasVariants === 1 || product.hasVariants === true,
        },
        variants: {
          total: variants.length,
          active: activeVariants.length,
          inactive: variants.length - activeVariants.length,
          list: variants.map(v => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            size: v.size,
            color: v.color,
            material: v.material,
            isActive: v.isActive,
            isDefault: v.isDefault,
            stock: v.stock,
          }))
        },
        issues: [
          product.hasVariants === 0 && activeVariants.length > 0 ? 'hasVariants flag is 0 but there are active variants in database' : null,
          product.hasVariants === 1 && activeVariants.length === 0 ? 'hasVariants flag is 1 but no active variants found in database' : null,
        ].filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch debug information',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
