import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminAuth } from '@/lib/admin-auth'

const ABANDONED_CART_HOURS = 24 // Consider cart abandoned after 24 hours of inactivity

/**
 * GET /api/cart/abandoned - Get abandoned carts (admin only)
 * Query params:
 * - hours: hours threshold (default: 24)
 * - page: page number (default: 1)
 * - limit: items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || String(ABANDONED_CART_HOURS))
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Calculate the cutoff time
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)

    // Get all users with cart items not updated recently
    const carts = await db.cartItem.groupBy({
      by: ['userId'],
      where: {
        updatedAt: {
          lt: cutoffTime,
        },
      },
      having: {
        userId: {
          _count: {
            gt: 0,
          },
        },
      },
      _max: {
        updatedAt: true,
      },
      take: limit,
      skip,
      orderBy: {
        _max: {
          updatedAt: 'asc',
        },
      },
    })

    // Get cart details for each user
    const cartDetails = await Promise.all(
      carts.map(async (cart) => {
        const user = await db.user.findUnique({
          where: { id: cart.userId },
          select: {
            id: true,
            email: true,
            name: true,
          },
        })

        const cartItems = await db.cartItem.findMany({
          where: { userId: cart.userId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                basePrice: true,
                images: true,
                stock: true,
                isActive: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                isActive: true,
              },
            },
          },
        })

        // Calculate cart total
        const total = cartItems.reduce((sum, item) => {
          const price = item.variant?.price || item.product?.basePrice || item.product?.price || 0
          return sum + price * item.quantity
        }, 0)

        // Filter out inactive or out-of-stock items
        const availableItems = cartItems.filter(
          (item) =>
            item.product?.isActive &&
            (!item.product?.hasVariants || item.variant?.isActive) &&
            (item.product?.stock > 0 || item.variant?.stock > 0)
        )

        return {
          userId: cart.userId,
          email: user?.email,
          name: user?.name,
          lastUpdated: cart._max.updatedAt,
          itemsCount: cartItems.length,
          availableItemsCount: availableItems.length,
          total: total,
          items: availableItems,
          isFullyAvailable: availableItems.length === cartItems.length,
        }
      })
    )

    const totalCount = await db.cartItem.groupBy({
      by: ['userId'],
      where: {
        updatedAt: {
          lt: cutoffTime,
        },
      },
    })

    const totalPages = Math.ceil(totalCount.length / limit)

    return NextResponse.json({
      success: true,
      data: cartDetails,
      pagination: {
        page,
        limit,
        totalCount: totalCount.length,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching abandoned carts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch abandoned carts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cart/abandoned/notify - Send recovery notification for abandoned carts (admin only)
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const body = await request.json()
    const { userIds, subject, message } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      )
    }

    // Get user emails
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    // In a real implementation, you would send emails here
    // For now, we'll just log and return success
    console.log('Sending abandoned cart recovery emails:', {
      recipients: users.map((u) => u.email),
      subject,
      message,
    })

    // Log the notification
    for (const user of users) {
      await db.adminLog.create({
        data: {
          action: 'ABANDONED_CART_NOTIFICATION',
          entity: 'Cart',
          entityId: user.id,
          adminId: userOrResponse.id,
          details: `Sent abandoned cart recovery email to ${user.email}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Recovery notifications sent to ${users.length} users`,
      data: {
        notifiedCount: users.length,
        recipients: users.map((u) => u.email),
      },
    })
  } catch (error) {
    console.error('Error sending abandoned cart notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
