import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    // Try to find by ID first
    let product = await db.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        category: true,
      },
    })

    // If not found by ID, try by slug
    if (!product) {
      product = await db.product.findUnique({
        where: {
          slug: productId,
        },
        include: {
          category: true,
        },
      })
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse images and attributes
    const images = JSON.parse(product.images || '[]')
    const attributes = JSON.parse(product.attributes || '{}')

    // Transform to match frontend format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      originalPrice: product.comparePrice || undefined,
      image: images[0] || product.category?.image || '',
      images: images,
      rating: 4.5, // Default rating - in production, calculate from reviews
      reviews: Math.floor(Math.random() * 500) + 10, // Random reviews - in production, use real count
      badge: product.comparePrice ? 'Sale' : product.isFeatured ? 'New' : undefined,
      category: product.category?.name,
      categorySlug: product.category?.slug,
      categoryId: product.categoryId,
      stock: product.stock,
      lowStockAlert: product.lowStockAlert,
      attributes: attributes,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
