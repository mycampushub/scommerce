import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'
import { getEnv } from '@/lib/cloudflare'
import { queryAll } from '@/db/db'
import { parseJSON } from '@/db/db'
import { addCacheHeaders, CachePresets } from '@/lib/http-cache'
import { Product, Category } from '@/types/common'


/**
 * GET /api/search/autocomplete - Get search suggestions
 * Query params:
 * - q: search query (required)
 * - limit: number of suggestions (default: 10)
 */

export async function GET(request: NextRequest) {
  const env = await getEnv()
  try {
    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Sanitize and escape the query to prevent LIKE wildcard abuse
    const query = rawQuery.replace(/[%_\\]/g, '\\$&').trim()

    if (query.length < 2) {
      const response = successResponse({
        products: [],
        categories: [],
      })

      // Add caching headers for empty autocomplete results (short cache)
      return addCacheHeaders(response, CachePresets.SHORT);
    }

    // Search for products matching query
    const products = await queryAll<{
      id: string
      name: string
      slug: string
      images: string
      price?: number
      basePrice: number
      comparePrice: number | null
      categoryName: string | null
      categorySlug: string | null
    }>(
      env,
      `SELECT p.id, p.name, p.slug, p.images, p.price, p.basePrice, p.comparePrice, c.name as categoryName, c.slug as categorySlug
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.isActive = 1 AND (p.name LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')
       ORDER BY p.createdAt DESC
       LIMIT ?`,
      `%${query}%`,
      `%${query}%`,
      limit
    )

    // Search for categories matching query
    const categories = await queryAll<{
      id: string
      name: string
      slug: string
      image: string | null
    }>(
      env,
      `SELECT id, name, slug, image
       FROM categories
       WHERE isActive = 1 AND (name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')
       ORDER BY name ASC
       LIMIT 5`,
      `%${query}%`,
      `%${query}%`
    )

    // Format products
    const formattedProducts = products.map((product) => {
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

    const response = successResponse({
      products: formattedProducts,
      categories: formattedCategories,
      combined: combinedResults,
    }, 'Search results retrieved successfully')

    // Add caching headers for search autocomplete (short cache - 1 minute)
    return addCacheHeaders(response, CachePresets.SHORT);
  } catch (error) {
    console.error('Search autocomplete error:', error)
    return errorResponse('Failed to fetch suggestions', 500)
  }
}
