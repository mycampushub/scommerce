import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { cartItemSchema, updateCartItemSchema } from '@/lib/validations';
import { getEnv } from '@/lib/cloudflare';
import { CartRepository } from '@/db/cart.repository';
import { parseJSON, queryFirst, queryAll } from '@/db/db';
;
import { sanitizeForDB } from '@/lib/sanitize';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import {
  reserveStock,
  releaseCartItemReservation,
  releaseAllUserReservations,
  cleanupExpiredReservations,
  getUserReservations,
} from '@/db/inventory-reservation.repository';

/**
 * TypeScript interfaces for cart operations
 */
interface CartRequestBody {
  action: 'add' | 'update' | 'remove' | 'sync' | 'clear';
  item?: {
    productId: string;
    variantId?: string;
    quantity?: number;
    size?: string;
    color?: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    variantId?: string;
    size?: string;
    color?: string;
  }>;
}

interface StockCheckResult {
  stock: number;
  name: string;
  sku?: string | null;
}


/**
 * GET /api/cart
 * Get cart items for authenticated user
 */
export async function GET(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('session')?.value;
    const token = extractTokenFromHeader(authHeader) || cookieToken;

    // If user is authenticated, fetch from database
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        const cartItems = await CartRepository.findByUserId(env, payload.userId);

        // Batch fetch all products to avoid N+1 queries
        const productIds = cartItems.map(item => item.productId);
        const productsMap = new Map<string, {
          id: string;
          name: string;
          basePrice: number;
          comparePrice: number | null;
          images: string;
          stock: number;
          isActive: number;
        }>();

        if (productIds.length > 0) {
          const placeholders = productIds.map(() => '?').join(',');
          const products = await queryAll<{
            id: string;
            name: string;
            basePrice: number;
            comparePrice: number | null;
            images: string;
            stock: number;
            isActive: number;
          }>(
            env,
            `SELECT id, name, basePrice, comparePrice, images, stock, isActive FROM products WHERE id IN (${placeholders})`,
            ...productIds
          );
          products.forEach(p => productsMap.set(p.id, p));
        }

        // Batch fetch all variants to avoid N+1 queries
        const variantIds = cartItems.map(item => item.variantId).filter(Boolean) as string[];
        const variantsMap = new Map<string, {
          id: string;
          sku: string | null;
          size: string | null;
          color: string | null;
          material: string | null;
          productId: string;
        }>();

        if (variantIds.length > 0) {
          const placeholders = variantIds.map(() => '?').join(',');
          const variants = await queryAll<{
            id: string;
            sku: string | null;
            size: string | null;
            color: string | null;
            material: string | null;
            productId: string;
          }>(
            env,
            `SELECT id, sku, size, color, material, productId FROM product_variants WHERE id IN (${placeholders})`,
            ...variantIds
          );
          variants.forEach(v => variantsMap.set(v.id, v));
        }

        // Transform to match cart store format
        const formattedItems = cartItems.map(item => {
          const product = productsMap.get(item.productId);
          if (!product) return null;

          const variant = item.variantId ? variantsMap.get(item.variantId) : null;
          const parsedImages = parseJSON<string[]>(product.images);
          const images = Array.isArray(parsedImages) ? parsedImages : [];

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
        });

        const validItems = formattedItems.filter(item => item !== null);

        const response = NextResponse.json({
          success: true,
          items: validItems,
          source: 'database',
        });

        // Add caching headers for cart (user-specific - 2 minutes, private)
        return addCacheHeaders(response, CachePresets.PRIVATE);
      }
    }

    // For guest users, return empty cart (client-side uses localStorage)
    const response = NextResponse.json({
      success: true,
      items: [],
      source: 'guest',
    });

    // Add caching headers for guest cart (no cache)
    return addCacheHeaders(response, CachePresets.NO_CACHE);
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
  const env = await getEnv();

  try {
    const body: CartRequestBody = await request.json() as CartRequestBody;
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

    const payload = await verifyToken(token);
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
        if (!item) {
          return NextResponse.json(
            { success: false, error: 'Item data is required' },
            { status: 400 }
          );
        }

        const validation = cartItemSchema.safeParse(item);
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.issues[0].message },
            { status: 400 }
          );
        }

        // Clean up expired reservations before adding
        await cleanupExpiredReservations(env);

        // Reserve stock for 30 minutes
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Check stock availability and reserve
        const reservation = await reserveStock(env, {
          variantId: item.variantId,
          productId: item.productId,
          userId,
          quantity: item.quantity || 1,
          expiresAt,
        });

        if (!reservation) {
          // Stock not available
          const stockCheck = item.variantId
            ? await queryFirst<StockCheckResult>(
                env,
                'SELECT pv.stock, p.name, pv.sku FROM product_variants pv JOIN products p ON pv.productId = p.id WHERE pv.id = ? LIMIT 1',
                item.variantId
              )
            : await queryFirst<{ stock: number; name: string }>(
                env,
                'SELECT stock, name FROM products WHERE id = ? LIMIT 1',
                item.productId
              );

          const stockCheckTyped = stockCheck as StockCheckResult | null;
          const itemName = stockCheckTyped
            ? `${stockCheckTyped.name}${stockCheckTyped.sku ? ` (${stockCheckTyped.sku})` : ''}`
            : 'Item';

          return NextResponse.json(
            {
              success: false,
              error: `Sorry, ${itemName} is out of stock or insufficient quantity available`,
              stockAvailable: stockCheck?.stock || 0,
            },
            { status: 409 }
          );
        }

        // Add item to cart using repository with error handling
        let cartItem;
        try {
          cartItem = await CartRepository.addItem(env, {
            userId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity || 1,
          });
        } catch (error) {
          // If cart add fails, release the reservation
          console.error('Failed to add cart item, releasing reservation:', error);
          await releaseCartItemReservation(env, userId, item.productId, item.variantId || null);
          return NextResponse.json(
            { success: false, error: 'Failed to add item to cart' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, item: cartItem });
      }

      case 'update': {
        // Validate cart item
        if (!item) {
          return NextResponse.json(
            { success: false, error: 'Item data is required' },
            { status: 400 }
          );
        }

        const validation = updateCartItemSchema.safeParse(item);
        if (!validation.success) {
          return NextResponse.json(
            { success: false, error: validation.error.issues[0].message },
            { status: 400 }
          );
        }

        // Find the cart item
        const existingItem = await queryFirst<{ id: string }>(
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

        // Re-check stock availability before updating quantity
        // Get current stock for the product/variant
        const stockCheck = item.variantId
          ? await queryFirst<{ stock: number }>(
              env,
              'SELECT stock FROM product_variants WHERE id = ? LIMIT 1',
              item.variantId
            )
          : await queryFirst<{ stock: number }>(
              env,
              'SELECT stock FROM products WHERE id = ? LIMIT 1',
              item.productId
            );

        const availableStock = stockCheck?.stock || 0;
        const quantityRequested = item.quantity || 1;
        if (quantityRequested > availableStock) {
          return NextResponse.json(
            {
              success: false,
              error: `Sorry, only ${availableStock} item(s) available in stock`,
              availableStock,
            },
            { status: 409 }
          );
        }

        // Update quantity
        const updatedItem = await CartRepository.updateQuantity(env, existingItem.id, quantityRequested);
        return NextResponse.json({ success: true, item: updatedItem });
      }

      case 'remove': {
        if (!item) {
          return NextResponse.json(
            { success: false, error: 'Item data is required' },
            { status: 400 }
          );
        }

        // Find the cart item
        const existingItemRemove = await queryFirst<{ id: string }>(
          env,
          'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND (variantId IS NULL OR variantId = ?) LIMIT 1',
          userId,
          item.productId!,
          item.variantId || null
        );

        if (!existingItemRemove) {
          return NextResponse.json(
            { success: false, error: 'Cart item not found' },
            { status: 404 }
          );
        }

        // Release stock reservation
        await releaseCartItemReservation(env, userId, item.productId!, item.variantId || null);

        // Remove cart item
        await CartRepository.removeItem(env, existingItemRemove.id);
        return NextResponse.json({ success: true, count: 1 });
      }

      case 'sync': {
        // Sync all cart items from client to server
        if (!Array.isArray(items) || items.length === 0) {
          // Clear user's cart
          await CartRepository.clearCart(env, userId);
          return NextResponse.json({ success: true, synced: 0 });
        }

        const errors: string[] = [];
        let synced = 0;

        // Clean up expired reservations before sync
        await cleanupExpiredReservations(env);

        // Clear existing cart
        await CartRepository.clearCart(env, userId);

        // Create new cart items
        for (const clientItem of items) {
          const validation = cartItemSchema.safeParse({
            productId: clientItem.id,
            quantity: clientItem.quantity || 1,
            size: clientItem.size,
            color: clientItem.color,
          });
          if (!validation.success) {
            errors.push(`Item ${clientItem.id}: ${validation.error.issues[0].message}`);
            continue; // Skip invalid items but continue with others
          }

          // Check stock availability before adding to cart
          const stockCheck = clientItem.variantId
            ? await queryFirst<{ stock: number }>(
                env,
                'SELECT stock FROM product_variants WHERE id = ? LIMIT 1',
                clientItem.variantId
              )
            : await queryFirst<{ stock: number }>(
                env,
                'SELECT stock FROM products WHERE id = ? LIMIT 1',
                clientItem.id
              );

          const availableStock = stockCheck?.stock || 0;
          const quantityToAdd = clientItem.quantity || 1;

          if (quantityToAdd > availableStock) {
            errors.push(`Item ${clientItem.id}: Only ${availableStock} available, requested ${quantityToAdd}`);
            // Still add the item but with available stock
            await CartRepository.addItem(env, {
              userId,
              productId: clientItem.id,
              variantId: clientItem.variantId,
              quantity: availableStock,
            });
            synced++;
          } else {
            // Reserve stock
            await reserveStock(env, {
              variantId: clientItem.variantId,
              productId: clientItem.id,
              userId,
              quantity: quantityToAdd,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });

            await CartRepository.addItem(env, {
              userId,
              productId: clientItem.id,
              variantId: clientItem.variantId,
              quantity: quantityToAdd,
            });
            synced++;
          }
        }

        // Return success even with errors, but include error details
        return NextResponse.json({
          success: true,
          synced,
          errors: errors.length > 0 ? errors : undefined,
        });
      }

      case 'clear': {
        // Release all inventory reservations for this user
        await releaseAllUserReservations(env, userId);

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
