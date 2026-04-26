import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'

// GET /api/admin/reviews - List all reviews with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.error === 'Authentication required' ? 401 : 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const productId = searchParams.get('productId')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      if (status === 'pending') {
        where.isApproved = false
      } else if (status === 'approved') {
        where.isApproved = true
      }
      // Note: We don't have a rejected status field, so we'll just show pending/approved
    }
    
    if (productId) {
      where.productId = productId
    }

    // Get total count
    const total = await db.productReview.count({ where })

    // Get reviews
    const reviews = await db.productReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: reviews,
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
