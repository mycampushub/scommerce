import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'
import { categorySchema } from '@/lib/validations'
import { queryAll, count, numberToBool } from '@/db/db'
import { logAdminAction } from '@/lib/audit-logger'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/rate-limit'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const tree = searchParams.get('tree') === 'true'

    // Return tree structure if requested
    if (tree) {
      const categoryTree = await CategoryRepository.getTree(env)

      return NextResponse.json({
        success: true,
        data: categoryTree,
      })
    }

    let categories = await CategoryRepository.findAll(env)

    if (search) {
      categories = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(search.toLowerCase()) ||
          category.slug.toLowerCase().includes(search.toLowerCase())
      )
    }

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

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
      total: categoriesWithCounts.length,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
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

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  // Rate limiting: 30 categories per minute per admin
  const env = await getEnv()
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-category-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
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

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'Category',
      category.id,
      `Created category "${validatedData.name}" (ID: ${category.id})`
    )

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
      },
      { status: 500 }
    )
  }
}
