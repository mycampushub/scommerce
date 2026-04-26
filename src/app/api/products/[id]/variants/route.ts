import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/products/[id]/variants
 * Get all variants for a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await db.product.findUnique({
      where: { id },
      select: { id: true, hasVariants: true, basePrice: true, price: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch all variants for this product
    const variants = await db.productVariant.findMany({
      where: {
        productId: id,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { size: 'asc' },
        { color: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: {
        hasVariants: product.hasVariants,
        basePrice: product.basePrice || product.price,
        variants: variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          price: variant.price,
          comparePrice: variant.comparePrice,
          stock: variant.stock,
          images: variant.images ? JSON.parse(variant.images) : null,
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
