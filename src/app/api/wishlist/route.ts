import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth-utils'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { queryAll, queryFirst, execute, parseJSON, numberToBool } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'
import { sanitizeForDB } from '@/lib/sanitize'

export const runtime = 'edge';

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  // Get D1 database from request context
  const env = getEnv(request)

  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = authResult.user.id

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

    return NextResponse.json({ success: true, data: transformedItems })
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
  // Get D1 database from request context
  const env = getEnv(request)

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const userId = authResult.user.id

    // Check if product exists
    const product = await ProductRepository.findById(env, productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if already in wishlist
    const existingItem = await queryFirst(
      env,
      'SELECT * FROM wishlist_items WHERE userId = ? AND productId = ? LIMIT 1',
      userId,
      productId
    )

    if (existingItem) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      )
    }

    // Add to wishlist
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
      message: 'Product added to wishlist',
      data: wishlistItem,
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
  // Get D1 database from request context
  const env = getEnv(request)

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const userId = authResult.user.id

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
    })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}
