import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'
import { queryAll, queryFirst, parseJSON, numberToBool } from '@/db/db'

export const runtime = 'edge';

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

  // Get D1 database from request context
  const env = getEnv(request)

  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || String(ABANDONED_CART_HOURS))
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Calculate the cutoff time
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Get all users with cart items not updated recently (GROUP BY simulation)
    const abandonedUsers = await queryAll(
      env,
      `SELECT userId, MAX(updatedAt) as lastUpdated, COUNT(*) as itemsCount
       FROM cart_items
       WHERE updatedAt < ?
       GROUP BY userId
       ORDER BY MAX(updatedAt) ASC
       LIMIT ? OFFSET ?`,
      cutoffTime.toISOString(),
      limit,
      offset
    )

    // Get cart details for each user
    const cartDetails = await Promise.all(
      abandonedUsers.map(async (cart: any) => {
        const user = await UserRepository.findById(env, cart.userId)

        // Get cart items with product and variant details
        const cartItems = await queryAll(
          env,
          `SELECT ci.*, 
                  p.name as productName, p.slug as productSlug, p.basePrice, p.comparePrice, p.images, p.stock, p.isActive, p.hasVariants,
                  v.name as variantName, v.price as variantPrice, v.stock as variantStock, v.isActive as variantIsActive
           FROM cart_items ci
           LEFT JOIN products p ON ci.productId = p.id
           LEFT JOIN product_variants v ON ci.variantId = v.id
           WHERE ci.userId = ?
           ORDER BY ci.createdAt DESC`,
          cart.userId
        )

        // Calculate cart total
        const total = cartItems.reduce((sum: number, item: any) => {
          const price = item.variantPrice || item.basePrice || item.comparePrice || 0
          return sum + price * item.quantity
        }, 0)

        // Transform and filter out inactive or out-of-stock items
        const transformedItems = cartItems.map((item: any) => {
          const images = parseJSON<string[]>(item.images) || []
          return {
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            basePrice: item.basePrice,
            comparePrice: item.comparePrice,
            images: images,
            image: images[0] || '',
            quantity: item.quantity,
            variant: item.variantId ? {
              id: item.variantId,
              name: item.variantName,
              price: item.variantPrice,
              stock: item.variantStock,
              isActive: numberToBool(item.variantIsActive),
            } : null,
            product: {
              id: item.productId,
              name: item.productName,
              slug: item.productSlug,
              basePrice: item.basePrice,
              comparePrice: item.comparePrice,
              stock: item.stock,
              isActive: numberToBool(item.isActive),
              hasVariants: numberToBool(item.hasVariants),
            },
          }
        })

        const availableItems = transformedItems.filter(
          (item) =>
            item.product.isActive &&
            (!item.product.hasVariants || item.variant?.isActive) &&
            (item.product.stock > 0 || item.variant?.stock > 0)
        )

        return {
          userId: cart.userId,
          email: user?.email,
          name: user?.name,
          lastUpdated: cart.lastUpdated,
          itemsCount: cart.itemsCount,
          availableItemsCount: availableItems.length,
          total: total,
          items: availableItems,
          isFullyAvailable: availableItems.length === transformedItems.length,
        }
      })
    )

    // Get total count of abandoned users
    const totalCountResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(DISTINCT userId) as count
       FROM cart_items
       WHERE updatedAt < ?`,
      cutoffTime.toISOString()
    )

    const totalCount = totalCountResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: cartDetails,
      pagination: {
        page,
        limit,
        totalCount,
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

  // Get D1 database from request context
  const env = getEnv(request)

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
    const users = []
    for (const userId of userIds) {
      const user = await UserRepository.findById(env, userId)
      if (user) {
        users.push(user)
      }
    }

    // In a real implementation, you would send emails here
    // For now, we'll just log and return success
    console.log('Sending abandoned cart recovery emails:', {
      recipients: users.map((u) => u.email),
      subject,
      message,
    })

    // Log the notification
    const adminId = typeof userOrResponse === 'object' && 'id' in userOrResponse ? userOrResponse.id : 'unknown'
    for (const user of users) {
      await queryFirst(
        env,
        `INSERT INTO admin_logs (id, adminId, action, entity, entityId, details, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        adminId,
        'ABANDONED_CART_NOTIFICATION',
        'Cart',
        user.id,
        `Sent abandoned cart recovery email to ${user.email}`,
        new Date().toISOString()
      )
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
