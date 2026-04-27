import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, count, boolToNumber, numberToBool, parseJSON } from '@/db/db'

export const runtime = 'edge';

// GET /api/admin/reviews - List all reviews with filtering
export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const productId = searchParams.get('productId')

    const offset = (page - 1) * limit

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const params: any[] = []

    if (status && status !== 'all') {
      if (status === 'pending') {
        conditions.push('pr.isApproved = 0')
      } else if (status === 'approved') {
        conditions.push('pr.isApproved = 1')
      }
    }

    if (productId) {
      conditions.push('pr.productId = ?')
      params.push(productId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const total = await count(
      env,
      'product_reviews pr',
      whereClause,
      ...params
    )

    // Get reviews with user and product data
    const reviews = await queryAll<any>(
      env,
      `SELECT pr.*, u.id as userId, u.name as userName, u.email as userEmail,
              p.id as productId, p.name as productName, p.slug as productSlug, p.images as productImages
       FROM product_reviews pr
       JOIN users u ON pr.userId = u.id
       JOIN products p ON pr.productId = p.id
       ${whereClause}
       ORDER BY pr.createdAt DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    // Parse JSON fields and convert booleans
    const reviewsWithParsedData = reviews.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      productId: r.productId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isApproved: typeof r.isApproved === 'boolean' ? r.isApproved : numberToBool(r.isApproved),
      isVerified: typeof r.isVerified === 'boolean' ? r.isVerified : numberToBool(r.isVerified),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
      },
      product: {
        id: r.productId,
        name: r.productName,
        slug: r.productSlug,
        images: parseJSON<string[]>(r.productImages) || [],
      },
    }))

    return NextResponse.json({
      success: true,
      data: reviewsWithParsedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
