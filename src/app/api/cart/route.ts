import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';
import { cartItemSchema, updateCartItemSchema } from '@/lib/validations';
import { getEnv } from '@/lib/cloudflare';
import { CartRepository } from '@/db/cart.repository';
import { parseJSON, queryFirst, queryAll } from '@/db/db';
import { csrfMiddleware } from '@/lib/csrf';
import { sanitizeForDB } from '@/lib/sanitize';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

/**
 * GET /api/cart
 * Get cart items for authenticated user
 */
export async function GET(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('session')?.value;
    const token = extractTokenFromHeader(authHeader) || cookieToken;

    // If user is authenticated, fetch from database
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.userId) {
        const cartItems = await CartRepository.findByUserId(env, payload.userId);

        // Transform to match cart store format
        const formattedItems = await Promise.all(cartItems.map(async (item) => {
          // Fetch product details
          const product = await queryFirst(
            env,
            'SELECT id, name, basePrice, comparePrice, images, stock, isActive FROM products WHERE id = ? LIMIT 1',
            item.productId
          );

          if (!product) return null;

          // Fetch variant details if variantId exists
          let variant = null;
          if (item.variantId) {
            variant = await queryFirst(
              env,
              'SELECT id, sku, size, color, material FROM product_variants WHERE id = ? LIMIT 1',
              item.variantId
            );
          }

          const images = parseJSON<string[]>(product.images) || [];

          return {
            id: item.productId,
            name: product.name,
            price: product.basePrice,
            originalPrice: product.comparePrice,
            image: images[0] || '',
            quantity: item.quantity,
            variantId: item.variantId || undefined,
            variantSku: variant?.sku || undefined,
            size: variant?.size || null,
            color: variant?.color || null,
            material: variant?.material || null,
          };
        }));

        const validItems = formattedItems.filter(item => item !== null);

        return NextResponse.json({
          success: true,
          items: validItems,
          source: 'database',
        });
      }
    }

    // For guest users, return empty cart (client-side uses localStorage)
    return NextResponse.json({
      success: true,
      items: [],
      source: 'guest',
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Sync cart to database for authenticated users
 */
export async function POST(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env);
  if (csrfError) {
    return csrfError;
  }

  try {
    const body = await request.json();
    const { action, item, items } = body;

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('session')?.value;
    const token = extractTokenFromHeader(authHeader) || cookieToken;

    if (!token) {
      // Guest user - return success (cart stored in localStorage)
      return NextResponse.json({
        success: true,
        message: 'Cart stored locally',
        source: 'guest',
      });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Handle different actions
    switch (action) {
      case 'add': {
        // Validate cart item
        const validation = cartItemSchema.safeParse(item);
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.errors[0].message },
            { status: 400 }
          );
        }

        // Add item to cart using repository
        const cartItem = await CartRepository.addItem(env, {
          userId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity || 1,
        });
        return NextResponse.json({ success: true, item: cartItem });
      }

      case 'update': {
        // Validate cart item
        const validation = updateCartItemSchema.safeParse(item);
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.errors[0].message },
            { status: 400 }
          );
        }

        // Find the cart item
        const existingItem = await queryFirst(
          env,
          'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND (variantId IS NULL OR variantId = ?) LIMIT 1',
          userId,
          item.productId!,
          item.variantId || null
        );

        if (!existingItem) {
          return NextResponse.json(
            { success: false, error: 'Cart item not found' },
            { status: 404 }
          );
        }

        // Update quantity
        const updatedItem = await CartRepository.updateQuantity(env, existingItem.id, item.quantity);
        return NextResponse.json({ success: true, item: updatedItem });
      }

      case 'remove': {
        // Find the cart item
        const existingItem = await queryFirst(
          env,
          'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND (variantId IS NULL OR variantId = ?) LIMIT 1',
          userId,
          item.productId!,
          item.variantId || null
        );

        if (!existingItem) {
          return NextResponse.json(
            { success: false, error: 'Cart item not found' },
            { status: 404 }
          );
        }

        // Remove cart item
        await CartRepository.removeItem(env, existingItem.id);
        return NextResponse.json({ success: true, count: 1 });
      }

      case 'sync': {
        // Sync all cart items from client to server
        if (!Array.isArray(items) || items.length === 0) {
          // Clear user's cart
          await CartRepository.clearCart(env, userId);
          return NextResponse.json({ success: true, synced: 0 });
        }

        // Clear existing cart
        await CartRepository.clearCart(env, userId);

        // Create new cart items
        for (const clientItem of items) {
          await CartRepository.addItem(env, {
            userId,
            productId: clientItem.id,
            variantId: clientItem.variantId,
            quantity: clientItem.quantity || 1,
          });
        }

        return NextResponse.json({ success: true, synced: items.length });
      }

      case 'clear': {
        // Clear all cart items for user
        await CartRepository.clearCart(env, userId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cart operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process cart' },
      { status: 500 }
    );
  }
}
