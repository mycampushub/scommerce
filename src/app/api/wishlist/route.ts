import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { queryAll, queryFirst, execute, parseJSON, numberToBool, generateSecureId } from '@/db/db'
import { sanitizeForDB } from '@/lib/sanitize'
import { getEnv } from '@/lib/cloudflare'


// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  const env = await getEnv()

  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    // If user is authenticated, fetch from database
    if (token) {
      const payload = await verifyToken(token)
      if (payload && payload.userId) {
        const userId = payload.userId

        // Get wishlist items with product and category details
        const wishlistItems = await queryAll(
          env,
          `SELECT wi.*, p.*, c.name as categoryName, c.slug as categorySlug
           FROM wishlist_items wi
           LEFT JOIN products p ON wi.productId = p.id
           LEFT JOIN categories c ON p.categoryId = c.id
           WHERE wi.userId = ?
           ORDER BY wi.createdAt DESC`,
          userId
        )

        // Transform items
        const transformedItems = wishlistItems.map((item: any) => {
          const images = parseJSON<string[]>(item.images) || []
          return {
            id: item.id,
            userId: item.userId,
            productId: item.productId,
            createdAt: item.createdAt,
            product: {
              id: item.productId,
              name: item.name,
              slug: item.slug,
              description: item.description,
              price: item.basePrice,
              basePrice: item.basePrice,
              comparePrice: item.comparePrice,
              images: images,
              stock: item.stock,
              isActive: numberToBool(item.isActive),
              isFeatured: numberToBool(item.isFeatured),
              hasVariants: numberToBool(item.hasVariants),
              category: {
                id: item.categoryId,
                name: item.categoryName,
                slug: item.categorySlug,
              },
            },
          }
        })

        return NextResponse.json({ success: true, data: transformedItems, source: 'database' })
      }
    }

    // For guest users, return empty wishlist (client-side uses localStorage)
    return NextResponse.json({ success: true, data: [], source: 'guest' })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Add product to wishlist
export async function POST(request: NextRequest) {
  const env = await getEnv()

  try {
    const body = await request.json() as any
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    // For guest users, return success (wishlist stored in localStorage)
    if (!token) {
      return NextResponse.json({
        success: true,
        message: 'Wishlist stored locally',
        source: 'guest',
      })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // Check if product exists
    const product = await ProductRepository.findById(env, productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if already in wishlist — toggle: remove if exists
    const existingItem = await queryFirst(
      env,
      'SELECT * FROM wishlist_items WHERE userId = ? AND productId = ? LIMIT 1',
      userId,
      productId
    )

    if (existingItem) {
      await execute(
        env,
        'DELETE FROM wishlist_items WHERE userId = ? AND productId = ?',
        userId,
        productId
      )
      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'Product removed from wishlist',
        source: 'database',
      })
    }

    // Add to wishlist
    const id = generateSecureId()
    const createdAt = new Date().toISOString()

    await execute(
      env,
      'INSERT INTO wishlist_items (id, userId, productId, createdAt) VALUES (?, ?, ?, ?)',
      id,
      userId,
      productId,
      createdAt
    )

    // Fetch the created item with product details
    const wishlistItem = await queryFirst(
      env,
      `SELECT wi.*, p.*, c.name as categoryName, c.slug as categorySlug
       FROM wishlist_items wi
       LEFT JOIN products p ON wi.productId = p.id
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE wi.id = ? LIMIT 1`,
      id
    )

    return NextResponse.json({
      success: true,
      action: 'added',
      message: 'Product added to wishlist',
      data: wishlistItem,
      source: 'database',
    })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist?productId={id} - Remove from wishlist
export async function DELETE(request: NextRequest) {
  const env = await getEnv()

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    // For guest users, return success (wishlist stored in localStorage)
    if (!token) {
      return NextResponse.json({
        success: true,
        message: 'Wishlist stored locally',
        source: 'guest',
      })
    }

    const payload = await verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // Check if item exists
    const wishlistItem = await queryFirst(
      env,
      'SELECT * FROM wishlist_items WHERE userId = ? AND productId = ? LIMIT 1',
      userId,
      productId
    )

    if (!wishlistItem) {
      return NextResponse.json(
        { error: 'Item not found in wishlist' },
        { status: 404 }
      )
    }

    // Remove from wishlist
    await execute(
      env,
      'DELETE FROM wishlist_items WHERE userId = ? AND productId = ?',
      userId,
      productId
    )

    return NextResponse.json({
      success: true,
      message: 'Product removed from wishlist',
      source: 'database',
    })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}
