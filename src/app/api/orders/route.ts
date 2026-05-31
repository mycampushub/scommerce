import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validations';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { ProductRepository } from '@/db/product.repository';
import { queryFirst, queryAll, execute, stringifyJSON, numberToBool, boolToNumber, generateSecureId } from '@/db/db';
import { sanitizeAddressData, sanitizeForDB, sanitizeEmail, sanitizePhone, sanitizeProductData } from '@/lib/sanitize';
import { invalidateCache } from '@/lib/cache';
import { rateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limit';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import { releaseCartReservations } from '@/db/inventory-reservation.repository';
import { incrementPromoUsage } from '@/lib/promotion-validation';
import { logger } from '@/lib/logger';

// Allowed payment methods - validated by Zod schema
const ALLOWED_PAYMENT_METHODS = ['CASH_ON_DELIVERY', 'ONLINE_PAYMENT', 'CARD', 'UPI', 'BANK_TRANSFER'] as const;


export async function POST(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  // Rate limiting: 10 orders per hour per user/IP
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('session')?.value;
  const token = extractTokenFromHeader(authHeader) || cookieToken;
  let userId: string | undefined;
  
  if (token) {
    const payload = await verifyToken(token);
    if (payload && payload.userId) {
      userId = payload.userId;
    }
  }
  
  const ip = getClientIp(request);
  const rateLimitKey = `order-create:${userId || ip}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 10,
    windowMs: 3600000, // 1 hour in milliseconds
  });
  
  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Too many order attempts. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(((rateLimitResult.reset || 0) - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body: any = await request.json() as any;

    // Helper function to sanitize address - handles both standard and checkout formats
    const sanitizeAddress = (address: unknown) => {
      if (typeof address === 'string') {
        return sanitizeForDB(address);
      }
      if (typeof address === 'object' && address !== null) {
        const addr = address as Record<string, unknown>;

        // Check if it's the checkout format (has 'address' field)
        if ('address' in addr) {
          // Checkout format - sanitize individual fields
          const sanitized: Record<string, unknown> = {};
          if (addr.address) sanitized.address = sanitizeForDB(String(addr.address));
          if (addr.city) sanitized.city = sanitizeForDB(String(addr.city));
          if (addr.district) sanitized.district = sanitizeForDB(String(addr.district));
          if (addr.division) sanitized.division = sanitizeForDB(String(addr.division));
          if (addr.zipCode) sanitized.zipCode = sanitizeForDB(String(addr.zipCode));
          if (addr.country) sanitized.country = sanitizeForDB(String(addr.country));
          // Filter out empty strings to avoid validation errors
          Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === '') {
              delete sanitized[key];
            }
          });
          return sanitized;
        } else {
          // Standard format - use existing sanitization
          return sanitizeAddressData(addr);
        }
      }
      return '';
    };

    // Sanitize input data
    const sanitized = {
      ...body,
      customerName: sanitizeForDB(body.customerName),
      customerEmail: sanitizeEmail(body.customerEmail),
      customerPhone: body.customerPhone ? sanitizePhone(body.customerPhone) : undefined,
      shippingAddress: sanitizeAddress(body.shippingAddress),
      billingAddress: body.billingAddress ? sanitizeAddress(body.billingAddress) : undefined,
      orderItems: body.orderItems?.map((item: any) => ({
        productId: item.productId,
        productName: sanitizeForDB(item.productName),
        productImage: item.productImage,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        variantId: item.variantId,
        variantSku: item.variantSku ? sanitizeForDB(item.variantSku) : undefined,
        variantSize: item.variantSize ? sanitizeForDB(item.variantSize) : undefined,
        variantColor: item.variantColor ? sanitizeForDB(item.variantColor) : undefined,
        variantMaterial: item.variantMaterial ? sanitizeForDB(item.variantMaterial) : undefined,
      })) || [],
    };

    // Validate using Zod schema
    const validation = createOrderSchema.safeParse(sanitized);
    if (!validation.success) {
      // Return the first validation error with more context
      const firstError = validation.error.issues[0];

      // Log detailed validation errors for debugging
      logger.warn('Order validation failed', {
        issues: validation.error.issues,
        field: firstError.path.join('.')
      });

      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path.join('.'),
          details: process.env.NODE_ENV === 'development' ? validation.error.issues : undefined,
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    logger.info('Received order request', {
      email: sanitized.customerEmail,
      itemCount: sanitized.orderItems?.length,
      total: validatedData.total
    });

    // Ensure valid payment method
    if (validatedData.paymentMethod && !ALLOWED_PAYMENT_METHODS.includes(validatedData.paymentMethod as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment method. Please select a valid payment option.',
          allowedMethods: ALLOWED_PAYMENT_METHODS,
        },
        { status: 400 }
      );
    }

    // Check stock availability for all products/variants
    const outOfStockItems: string[] = [];
    for (const item of validatedData.orderItems as any[]) {
      if (item.variantId) {
        // Check variant-level stock
        const variant = await queryFirst<{ stock: number; isActive: number; lowStockAlert: number; reorderLevel: number; reorderQty: number }>(
          env,
          'SELECT id, sku, stock, isActive, lowStockAlert, reorderLevel, reorderQty FROM product_variants WHERE id = ? LIMIT 1',
          item.variantId
        );

        if (!variant) {
          return NextResponse.json(
            {
              success: false,
              error: `Variant ${item.variantSku || item.variantId} not found`,
            },
            { status: 404 }
          );
        }

        if (!numberToBool(variant.isActive as number)) {
          return NextResponse.json(
            {
              success: false,
              error: `Variant ${item.variantSku} is not available`,
            },
            { status: 400 }
          );
        }

        if (variant.stock < item.quantity) {
          outOfStockItems.push(`${item.productName} (${item.variantSku || item.variantSize || item.variantColor})`);
        }
      } else {
        // Check product-level stock (backward compatibility)
        const product = await queryFirst<{ stock: number; isActive: number; lowStockAlert: number; reorderLevel: number; reorderQty: number; name: string }>(
          env,
          'SELECT id, name, stock, isActive, lowStockAlert, reorderLevel, reorderQty FROM products WHERE id = ? LIMIT 1',
          item.productId
        );

        if (!product) {
          return NextResponse.json(
            {
              success: false,
              error: `Product ${item.productId} not found`,
            },
            { status: 404 }
          );
        }

        if (!numberToBool(product.isActive as number)) {
          return NextResponse.json(
            {
              success: false,
              error: `Product ${product.name} is not available`,
            },
            { status: 400 }
          );
        }

        if (product.stock < item.quantity) {
          outOfStockItems.push(product.name as string);
        }
      }
    }

    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient stock for: ${outOfStockItems.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Server-side price validation to prevent client-side tampering
    // Fetch actual prices from database and validate against client prices
    const priceMismatchItems: string[] = [];
    const validatedOrderItems: any[] = [];

    for (const item of validatedData.orderItems as any[]) {
      let actualPrice: number;
      let actualName: string;

      if (item.variantId) {
        // Get variant price from database
        const variant = await queryFirst<{ price: number; comparePrice: number | null; name: string }>(
          env,
          'SELECT v.price, v.comparePrice, p.name FROM product_variants v JOIN products p ON v.productId = p.id WHERE v.id = ? LIMIT 1',
          item.variantId
        );

        if (!variant) {
          return NextResponse.json(
            {
              success: false,
              error: `Variant ${item.variantSku || item.variantId} not found`,
            },
            { status: 404 }
          );
        }

        actualPrice = variant.comparePrice || variant.price;
        actualName = variant.name || item.productName;
      } else {
        // Get product price from database
        const product = await queryFirst<{ price: number; basePrice: number; comparePrice: number | null; discount: number; name: string }>(
          env,
          'SELECT price, basePrice, comparePrice, discount, name FROM products WHERE id = ? LIMIT 1',
          item.productId
        );

        if (!product) {
          return NextResponse.json(
            {
              success: false,
              error: `Product ${item.productId} not found`,
            },
            { status: 404 }
          );
        }

        actualPrice = product.comparePrice || product.basePrice || product.price;
        actualName = product.name || item.productName;
      }

      // Convert to number and compare with small tolerance for floating point
      const clientPrice = parseFloat(String(item.price));
      const serverPrice = parseFloat(String(actualPrice));

      // Allow small floating point differences (0.01 tolerance)
      if (Math.abs(clientPrice - serverPrice) > 0.01) {
        priceMismatchItems.push(`${actualName} (expected: ${serverPrice}, got: ${clientPrice})`);
      }

      // Use server-side price for order creation
      validatedOrderItems.push({
        ...item,
        price: serverPrice,
        productName: actualName,
      });
    }

    if (priceMismatchItems.length > 0) {
      logger.warn('Price mismatch detected', { 
        items: priceMismatchItems,
        email: validatedData.customerEmail 
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Price mismatch detected. Please refresh the page and try again.',
          details: priceMismatchItems,
        },
        { status: 400 }
      );
    }

    // Recalculate totals based on validated prices
    const recalculatedSubtotal = validatedOrderItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Validate totals match (with small tolerance)
    const clientSubtotal = parseFloat(String(validatedData.subtotal));
    const tolerance = 0.01;

    if (Math.abs(recalculatedSubtotal - clientSubtotal) > tolerance) {
      logger.warn('Order total mismatch', { 
        recalculated: recalculatedSubtotal,
        client: clientSubtotal,
        email: validatedData.customerEmail 
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Order total mismatch. Please refresh the page and try again.',
          expectedTotal: recalculatedSubtotal,
        },
        { status: 400 }
      );
    }

    // Calculate totals (use validated data)
    const shipping = validatedData.shipping;
    const tax = validatedData.tax;
    const discount = validatedData.discount || 0;
    const total = validatedData.total;

    // Extract structured address fields for order-level columns
    const extractAddressField = (address: unknown, field: string): string | undefined => {
      if (typeof address === 'object' && address !== null) {
        return (address as Record<string, unknown>)[field] as string | undefined;
      }
      return undefined;
    };

    // Create order with items and stock updates in a transaction
    // This ensures atomicity - either all operations succeed or none do
    logger.info('Starting order creation', { 
      email: validatedData.customerEmail,
      itemCount: validatedOrderItems.length,
      total 
    });
    const orderResult = await OrderRepository.createOrderWithItems(
      env,
      {
        userId: validatedData.userId || undefined,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone || undefined,
        shippingAddress: stringifyJSON(validatedData.shippingAddress),
        billingAddress: validatedData.billingAddress
          ? stringifyJSON(validatedData.billingAddress)
          : stringifyJSON(validatedData.shippingAddress),
        city: extractAddressField(validatedData.shippingAddress, 'city') || extractAddressField(validatedData.shippingAddress, 'district'),
        district: extractAddressField(validatedData.shippingAddress, 'district'),
        division: extractAddressField(validatedData.shippingAddress, 'division') || extractAddressField(validatedData.shippingAddress, 'state'),
        subtotal: parseFloat(recalculatedSubtotal.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        paymentMethod: validatedData.paymentMethod,
        promoCode: validatedData.promoCode,
      },
      validatedOrderItems as any[],
      validatedData.userId
    );

    // If transaction failed, return error
    if (!orderResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create order. Please try again.',
        },
        { status: 500 }
      );
    }

    const { order } = orderResult;

    logger.info('Order created successfully', {
      orderId: order?.id,
      orderNumber: order?.orderNumber,
      email: validatedData.customerEmail,
      total
    });

    // Release stock reservations for this order (outside transaction - non-critical)
    if (validatedData.userId) {
      try {
        await releaseCartReservations(env, validatedData.userId, validatedOrderItems);
      } catch (error) {
        logger.error('Failed to release cart reservations', { 
          error,
          userId: validatedData.userId,
          orderId: order?.id 
        });
        // Continue even if reservation release fails
      }
    }

    // Increment promo code usage if promo code was used (outside transaction - non-critical)
    if (validatedData.promoCode) {
      try {
        await incrementPromoUsage(env, validatedData.promoCode);
      } catch (error) {
        logger.error('Failed to increment promo usage', { 
          error,
          promoCode: validatedData.promoCode,
          orderId: order?.id 
        });
        // Continue even if promo usage increment fails
      }
    }

    // Invalidate user cart cache if user is logged in (outside transaction - non-critical)
    if (validatedData.userId) {
      try {
        await invalidateCache(env, 'user-cart', validatedData.userId);
      } catch (error) {
        logger.error('Failed to invalidate cart cache', {
          error,
          userId: validatedData.userId
        });
        // Continue even if cache invalidation fails
      }

      // Clear user's cart from database after successful order
      try {
        const { CartRepository } = await import('@/db/cart.repository');
        const { releaseAllUserReservations } = await import('@/db/inventory-reservation.repository');

        // Release all inventory reservations
        await releaseAllUserReservations(env, validatedData.userId);

        // Clear cart from database
        await CartRepository.clearCart(env, validatedData.userId);
        logger.info('Cart cleared successfully after order', { userId: validatedData.userId, orderId: order?.id });
      } catch (error) {
        logger.error('Failed to clear user cart after order', {
          error,
          userId: validatedData.userId,
          orderId: order?.id
        });
        // Don't fail the order if cart clearing fails
      }
    }

    // Prepare transformed order response
    const transformedOrder = {
      ...order,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
      billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : null,
      orderItems: orderResult.items,
    };

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: 'Order created successfully',
    });
  } catch (error) {
    logger.error('Failed to create order', { 
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });

    // Return detailed error in development
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to create order: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  // ============================================
  // AUTHENTICATION - REQUIRED FOR ORDER LOOKUP
  // ============================================
  
  // Get authentication token
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('session')?.value;
  const token = extractTokenFromHeader(authHeader) || cookieToken;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required to view orders' },
      { status: 401 }
    );
  }

  // Verify token and get user info
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  }

  const authenticatedUserId = payload.userId;
  const authenticatedEmail = payload.email;

  // Check if user is admin
  const isAdmin = payload.role === 'admin' || payload.role === 'staff';

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');

    // Build WHERE clause with authentication checks
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (userId) {
      // For userId-based lookup, verify permission
      if (!isAdmin && userId !== authenticatedUserId) {
        return NextResponse.json(
          { success: false, error: 'You can only view your own orders' },
          { status: 403 }
        );
      }
      conditions.push('userId = ?');
      params.push(userId);
    } else if (email) {
      // For email-based lookup, verify permission
      // Only admin can lookup by arbitrary email, users can only lookup their own email
      if (!isAdmin && email !== authenticatedEmail) {
        return NextResponse.json(
          { success: false, error: 'You can only view orders for your own email address' },
          { status: 403 }
        );
      }
      conditions.push('customerEmail = ?');
      params.push(email);
    } else if (orderNumber) {
      // For orderNumber-based lookup, fetch order first to verify ownership
      const orderToCheck = await queryFirst(
        env,
        'SELECT id, userId, customerEmail FROM orders WHERE orderNumber = ? LIMIT 1',
        orderNumber
      );

      if (!orderToCheck) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
        });
      }

      // Verify ownership (admin can view any order)
      const orderUserId = (orderToCheck as any).userId;
      const orderEmail = (orderToCheck as any).customerEmail;

      if (!isAdmin && orderUserId !== authenticatedUserId && orderEmail !== authenticatedEmail) {
        return NextResponse.json(
          { success: false, error: 'Order not found or access denied' },
          { status: 404 }
        );
      }

      conditions.push('orderNumber = ?');
      params.push(orderNumber);
    } else {
      // If no filter provided, return orders for authenticated user
      if (isAdmin) {
        // Admins can see all orders (no filter, but should probably paginate)
        // For now, return empty if no filter to prevent unbounded queries
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          message: 'Please provide userId, email, or orderNumber filter',
        });
      } else {
        // Regular users can only see their own orders
        conditions.push('userId = ?');
        params.push(authenticatedUserId);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch orders
    const { queryAll } = await import('@/db/db');
    const orders = await queryAll(
      env,
      `SELECT * FROM orders ${whereClause} ORDER BY createdAt DESC`,
      ...params
    );

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
      const orderItems = await OrderRepository.getItems(env, order.id);
      return {
        ...order,
        shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
        billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : null,
        orderItems,
      };
    }));

    const response = NextResponse.json({
      success: true,
      data: ordersWithItems,
      total: ordersWithItems.length,
    });

    // Add caching headers for orders (user-specific - 2 minutes, private)
    return addCacheHeaders(response, CachePresets.PRIVATE);
  } catch (error) {
    logger.error('Failed to fetch orders', { 
      error,
      userId: authenticatedUserId 
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        data: [], // Return empty array on error for consistent frontend handling
      },
      { status: 500 }
    );
  }
}
