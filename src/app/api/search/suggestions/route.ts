import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib/api-response'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, parseJSON } from '@/db/db'
import { addCacheHeaders, CachePresets } from '@/lib/http-cache'
import { rateLimitMiddleware } from '@/lib/rate-limit'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'because', 'as', 'until', 'while', 'that', 'this',
  'these', 'those', 'has', 'have', 'had', 'do', 'does', 'did', 'will',
  'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'new', 'men', 'women', 'girls', 'boys', 'kids', 'set', 'combo',
])

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
}

interface BrandRow {
  name: string
}

interface ProductNameRow {
  name: string
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request, 'public')
  if (rateLimitResponse) return rateLimitResponse

  const env = await getEnv()

  try {
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 50)

    const tagMap = new Map<string, number>()

    // 1. Extract tags from products
    const tagRows = await queryAll<{ tags: string | null }>(
      env,
      "SELECT tags FROM products WHERE isActive = 1 AND tags IS NOT NULL AND tags != ''"
    )

    for (const row of tagRows) {
      const parsed = parseJSON<string[]>(row.tags)
      if (parsed && Array.isArray(parsed)) {
        for (const tag of parsed) {
          const normalized = tag.trim()
          if (normalized) {
            tagMap.set(normalized, (tagMap.get(normalized) || 0) + 1)
          }
        }
      }
    }

    // 2. Add category names as suggestions
    const categories = await queryAll<CategoryRow>(
      env,
      'SELECT id, name, slug, description, image FROM categories WHERE isActive = 1 ORDER BY sortOrder ASC, name ASC'
    )

    for (const cat of categories) {
      const normalized = cat.name.trim()
      if (normalized) {
        tagMap.set(normalized, (tagMap.get(normalized) || 0) + 3)
      }
    }

    // 3. Add brand names as suggestions
    const brands = await queryAll<BrandRow>(
      env,
      'SELECT name FROM brands WHERE isActive = 1 ORDER BY name ASC'
    )

    for (const brand of brands) {
      const normalized = brand.name.trim()
      if (normalized) {
        tagMap.set(normalized, (tagMap.get(normalized) || 0) + 2)
      }
    }

    // 4. If still few suggestions, extract keywords from product names
    if (tagMap.size < 10) {
      const products = await queryAll<ProductNameRow>(
        env,
        'SELECT name FROM products WHERE isActive = 1 ORDER BY createdAt DESC LIMIT 100'
      )

      const wordPairs = new Map<string, number>()
      for (const p of products) {
        const words = p.name.split(/[\s\-–—/]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
        for (let i = 0; i < words.length - 1; i++) {
          const pair = `${words[i]} ${words[i + 1]}`
          wordPairs.set(pair, (wordPairs.get(pair) || 0) + 1)
        }
      }

      const sortedPairs = [...wordPairs.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)

      for (const [pair] of sortedPairs) {
        if (!tagMap.has(pair)) {
          tagMap.set(pair, 1)
        }
      }
    }

    // Sort by frequency descending and take top N
    const popularSearches = [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag)

    // Format categories for the frontend
    const formattedCategories = categories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image || '',
    }))

    const response = successResponse({
      popularSearches,
      categories: formattedCategories,
    })

    return addCacheHeaders(response, CachePresets.SEMI_STATIC)
  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return errorResponse('Failed to fetch suggestions', 500)
  }
}
