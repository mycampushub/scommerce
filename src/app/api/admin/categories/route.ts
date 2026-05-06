import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'
import { categorySchema } from '@/lib/validations'
import { queryAll, count, numberToBool } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'orderNum'
    const sortOrder = searchParams.get('sortOrder') || 'ASC'

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'name', 'slug', 'orderNum']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'orderNum'
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Build WHERE clause for filters
    const conditions: string[] = []
    const params: unknown[] = []

    // Apply search to SQL WHERE clause
    if (search) {
      conditions.push('(name LIKE ? OR slug LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Fetch categories with pagination and sorting
    const categories = await queryAll<any>(
      env,
      `SELECT * FROM categories ${whereClause} ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    // Add product counts - Fix N+1 query by using a single GROUP BY query
    const categoriesWithCounts: any[] = []

    // Get product counts for all categories in a single query
    const categoryIds = categories.map(c => c.id)
    let productCountsMap = new Map<string, number>()

    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',')
      const counts = await queryAll<{ categoryId: string, count: number }>(
        env,
        `SELECT categoryId, COUNT(*) as count FROM products WHERE categoryId IN (${placeholders}) GROUP BY categoryId`,
        ...categoryIds
      )
      counts.forEach(c => productCountsMap.set(c.categoryId, c.count))
    }

    // Attach counts to categories
    for (const category of categories) {
      categoriesWithCounts.push({
        ...category,
        _count: { products: productCountsMap.get(category.id) || 0 },
        isActive: numberToBool(category.isActive as number)
      })
    }

    // Get total count for pagination
    const totalCategories = await count(
      env,
      `SELECT COUNT(*) FROM categories ${whereClause}`,
      ...params
    )

    const totalPages = Math.ceil(totalCategories / limit)

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
      pagination: {
        page,
        limit,
        total: totalCategories,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      sort: {
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const body = await request.json() as any

    // Validate with Zod
    const validation = categorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    const category = await CategoryRepository.create(env, {
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      image: validatedData.image,
      isActive: validatedData.isActive ?? true,
    })

    return NextResponse.json({
      success: true,
      data: { ...category, isActive: numberToBool(category.isActive as number) },
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
