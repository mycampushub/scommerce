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

    console.log('[Cart GET] Authentication check:', {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      hasToken: !!token
    });

    // If user is authenticated, fetch from database
    if (token) {
      const payload = await verifyToken(token);
      console.log('[Cart GET] Token verification:', {
        verified: !!payload,
        hasUserId: !!payload?.userId,
        userId: payload?.userId
      });

      if (payload && payload.userId) {
        const cartItems = await CartRepository.findByUserId(env, payload.userId);
        console.log('[Cart GET] Cart items found:', cartItems.length, 'for user:', payload.userId);

        // Batch fetch all products to avoid N+1 queries
        const productIds = cartItems.map(item => item.productId);
        const productsMap = new Map<string, {
          id: string;
          name: string;
          slug: string;
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
            slug: string;
            basePrice: number;
            comparePrice: number | null;
            images: string;
            stock: number;
            isActive: number;
          }>(
            env,
            `SELECT id, name, slug, basePrice, comparePrice, images, stock, isActive FROM products WHERE id IN (${placeholders})`,
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
          price: number;
          comparePrice: number | null;
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
            price: number;
            comparePrice: number | null;
          }>(
            env,
            `SELECT id, sku, size, color, material, productId, price, comparePrice FROM product_variants WHERE id IN (${placeholders})`,
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

          // Get price from variant if available, otherwise from product
          const itemPrice = variant 
            ? (variant.comparePrice || variant.price) 
            : (product.comparePrice || product.basePrice);
          
          const itemOriginalPrice = variant
            ? (variant.price > (variant.comparePrice || 0) ? variant.price : undefined)
            : (product.basePrice > (product.comparePrice || 0) ? product.basePrice : undefined);

          return {
            id: item.productId,
            slug: product.slug,
            name: product.name,
            price: itemPrice,
            originalPrice: itemOriginalPrice,
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

    console.log('[Cart POST] Action:', action, {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      hasToken: !!token,
      hasItem: !!item,
      itemsCount: items?.length || 0
    });

    if (!token) {
      // Guest user - return success (cart stored in localStorage)
      console.log('[Cart POST] Guest user, cart stored locally');
      return NextResponse.json({
        success: true,
        message: 'Cart stored locally',
        source: 'guest',
      });
    }

    const payload = await verifyToken(token);
    console.log('[Cart POST] Token verification:', {
      verified: !!payload,
      hasUserId: !!payload?.userId,
      userId: payload?.userId
    });

    if (!payload || !payload.userId) {
      console.error('[Cart POST] Invalid token', { payload });
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    console.log('[Cart POST] Processing action:', action, 'for user:', userId);

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

        // Check if user already has this item in cart
        const existingCartItem = item.variantId
          ? await queryFirst<{ id: string; quantity: number }>(
              env,
              'SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ? LIMIT 1',
              userId,
              item.productId,
              item.variantId
            )
          : await queryFirst<{ id: string; quantity: number }>(
              env,
              'SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ? AND variantId IS NULL LIMIT 1',
              userId,
              item.productId
            );

        const existingQuantity = existingCartItem?.quantity || 0;
        const requestedQuantity = item.quantity || 1;
        const totalQuantity = existingQuantity + requestedQuantity;

        // Reserve stock for 30 minutes
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Check stock availability and reserve
        const reservation = await reserveStock(env, {
          variantId: item.variantId,
          productId: item.productId,
          userId,
          quantity: requestedQuantity,
          expiresAt,
          existingCartQuantity: existingQuantity,
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

          const availableStock = stockCheck?.stock || 0;
          const message = availableStock > 0
            ? `Sorry, only ${availableStock} ${availableStock === 1 ? 'item' : 'items'} available in stock (you already have ${existingQuantity} in cart)`
            : `Sorry, ${itemName} is out of stock`;

          return NextResponse.json(
            {
              success: false,
              error: message,
              stockAvailable: availableStock,
              cartQuantity: existingQuantity,
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
            quantity: requestedQuantity,
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
        const existingItem = item.variantId
          ? await queryFirst<{ id: string }>(
              env,
              'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ? LIMIT 1',
              userId,
              item.productId!,
              item.variantId
            )
          : await queryFirst<{ id: string }>(
              env,
              'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId IS NULL LIMIT 1',
              userId,
              item.productId!
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
        const existingItemRemove = item.variantId
          ? await queryFirst<{ id: string }>(
              env,
              'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ? LIMIT 1',
              userId,
              item.productId!,
              item.variantId
            )
          : await queryFirst<{ id: string }>(
              env,
              'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId IS NULL LIMIT 1',
              userId,
              item.productId!
            );

        if (!existingItemRemove) {
          return NextResponse.json(
            { success: false, error: 'Cart item not found' },
            { status: 404 }
          );
        }

        // Release stock reservation (best-effort — don't block deletion if it fails)
        try {
          await releaseCartItemReservation(env, userId, item.productId!, item.variantId || null);
        } catch (reservationError) {
          console.error('[Cart Remove] Failed to release reservation, continuing:', reservationError);
        }

        // Remove cart item
        await CartRepository.removeItem(env, existingItemRemove.id);
        return NextResponse.json({ success: true, count: 1 });
      }

      case 'sync': {
        console.log('[Cart POST] Sync action:', {
          itemsLength: items?.length || 0,
          userId
        });

        // Sync all cart items from client to server
        if (!Array.isArray(items) || items.length === 0) {
          // Keep existing cart, don't clear it
          // Just fetch and return existing items
          console.log('[Cart POST] No items to sync, fetching existing cart');
          const existingCartItems = await CartRepository.findByUserId(env, userId);
          console.log('[Cart POST] Existing cart items:', existingCartItems.length);

          // Batch fetch all products to avoid N+1 queries
          const productIds = existingCartItems.map(item => item.productId);
          const productsMap = new Map<string, {
            id: string;
            name: string;
            slug: string;
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
              slug: string;
              basePrice: number;
              comparePrice: number | null;
              images: string;
              stock: number;
              isActive: number;
            }>(
              env,
              `SELECT id, name, slug, basePrice, comparePrice, images, stock, isActive FROM products WHERE id IN (${placeholders})`,
              ...productIds
            );
            products.forEach(p => productsMap.set(p.id, p));
          }

          // Batch fetch all variants to avoid N+1 queries
          const variantIds = existingCartItems.map(item => item.variantId).filter(Boolean) as string[];
          const variantsMap = new Map<string, {
            id: string;
            sku: string | null;
            size: string | null;
            color: string | null;
            material: string | null;
            productId: string;
            price: number;
            comparePrice: number | null;
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
              price: number;
              comparePrice: number | null;
            }>(
              env,
              `SELECT id, sku, size, color, material, productId, price, comparePrice FROM product_variants WHERE id IN (${placeholders})`,
              ...variantIds
            );
            variants.forEach(v => variantsMap.set(v.id, v));
          }

          // Transform to match cart store format
          const formattedItems = existingCartItems.map(item => {
            const product = productsMap.get(item.productId);
            if (!product) return null;

            const variant = item.variantId ? variantsMap.get(item.variantId) : null;
            const parsedImages = parseJSON<string[]>(product.images);
            const images = Array.isArray(parsedImages) ? parsedImages : [];

            // Get price from variant if available, otherwise from product
            const itemPrice = variant 
              ? (variant.comparePrice || variant.price) 
              : (product.comparePrice || product.basePrice);
            
            const itemOriginalPrice = variant
              ? (variant.price > (variant.comparePrice || 0) ? variant.price : undefined)
              : (product.basePrice > (product.comparePrice || 0) ? product.basePrice : undefined);

            return {
              id: item.productId,
              slug: product.slug,
              name: product.name,
              price: itemPrice,
              originalPrice: itemOriginalPrice,
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

          return NextResponse.json({
            success: true,
            synced: 0,
            items: validItems,
          });
        }

        const errors: string[] = [];
        let synced = 0;
        const syncedItemKeys: string[] = []; // Track synced items for cleanup on failure

        // Clean up expired reservations before sync
        await cleanupExpiredReservations(env);

        // Get existing database cart items for merging
        const existingDbCartItems = await CartRepository.findByUserId(env, userId);
        const dbCartMap = new Map(
          existingDbCartItems.map(item => [`${item.productId}-${item.variantId || 'no-variant'}`, item])
        );

        // Process each client item and sync with database
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

          const itemKey = `${clientItem.id}-${clientItem.variantId || 'no-variant'}`;
          const existingDbItem = dbCartMap.get(itemKey);

          // Check stock availability before adding/updating to cart
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
          const finalQuantity = Math.min(quantityToAdd, availableStock);

          if (availableStock === 0) {
            errors.push(`Item ${clientItem.id}: Out of stock, skipped`);
            continue;
          }

          if (finalQuantity < quantityToAdd) {
            errors.push(`Item ${clientItem.id}: Only ${availableStock} available, adjusted from ${quantityToAdd}`);
          }

          try {
            if (existingDbItem) {
              // Item exists in database, update quantity
              await CartRepository.updateQuantity(env, existingDbItem.id, finalQuantity);
            } else {
              // Item doesn't exist in database, add it
              // Reserve stock
              await reserveStock(env, {
                variantId: clientItem.variantId,
                productId: clientItem.id,
                userId,
                quantity: finalQuantity,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
              });

              await CartRepository.addItem(env, {
                userId,
                productId: clientItem.id,
                variantId: clientItem.variantId,
                quantity: finalQuantity,
              });
            }
          } catch (syncItemError) {
            console.error(`[Cart Sync] Error syncing item ${clientItem.id}:`, syncItemError);
            // Clean up any reservations created for this item
            await releaseCartItemReservation(env, userId, clientItem.id, clientItem.variantId || null);
            errors.push(`Item ${clientItem.id}: Failed to sync`);
            continue;
          }
          synced++;
        }

        // Fetch the merged cart to return
        const mergedCartItems = await CartRepository.findByUserId(env, userId);

        // Batch fetch all products to avoid N+1 queries
        const productIds = mergedCartItems.map(item => item.productId);
        const productsMap = new Map<string, {
          id: string;
          name: string;
          slug: string;
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
            slug: string;
            basePrice: number;
            comparePrice: number | null;
            images: string;
            stock: number;
            isActive: number;
          }>(
            env,
            `SELECT id, name, slug, basePrice, comparePrice, images, stock, isActive FROM products WHERE id IN (${placeholders})`,
            ...productIds
          );
          products.forEach(p => productsMap.set(p.id, p));
        }

        // Batch fetch all variants to avoid N+1 queries
        const variantIds = mergedCartItems.map(item => item.variantId).filter(Boolean) as string[];
        const variantsMap = new Map<string, {
          id: string;
          sku: string | null;
          size: string | null;
          color: string | null;
          material: string | null;
          productId: string;
          price: number;
          comparePrice: number | null;
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
            price: number;
            comparePrice: number | null;
          }>(
            env,
            `SELECT id, sku, size, color, material, productId, price, comparePrice FROM product_variants WHERE id IN (${placeholders})`,
            ...variantIds
          );
          variants.forEach(v => variantsMap.set(v.id, v));
        }

        // Transform to match cart store format
        const formattedItems = mergedCartItems.map(item => {
          const product = productsMap.get(item.productId);
          if (!product) return null;

          const variant = item.variantId ? variantsMap.get(item.variantId) : null;
          const parsedImages = parseJSON<string[]>(product.images);
          const images = Array.isArray(parsedImages) ? parsedImages : [];

          // Get price from variant if available, otherwise from product
          const itemPrice = variant 
            ? (variant.comparePrice || variant.price) 
            : (product.comparePrice || product.basePrice);
          
          const itemOriginalPrice = variant
            ? (variant.price > (variant.comparePrice || 0) ? variant.price : undefined)
            : (product.basePrice > (product.comparePrice || 0) ? product.basePrice : undefined);

          return {
            id: item.productId,
            slug: product.slug,
            name: product.name,
            price: itemPrice,
            originalPrice: itemOriginalPrice,
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

        // Return success even with errors, but include error details
        return NextResponse.json({
          success: true,
          synced,
          items: validItems,
          errors: errors.length > 0 ? errors : undefined,
        });
      }

      case 'clear': {
        // Release all inventory reservations for this user (best-effort)
        try {
          await releaseAllUserReservations(env, userId);
        } catch (reservationError) {
          console.error('[Cart Clear] Failed to release reservations, continuing:', reservationError);
        }

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
