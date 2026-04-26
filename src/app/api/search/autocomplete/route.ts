import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/search/autocomplete - Get search suggestions
 * Query params:
 * - q: search query (required)
 * - limit: number of suggestions (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          products: [],
          categories: [],
        },
      })
    }

    // Search for products matching the query
    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        price: true,
        basePrice: true,
        comparePrice: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Search for categories matching the query
    const categories = await db.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      take: 5,
      orderBy: { name: 'asc' },
    })

    // Format products
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images ? JSON.parse(product.images)[0] : null,
      price: product.basePrice || product.price,
      comparePrice: product.comparePrice,
      category: product.category?.name || null,
      categorySlug: product.category?.slug || null,
      type: 'product',
    }))

    // Format categories
    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      type: 'category',
    }))

    // Combine and limit results
    const combinedResults = [
      ...formattedProducts.slice(0, limit - 5),
      ...formattedCategories.slice(0, 5),
    ].slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        categories: formattedCategories,
        combined: combinedResults,
      },
    })
  } catch (error) {
    console.error('Search autocomplete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
