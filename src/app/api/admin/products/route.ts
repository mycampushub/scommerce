import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { productSchema } from '@/lib/validations'
import {
  queryAll,
  count,
  boolToNumber,
  numberToBool,
  generateId,
  now,
  parseJSON,
  stringifyJSON
} from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'
import { generateUniqueSlug, isValidSlug } from '@/lib/slug'

export async function GET(request: NextRequest) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    
    // Validate environment
    if (!env || !env.DB) {
      console.error('[products API] Database not available:', env)
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection error. Please try again later.',
        },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const categorySlug = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Validate parameters
    if (page < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Page number must be greater than 0'
        },
        { status: 400 }
      )
    }

    if (limit < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be at least 1'
        },
        { status: 400 }
      )

    if (limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit cannot exceed 100'
        },
        { status: 400 }
      )
    }

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const params: any[] = []

    // Search filter (both name and slug)
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      // Use LIKE operator for both name and slug
      conditions.push('(p.name LIKE ? OR p.slug LIKE ?)')
      params.push(`%${searchTerm}%`, `%${searchTerm}%`)
    }

    // Category filter
    if (categorySlug && categorySlug !== 'all') {
      try {
        const category = await CategoryRepository.findBySlug(env, categorySlug)
        if (category) {
          conditions.push('p.categoryId = ?')
          params.push(category!.id)
        }
      } catch (error) {
        console.error('[products API] Error fetching category:', error)
      }
    }

    // Status filter
    if (status === 'active') {
      conditions.push('p.isActive = 1')
    } else if (status === 'inactive') {
      conditions.push('p.isActive = 0')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    console.log('[products API] Fetching products with params:', { search, categorySlug, status, page, limit, offset })

    // Get products with category
    const products = await queryAll<any>(
      env,
      `SELECT p.*, c.name as categoryName, c.slug as categorySlug
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       ${whereClause}
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    if (!products || products.length === 0) {
      console.warn('[products API] No products found')
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        totalCount: 0,
        pagination: {
          page,
          limit,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
      })
    }

    console.log('[products API] Fetched products count:', products?.length || 0)

    // Parse images JSON field safely
    const productsWithImages = products.map((p: any) => ({
      ...p,
      images: parseJSON<string[]>(p.images) || [],
      isActive: numberToBool(p.isActive),
      isFeatured: numberToBool(p.isFeatured),
      hasVariants: numberToBool(p.hasVariants),
      _count: {
        orderItems: (p.orderItems as any)?.count || 0
      }
    }))

    console.log('[products API] Products with images parsed:', productsWithImages.length)

    // Get total count for pagination
    let totalCount = 0
    try {
      totalCount = await count(
        env,
        'products p LEFT JOIN categories c ON p.categoryId = c.id',
        whereClause,
        ...params
      )
    } catch (error) {
      console.error('[products API] Count query failed:', error)
      totalCount = products.length
    }

    const totalPages = Math.ceil(totalCount / limit)

    console.log('[products API] Total count:', totalCount, 'Total pages:', totalPages)

    return NextResponse.json({
      success: true,
      data: productsWithImages,
      total: productsWithImages.length,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  }
  } catch (error) {
    console.error('[products API] Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
