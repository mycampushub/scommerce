import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt'

/**
 * POST /api/cart/sync
 * Sync client-side cart (localStorage) with server-side cart (database)
 * Called when user logs in
 */
export async function POST(request: NextRequest) {
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

    // Get existing database cart items
    const existingDbCart = await db.cartItem.findMany({
      where: { userId },
      include: { 
        product: true,
        variant: true,
      },
    })

    // Create a map for quick lookup (using productId + variantId as key)
    const dbCartMap = new Map(
      existingDbCart.map((item) => [
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
          await db.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          })
          updatedCount++
        }
      } else {
        // Item only in local cart, add to database
        await db.cartItem.create({
          data: {
            userId,
            productId: localItem.id,
            quantity: localItem.quantity || 1,
            ...(localItem.variantId && { variantId: localItem.variantId }),
            ...(localItem.variantSku && { variantSku: localItem.variantSku }),
          },
        })
        addedCount++
      }
    }

    // Fetch merged cart
    const mergedCart = await db.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
            isActive: true,
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            material: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to match cart store format
    const formattedItems = mergedCart.map((item) => ({
      id: item.productId,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.comparePrice,
      image: item.product.images ? JSON.parse(item.product.images)[0] : '',
      quantity: item.quantity,
      variantId: item.variantId || undefined,
      variantSku: item.variantSku || undefined,
      size: item.variant?.size || null,
      color: item.variant?.color || null,
      material: item.variant?.material || null,
    }))

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
