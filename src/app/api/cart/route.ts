import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt'
import { cartItemSchema, updateCartItemSchema } from '@/lib/validations'

/**
 * GET /api/cart
 * Get cart items for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    // If user is authenticated, fetch from database
    if (token) {
      const payload = verifyToken(token)
      if (payload && payload.userId) {
        const cartItems = await db.cartItem.findMany({
          where: { userId: payload.userId },
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
        const formattedItems = cartItems.map((item) => ({
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
          source: 'database',
        })
      }
    }

    // For guest users, return empty cart (client-side uses localStorage)
    return NextResponse.json({
      success: true,
      items: [],
      source: 'guest',
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cart
 * Sync cart to database for authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, item, items } = body

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('session')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      // Guest user - return success (cart stored in localStorage)
      return NextResponse.json({
        success: true,
        message: 'Cart stored locally',
        source: 'guest',
      })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = payload.userId

    // Handle different actions
    switch (action) {
      case 'add': {
        // Validate cart item
        const validation = cartItemSchema.safeParse(item)
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.errors[0].message },
            { status: 400 }
          )
        }

        // Check if item already exists (by variant if present, else by product)
        const existingItem = await db.cartItem.findFirst({
          where: {
            userId,
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : { variantId: null }),
          },
        })

        if (existingItem) {
          // Update quantity
          const updatedItem = await db.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + (item.quantity || 1),
            },
          })
          return NextResponse.json({ success: true, item: updatedItem })
        }

        // Create new cart item
        const cartItem = await db.cartItem.create({
          data: {
            userId,
            productId: item.productId,
            quantity: item.quantity || 1,
            ...(item.variantId && { variantId: item.variantId }),
            ...(item.variantSku && { variantSku: item.variantSku }),
          },
        })
        return NextResponse.json({ success: true, item: cartItem })
      }

      case 'update': {
        // Validate cart item
        const validation = updateCartItemSchema.safeParse(item)
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.errors[0].message },
            { status: 400 }
          )
        }

        // Update existing cart item
        const cartItem = await db.cartItem.updateMany({
          where: {
            userId,
            productId: item.productId!,
            ...(item.variantId ? { variantId: item.variantId } : { variantId: null }),
          },
          data: {
            quantity: item.quantity,
          },
        })

        return NextResponse.json({ success: true, count: cartItem.count })
      }

      case 'remove': {
        // Remove cart item
        const cartItem = await db.cartItem.deleteMany({
          where: {
            userId,
            productId: item.productId!,
            ...(item.variantId ? { variantId: item.variantId } : { variantId: null }),
          },
        })

        return NextResponse.json({ success: true, count: cartItem.count })
      }

      case 'sync': {
        // Sync all cart items from client to server
        if (!Array.isArray(items) || items.length === 0) {
          // Clear user's cart
          await db.cartItem.deleteMany({ where: { userId } })
          return NextResponse.json({ success: true, synced: 0 })
        }

        // Clear existing cart
        await db.cartItem.deleteMany({ where: { userId } })

        // Create new cart items
        const cartItems = await db.cartItem.createMany({
          data: items.map((item: any) => ({
            userId,
            productId: item.id,
            quantity: item.quantity || 1,
            ...(item.variantId && { variantId: item.variantId }),
            ...(item.variantSku && { variantSku: item.variantSku }),
          })),
          skipDuplicates: true,
        })

        return NextResponse.json({ success: true, synced: cartItems.count })
      }

      case 'clear': {
        // Clear all cart items for user
        await db.cartItem.deleteMany({ where: { userId } })
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cart operation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process cart' },
      { status: 500 }
    )
  }
}
