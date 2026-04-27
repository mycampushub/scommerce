import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt'
import { getEnv } from '@/lib/cloudflare'
import { CartRepository } from '@/db/cart.repository'
import { UserRepository } from '@/db/user.repository'
import { queryAll, queryFirst, parseJSON, numberToBool } from '@/db/db'

export const runtime = 'edge';

/**
 * POST /api/cart/sync
 * Sync client-side cart (localStorage) with server-side cart (database)
 * Called when user logs in
 */
export async function POST(request: NextRequest) {
  // Get D1 database from request context
  const env = getEnv(request)

  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.userId
    const body = await request.json()
    const { localCart } = body

    if (!Array.isArray(localCart)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart data' },
        { status: 400 }
      )
    }

    // Get existing database cart items with products and variants
    const cartItems = await queryAll(
      env,
      `SELECT ci.*, p.name as productName, p.basePrice, p.comparePrice, p.images, p.stock, p.isActive,
              v.sku, v.size, v.color, v.material
       FROM cart_items ci
       LEFT JOIN products p ON ci.productId = p.id
       LEFT JOIN product_variants v ON ci.variantId = v.id
       WHERE ci.userId = ?
       ORDER BY ci.createdAt DESC`,
      userId
    )

    // Create a map for quick lookup (using productId + variantId as key)
    const dbCartMap = new Map(
      cartItems.map((item: any) => [
        `${item.productId}-${item.variantId || 'no-variant'}`,
        item
      ])
    )

    let addedCount = 0
    let updatedCount = 0

    // Merge local cart with database cart
    for (const localItem of localCart) {
      const itemKey = `${localItem.id}-${localItem.variantId || 'no-variant'}`
      const existingItem = dbCartMap.get(itemKey)

      if (existingItem) {
        // Item exists in both, keep higher quantity
        const newQuantity = Math.max(
          existingItem.quantity,
          localItem.quantity || 1
        )

        if (newQuantity !== existingItem.quantity) {
          await CartRepository.updateQuantity(env, existingItem.id, newQuantity)
          updatedCount++
        }
      } else {
        // Item only in local cart, add to database
        await CartRepository.addItem(env, {
          userId,
          productId: localItem.id,
          variantId: localItem.variantId,
          quantity: localItem.quantity || 1,
        })
        addedCount++
      }
    }

    // Fetch merged cart
    const mergedCart = await queryAll(
      env,
      `SELECT ci.*, p.name as productName, p.basePrice, p.comparePrice, p.images, p.stock, p.isActive,
              v.sku, v.size, v.color, v.material
       FROM cart_items ci
       LEFT JOIN products p ON ci.productId = p.id
       LEFT JOIN product_variants v ON ci.variantId = v.id
       WHERE ci.userId = ?
       ORDER BY ci.createdAt DESC`,
      userId
    )

    // Transform to match cart store format
    const formattedItems = mergedCart.map((item: any) => {
      const images = parseJSON<string[]>(item.images) || []
      return {
        id: item.productId,
        name: item.productName,
        price: item.basePrice,
        originalPrice: item.comparePrice,
        image: images[0] || '',
        quantity: item.quantity,
        variantId: item.variantId || undefined,
        variantSku: item.sku || undefined,
        size: item.size || null,
        color: item.color || null,
        material: item.material || null,
      }
    })

    return NextResponse.json({
      success: true,
      items: formattedItems,
      summary: {
        added: addedCount,
        updated: updatedCount,
        total: formattedItems.length,
      },
    })
  } catch (error) {
    console.error('Cart sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync cart' },
      { status: 500 }
    )
  }
}
