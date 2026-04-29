import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, queryAll, execute, boolToNumber, numberToBool, parseJSON } from '@/db/db'

export const runtime = 'edge';

// PUT /api/admin/reviews/[id] - Approve/Reject review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
    const body = await request.json()
    const { action } = body // approve or reject

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const reviewId = id

    // Check if review exists
    const review = await queryFirst<any>(
      env,
      'SELECT pr.*, u.id as userId, u.name as userName, u.email as userEmail, p.id as productId, p.name as productName, p.slug as productSlug FROM product_reviews pr JOIN users u ON pr.userId = u.id JOIN products p ON pr.productId = p.id WHERE pr.id = ? LIMIT 1',
      reviewId
    )

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update review
    await execute(
      env,
      'UPDATE product_reviews SET isApproved = ?, updatedAt = datetime("now") WHERE id = ?',
      boolToNumber(action === 'approve'),
      reviewId
    )

    // Fetch updated review
    const updatedReview = await queryFirst<any>(
      env,
      'SELECT pr.*, u.id as userId, u.name as userName, u.email as userEmail, p.id as productId, p.name as productName, p.slug as productSlug, p.images as productImages FROM product_reviews pr JOIN users u ON pr.userId = u.id JOIN products p ON pr.productId = p.id WHERE pr.id = ? LIMIT 1',
      reviewId
    )

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Review approved' : 'Review rejected',
      data: {
        id: updatedReview.id,
        userId: updatedReview.userId,
        productId: updatedReview.productId,
        rating: updatedReview.rating,
        title: updatedReview.title,
        comment: updatedReview.comment,
        isApproved: typeof updatedReview.isApproved === 'boolean' ? updatedReview.isApproved : numberToBool(updatedReview.isApproved),
        isVerified: typeof updatedReview.isVerified === 'boolean' ? updatedReview.isVerified : numberToBool(updatedReview.isVerified),
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
        user: {
          id: updatedReview.userId,
          name: updatedReview.userName,
          email: updatedReview.userEmail,
        },
        product: {
          id: updatedReview.productId,
          name: updatedReview.productName,
          slug: updatedReview.productSlug,
          images: parseJSON<string[]>(updatedReview.productImages) || [],
        },
      },
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/reviews/[id] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
    const reviewId = id

    // Check if review exists
    const review = await queryFirst<any>(
      env,
      'SELECT * FROM product_reviews WHERE id = ? LIMIT 1',
      reviewId
    )

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Delete review
    await execute(env, 'DELETE FROM product_reviews WHERE id = ?', reviewId)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
