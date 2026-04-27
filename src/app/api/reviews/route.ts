import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth-utils'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, numberToBool, generateId, now } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'
import { sanitizeHTML, sanitizeForDB } from '@/lib/sanitize'

export const runtime = 'edge';

// GET /api/reviews?productId={id} - Get reviews for a product
export async function GET(request: NextRequest) {
  // Get D1 database from request context
  const env = getEnv(request)

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const reviews = await queryAll(
      env,
      `SELECT pr.*, u.id as userId, u.name as userName, u.email as userEmail
       FROM product_reviews pr
       LEFT JOIN users u ON pr.userId = u.id
       WHERE pr.productId = ? AND pr.isApproved = 1
       ORDER BY pr.createdAt DESC`,
      productId
    )

    // Transform reviews to convert boolean fields
    const transformedReviews = reviews.map((review: any) => ({
      ...review,
      isApproved: numberToBool(review.isApproved),
      isVerified: numberToBool(review.isVerified),
      user: {
        id: review.userId,
        name: review.userName,
        email: review.userEmail,
      },
    }))

    return NextResponse.json({ success: true, data: transformedReviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Submit new review
export async function POST(request: NextRequest) {
  // Get D1 database from request context
  const env = getEnv(request)

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const body = await request.json()
    const { productId, rating, title, comment } = body

    // Sanitize input
    const sanitizedTitle = sanitizeForDB(title)
    const sanitizedComment = sanitizeHTML(comment)

    // Validate required fields
    if (!productId || !rating || !sanitizedTitle || !sanitizedComment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = authResult.user.id

    // Check if product exists
    const product = await queryFirst(
      env,
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      productId
    )

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user has already reviewed this product
    const existingReview = await queryFirst(
      env,
      'SELECT * FROM product_reviews WHERE userId = ? AND productId = ? LIMIT 1',
      userId,
      productId
    )

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check if user has purchased this product (verified purchase)
    const isVerifiedPurchase = await queryFirst(
      env,
      `SELECT oi.*
       FROM order_items oi
       INNER JOIN orders o ON oi.orderId = o.id
       WHERE oi.productId = ? AND o.userId = ? AND o.status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
       LIMIT 1`,
      productId,
      userId
    )

    // Create review
    const id = generateId()
    const currentTime = now()
    const userName = authResult.user.name || authResult.user.email.split('@')[0]

    await execute(
      env,
      `INSERT INTO product_reviews (id, productId, userId, userName, rating, title, comment, isVerified, isApproved, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      productId,
      userId,
      userName,
      rating,
      sanitizedTitle,
      sanitizedComment,
      isVerifiedPurchase ? 1 : 0,
      0, // Requires admin approval
      currentTime,
      currentTime
    )

    // Fetch the created review with user details
    const review = await queryFirst(
      env,
      `SELECT pr.*, u.id as userId, u.name as userName, u.email as userEmail
       FROM product_reviews pr
       LEFT JOIN users u ON pr.userId = u.id
       WHERE pr.id = ? LIMIT 1`,
      id
    )

    const transformedReview = review ? {
      ...review,
      isApproved: numberToBool(review.isApproved),
      isVerified: numberToBool(review.isVerified),
      user: {
        id: review.userId,
        name: review.userName,
        email: review.userEmail,
      },
    } : null

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin approval.',
      data: transformedReview,
    })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
