import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll } from '@/db/db'
import { parseJSON } from '@/db/db'
import { addCacheHeaders, CachePresets } from '@/lib/http-cache'


/**
 * GET /api/search/autocomplete - Get search suggestions
 * Query params:
 * - q: search query (required)
 * - limit: number of suggestions (default: 10)
 */

export async function GET(request: NextRequest) {
  const env = getEnv(request)
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (query.length < 2) {
      const response = NextResponse.json({
        success: true,
        data: {
          products: [],
          categories: [],
        },
      })

      // Add caching headers for empty autocomplete results (short cache)
      return addCacheHeaders(response, CachePresets.SHORT);
    }

    // Search for products matching query
    const products = await queryAll(
      env,
      `SELECT p.id, p.name, p.slug, p.images, p.price, p.basePrice, p.comparePrice, c.name as categoryName, c.slug as categorySlug
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.isActive = 1 AND (p.name LIKE ? OR p.description LIKE ?)
       ORDER BY p.createdAt DESC
       LIMIT ?`,
      `%${query}%`,
      `%${query}%`,
      limit
    )

    // Search for categories matching query
    const categories = await queryAll(
      env,
      `SELECT id, name, slug, image
       FROM categories
       WHERE isActive = 1 AND (name LIKE ? OR description LIKE ?)
       ORDER BY name ASC
       LIMIT 5`,
      `%${query}%`,
      `%${query}%`
    )

    // Format products
    const formattedProducts = products.map((product: any) => {
      const parsedImages = parseJSON<string[]>(product.images)
      const images = parsedImages || []
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: images[0] || null,
        price: product.basePrice || product.price,
        comparePrice: product.comparePrice,
        category: product.categoryName || null,
        categorySlug: product.categorySlug || null,
        type: 'product',
      }
    })

    // Format categories
    const formattedCategories = categories.map((category: any) => ({
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

    const response = NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        categories: formattedCategories,
        combined: combinedResults,
      },
    })

    // Add caching headers for search autocomplete (short cache - 1 minute)
    return addCacheHeaders(response, CachePresets.SHORT);
  } catch (error) {
    console.error('Search autocomplete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
