import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { queryFirst } from '@/db/db'

export const runtime = 'edge';

/**
 * GET /api/products/[id]/variants
 * Get all variants for a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = getEnv(request)
  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await queryFirst(
      env,
      'SELECT id, hasVariants, basePrice, price FROM products WHERE id = ? LIMIT 1',
      id
    )

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch all variants for this product
    const variants = await ProductRepository.getVariants(env, id)

    return NextResponse.json({
      success: true,
      data: {
        hasVariants: product.hasVariants,
        basePrice: product.basePrice || product.price,
        variants: variants.map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          comparePrice: variant.comparePrice,
          stock: variant.stock,
          images: variant.images,
          size: variant.size,
          color: variant.color,
          material: variant.material,
          isDefault: variant.isDefault,
          isActive: variant.isActive,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching product variants:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product variants',
      },
      { status: 500 }
    )
  }
}
