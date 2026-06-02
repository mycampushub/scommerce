import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { queryFirst } from '@/db/db'

interface ProductRow {
  id: string
  hasVariants: number
  basePrice: number
  price: number
}

/**
 * GET /api/products/[id]/variants
 * Get all variants for a specific product (supports both ID and slug)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv()
  try {
    const { id } = await params

    // Try to find product by ID first
    let product = await queryFirst<ProductRow>(
      env,
      'SELECT id, hasVariants, basePrice, price FROM products WHERE id = ? LIMIT 1',
      id
    )

    // If not found by ID, try by slug
    if (!product) {
      product = await queryFirst<ProductRow>(
        env,
        'SELECT id, hasVariants, basePrice, price FROM products WHERE slug = ? LIMIT 1',
        id
      )
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch all variants for this product (using the actual product ID)
    const variants = await ProductRepository.getVariants(env, product.id)

    return NextResponse.json({
      success: true,
      data: {
        hasVariants: product.hasVariants,
        basePrice: product.basePrice || product.price,
        variants: variants.map((variant: any) => {
          return {
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            price: variant.price,
            comparePrice: variant.comparePrice,
            stock: variant.stock,
            images: variant.images,  // Already parsed by ProductRepository.getVariants()
            size: variant.size,
            color: variant.color,
            material: variant.material,
            isDefault: variant.isDefault,
            isActive: typeof variant.isActive === 'boolean' ? variant.isActive : Boolean(variant.isActive),
          };
        }),
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
