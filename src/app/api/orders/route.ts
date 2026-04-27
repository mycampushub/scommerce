import { NextRequest, NextResponse } from 'next/server';
import { createOrderSchema } from '@/lib/validations';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { ProductRepository } from '@/db/product.repository';
import { queryFirst, queryAll, execute, stringifyJSON, numberToBool, boolToNumber } from '@/db/db';
import { csrfMiddleware } from '@/lib/csrf';
import { sanitizeAddressData, sanitizeForDB, sanitizeEmail, sanitizePhone, sanitizeProductData } from '@/lib/sanitize';
import { invalidateCache } from '@/lib/cache';

// Allowed payment methods - Only Cash on Delivery is enabled
const ALLOWED_PAYMENT_METHODS = ['CASH_ON_DELIVERY'] as const;

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

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

    // Sanitize input data
    const sanitized = {
      ...body,
      customerName: sanitizeForDB(body.customerName),
      customerEmail: sanitizeEmail(body.customerEmail),
      customerPhone: sanitizePhone(body.customerPhone),
      shippingAddress: sanitizeAddressData(body.shippingAddress),
      billingAddress: body.billingAddress ? sanitizeAddressData(body.billingAddress) : undefined,
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
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Ensure only COD payment method is accepted
    if (validatedData.paymentMethod && !ALLOWED_PAYMENT_METHODS.includes(validatedData.paymentMethod as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only Cash on Delivery payment method is currently supported',
          allowedMethods: ALLOWED_PAYMENT_METHODS,
        },
        { status: 400 }
      );
    }

    // Check stock availability for all products/variants
    const outOfStockItems: string[] = [];
    for (const item of validatedData.orderItems) {
      if (item.variantId) {
        // Check variant-level stock
        const variant = await queryFirst(
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
        const product = await queryFirst(
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

    // Calculate totals
    const subtotal = validatedData.subtotal;
    const shipping = validatedData.shipping;
    const tax = validatedData.tax;
    const discount = validatedData.discount || 0;
    const total = validatedData.total;

    // Create order with Cash on Delivery as the only payment method
    const order = await OrderRepository.create(env, {
      userId: validatedData.userId || undefined,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone || undefined,
      shippingAddress: stringifyJSON(validatedData.shippingAddress),
      billingAddress: validatedData.billingAddress
        ? stringifyJSON(validatedData.billingAddress)
        : stringifyJSON(validatedData.shippingAddress),
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      paymentMethod: 'CASH_ON_DELIVERY',
    });

    // Create order items
    for (const item of validatedData.orderItems) {
      await OrderRepository.addItem(env, {
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: parseFloat(item.price.toFixed(2)),
        productName: item.productName,
        productImage: item.productImage,
        variantSku: item.variantSku,
        variantSize: item.variantSize,
        variantColor: item.variantColor,
        variantMaterial: item.variantMaterial,
      });
    }

    // Update product/variant stock and generate alerts
    for (const item of validatedData.orderItems) {
      const quantity = item.quantity;

      if (item.variantId) {
        // Update variant-level inventory
        const variant = await queryFirst(
          env,
          'SELECT id, stock, lowStockAlert, reorderLevel, reorderQty FROM product_variants WHERE id = ? LIMIT 1',
          item.variantId
        );

        if (!variant) continue;

        // Update variant stock
        const newStock = variant.stock - quantity;
        await execute(
          env,
          'UPDATE product_variants SET stock = ? WHERE id = ?',
          newStock,
          item.variantId
        );

        // Generate variant-specific alerts
        if (newStock === 0) {
          await execute(
            env,
            'INSERT INTO inventory_alerts (id, variantId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)',
            `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            item.variantId,
            'OUT_OF_STOCK',
            0,
            new Date().toISOString()
          );
        } else if (newStock < variant.reorderLevel) {
          // Check if REORDER_NEEDED alert already exists and is not resolved
          const existingAlert = await queryFirst(
            env,
            'SELECT id FROM inventory_alerts WHERE variantId = ? AND alertType = ? AND isResolved = 0 LIMIT 1',
            item.variantId,
            'REORDER_NEEDED'
          );

          if (!existingAlert) {
            await execute(
              env,
              'INSERT INTO inventory_alerts (id, variantId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)',
              `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              item.variantId,
              'REORDER_NEEDED',
              newStock,
              new Date().toISOString()
            );
          }
        } else if (newStock < variant.lowStockAlert) {
          // Check if LOW_STOCK alert already exists and is not resolved
          const existingAlert = await queryFirst(
            env,
            'SELECT id FROM inventory_alerts WHERE variantId = ? AND alertType = ? AND isResolved = 0 LIMIT 1',
            item.variantId,
            'LOW_STOCK'
          );

          if (!existingAlert) {
            await execute(
              env,
              'INSERT INTO inventory_alerts (id, variantId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)',
              `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              item.variantId,
              'LOW_STOCK',
              newStock,
              new Date().toISOString()
            );
          }
        }
      } else {
        // Update product-level inventory (backward compatibility)
        const product = await queryFirst(
          env,
          'SELECT id, stock, lowStockAlert, reorderLevel, reorderQty FROM products WHERE id = ? LIMIT 1',
          item.productId
        );

        if (!product) continue;

        // Update stock
        const newStock = product.stock - quantity;
        await execute(
          env,
          'UPDATE products SET stock = ? WHERE id = ?',
          newStock,
          item.productId
        );

        // Generate inventory alerts based on new stock level
        if (newStock === 0) {
          await execute(
            env,
            'INSERT INTO inventory_alerts (id, productId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)',
            `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            item.productId,
            'OUT_OF_STOCK',
            0,
            new Date().toISOString()
          );
        } else if (newStock < product.reorderLevel) {
          // Check if REORDER_NEEDED alert already exists and is not resolved
          const existingAlert = await queryFirst(
            env,
            'SELECT id FROM inventory_alerts WHERE productId = ? AND alertType = ? AND isResolved = 0 LIMIT 1',
            item.productId,
            'REORDER_NEEDED'
          );

          if (!existingAlert) {
            await execute(
              env,
              'INSERT INTO inventory_alerts (id, productId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)',
              `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              item.productId,
              'REORDER_NEEDED',
              newStock,
              new Date().toISOString()
            );
          }
        } else if (newStock < product.lowStockAlert) {
          // Check if LOW_STOCK alert already exists and is not resolved
          const existingAlert = await queryFirst(
            env,
            'SELECT id FROM inventory_alerts WHERE productId = ? AND alertType = ? AND isResolved = 0 LIMIT 1',
            item.productId,
            'LOW_STOCK'
          );

          if (!existingAlert) {
            await execute(
              env,
              'INSERT INTO inventory_alerts (id, productId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)',
              `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              item.productId,
              'LOW_STOCK',
              newStock,
              new Date().toISOString()
            );
          }
        }
      }
    }

    // Fetch order with items
    const orderWithItems = await OrderRepository.findById(env, order.id);
    const orderItems = await OrderRepository.getItems(env, order.id);

    const transformedOrder = {
      ...orderWithItems,
      shippingAddress: orderWithItems?.shippingAddress ? JSON.parse(orderWithItems.shippingAddress) : null,
      billingAddress: orderWithItems?.billingAddress ? JSON.parse(orderWithItems.billingAddress) : null,
      orderItems,
    };

    // Invalidate user cart cache if user is logged in
    if (validatedData.userId) {
      await invalidateCache(env, 'user-cart', validatedData.userId);
    }

    return NextResponse.json({
      success: true,
      data: transformedOrder,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');

    // Build WHERE clause
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (userId) {
      conditions.push('userId = ?');
      params.push(userId);
    } else if (email) {
      conditions.push('customerEmail = ?');
      params.push(email);
    } else if (orderNumber) {
      conditions.push('orderNumber = ?');
      params.push(orderNumber);
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

    return NextResponse.json({
      success: true,
      data: ordersWithItems,
      total: ordersWithItems.length,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}
