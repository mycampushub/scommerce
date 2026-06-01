import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getEnv } from '@/lib/cloudflare'
import { CartRepository } from '@/db/cart.repository'
import { UserRepository } from '@/db/user.repository'
import { queryAll, queryFirst, parseJSON, numberToBool } from '@/db/db'
import { cartItemSchema } from '@/lib/validations'
import { cleanupExpiredReservations, reserveStock } from '@/db/inventory-reservation.repository'
import { successResponse, errorResponse } from '@/lib/api-response'
import { CartItem, Product, ProductVariant } from '@/types/common'


/**
 * POST /api/cart/sync
 * Sync client-side cart (localStorage) with server-side cart (database)
 * Called when user logs in
 */
export async function POST(request: NextRequest) {
  // Get D1 database from request context
  const env = await getEnv()


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

    const payload = await verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.userId
    const body = await request.json() as { localCart: CartItem[] }
    const { localCart } = body

    if (!Array.isArray(localCart)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart data' },
        { status: 400 }
      )
    }

    // Validate each cart item
    for (const item of localCart) {
      const validation = cartItemSchema.safeParse({
        productId: item.id,
        quantity: item.quantity || 1,
        size: item.size,
        color: item.color,
      })
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: `Invalid cart item: ${validation.error.issues[0].message}` },
          { status: 400 }
        )
      }
    }

    // Clean up expired reservations before sync
    await cleanupExpiredReservations(env)

    // Get existing database cart items with products and variants
    const cartItems = await queryAll<{
      id: string
      productId: string
      variantId: string | null
      quantity: number
      productName: string
      basePrice: number
      comparePrice: number | null
      images: string
      stock: number
      isActive: number
      sku: string | null
      size: string | null
      color: string | null
      material: string | null
    }>(
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
      cartItems.map((item) => [
        `${item.productId}-${item.variantId || 'no-variant'}`,
        item
      ])
    )

    let addedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const warnings: string[] = []

    // Merge local cart with database cart
    for (const localItem of localCart) {
      const itemKey = `${localItem.id}-${localItem.variantId || 'no-variant'}`
      const existingItem = dbCartMap.get(itemKey)

      // Check stock availability
      const stockCheck = localItem.variantId
        ? await queryFirst<{ stock: number; name: string; sku?: string }>(
            env,
            'SELECT pv.stock, p.name, pv.sku FROM product_variants pv JOIN products p ON pv.productId = p.id WHERE pv.id = ? LIMIT 1',
            localItem.variantId
          )
        : await queryFirst<{ stock: number; name: string; sku?: string }>(
            env,
            'SELECT stock, name, NULL as sku FROM products WHERE id = ? LIMIT 1',
            localItem.id
          )

      if (!stockCheck) {
        warnings.push(`${localItem.name || 'Item'} (ID: ${localItem.id}): Product not found, skipped`)
        skippedCount++
        continue
      }

      const availableStock = stockCheck.stock || 0
      const requestedQuantity = localItem.quantity || 1
      const finalQuantity = Math.min(requestedQuantity, availableStock)

      if (availableStock === 0) {
        warnings.push(`${stockCheck.name}: Out of stock, skipped`)
        skippedCount++
        continue
      }

      if (finalQuantity < requestedQuantity) {
        warnings.push(`${stockCheck.name}${stockCheck.sku ? ` (${stockCheck.sku})` : ''}: Only ${availableStock} available, adjusted from ${requestedQuantity}`)
      }

      if (existingItem) {
        // Item exists in both, update quantity (keep higher quantity, but not exceeding available stock)
        const newQuantity = Math.min(
          Math.max(existingItem.quantity, requestedQuantity),
          availableStock
        )

        if (newQuantity !== existingItem.quantity) {
          await CartRepository.updateQuantity(env, existingItem.id, newQuantity)
          updatedCount++

          // Update reservation for the quantity change
          await cleanupExpiredReservations(env)
          await reserveStock(env, {
            variantId: localItem.variantId,
            productId: localItem.id,
            userId,
            quantity: newQuantity,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          })
        }
      } else {
        // Item only in local cart, add to database (with stock validation)
        await CartRepository.addItem(env, {
          userId,
          productId: localItem.id,
          variantId: localItem.variantId,
          quantity: finalQuantity,
        })
        addedCount++

        // Reserve stock for 30 minutes
        await reserveStock(env, {
          variantId: localItem.variantId,
          productId: localItem.id,
          userId,
          quantity: finalQuantity,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        })
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
    const formattedItems = mergedCart.map((item) => {
      const images = parseJSON<string[]>(item.images as string) || []
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
        skipped: skippedCount,
        total: formattedItems.length,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    })
  } catch (error) {
    console.error('Cart sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync cart' },
      { status: 500 }
    )
  }
}
