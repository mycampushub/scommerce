import { Env, Order, OrderItem, OrderStatus, PaymentStatus, TrackingStatus } from '@/db/types';
import { generateId, generateOrderNumber, boolToNumber, now, queryFirst, queryAll, execute, buildPaginationClause, generateSecureId } from '@/db/db';
import prisma from '@/lib/database';
import { runTransaction } from '@/lib/transaction';

export class OrderRepository {
  /**
   * Find order by order number
   */
  static async findByOrderNumber(env: Env | null, orderNumber: string): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const order = await prisma.orders.findUnique({
        where: { orderNumber }
      });
      return order as Order | null;
    }

    return queryFirst<Order>(
      env,
      'SELECT * FROM orders WHERE orderNumber = ? LIMIT 1',
      orderNumber
    );
  }

  /**
   * Find order by ID
   */
  static async findById(env: Env | null, id: string): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const order = await prisma.orders.findUnique({
        where: { id }
      });
      return order as Order | null;
    }

    return queryFirst<Order>(
      env,
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Get orders by user ID
   */
  static async findByUserId(
    env: Env | null,
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Order[]> {
    const { limit = 20, offset = 0 } = options;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const orders = await prisma.orders.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      return orders as unknown as Order[];
    }

    return queryAll<Order>(
      env,
      'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      userId,
      limit,
      offset
    );
  }

  /**
   * Create new order
   */
  static async create(env: Env | null, data: {
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress: string;
    billingAddress?: string;
    city?: string;
    district?: string;
    division?: string;
    subtotal: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    total: number;
    paymentMethod?: string;
    promoCode?: string;
  }): Promise<Order> {
    const id = generateId();
    const orderNumber = generateOrderNumber();
    const currentTime = now();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    try {
      if (!env || !env.DB) {
        const order = await prisma.orders.create({
          data: {
            id,
            orderNumber,
            userId: data.userId || null,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone || null,
            shippingAddress: data.shippingAddress,
            billingAddress: data.billingAddress || null,
            city: data.city || null,
            district: data.district || null,
            division: data.division || null,
            subtotal: data.subtotal,
            shipping: data.shipping || 0,
            tax: data.tax || 0,
            discount: data.discount || 0,
            total: data.total,
            status: 'PENDING' as OrderStatus,
            paymentStatus: 'PENDING' as PaymentStatus,
            paymentMethod: data.paymentMethod || null,
            promoCode: data.promoCode || null,
            trackingStatus: 'PENDING' as TrackingStatus,
            createdAt: currentTime,
            updatedAt: currentTime
          }
        });
        return order as unknown as Order;
      }

      // Build SQL dynamically with correct number of placeholders
      const columns = [
        'id', 'orderNumber', 'userId', 'customerName', 'customerEmail', 'customerPhone',
        'shippingAddress', 'billingAddress', 'city', 'district', 'division',
        'subtotal', 'shipping', 'tax', 'discount', 'total',
        'status', 'paymentStatus', 'paymentMethod', 'promoCode', 'trackingStatus',
        'createdAt', 'updatedAt'
      ];

      const placeholders = columns.map(() => '?').join(', ');
      const values = [
        id,
        orderNumber,
        data.userId || null,
        data.customerName,
        data.customerEmail,
        data.customerPhone || null,
        data.shippingAddress,
        data.billingAddress || null,
        data.city || null,
        data.district || null,
        data.division || null,
        data.subtotal,
        data.shipping || 0,
        data.tax || 0,
        data.discount || 0,
        data.total,
        'PENDING',
        'PENDING',
        data.paymentMethod || null,
        data.promoCode || null,
        'PENDING',
        currentTime,
        currentTime
      ];

      const sql = `INSERT INTO orders (${columns.join(', ')}) VALUES (${placeholders})`;

      await execute(env, sql, ...values);

      return (await this.findById(env, id))!;
    } catch (error) {
      console.error('[OrderRepository.create] Error:', error);
      console.error('[OrderRepository.create] Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateStatus(env: Env | null, id: string, status: OrderStatus): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.orders.update({
        where: { id },
        data: { status, updatedAt: now() }
      });
      return this.findById(env, id);
    }

    await execute(
      env,
      'UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?',
      status,
      now(),
      id
    );
    return this.findById(env, id);
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(env: Env | null, id: string, paymentStatus: PaymentStatus): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.orders.update({
        where: { id },
        data: { paymentStatus, updatedAt: now() }
      });
      return this.findById(env, id);
    }

    await execute(
      env,
      'UPDATE orders SET paymentStatus = ?, updatedAt = ? WHERE id = ?',
      paymentStatus,
      now(),
      id
    );
    return this.findById(env, id);
  }

  /**
   * Update tracking
   */
  static async updateTracking(
    env: Env | null,
    id: string,
    trackingNumber: string,
    trackingStatus: TrackingStatus
  ): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.orders.update({
        where: { id },
        data: { trackingNumber, trackingStatus, updatedAt: now() }
      });
      return this.findById(env, id);
    }

    await execute(
      env,
      'UPDATE orders SET trackingNumber = ?, trackingStatus = ?, updatedAt = ? WHERE id = ?',
      trackingNumber,
      trackingStatus,
      now(),
      id
    );
    return this.findById(env, id);
  }

  /**
   * Cancel order
   */
  static async cancel(env: Env | null, id: string, cancelledBy: string, reason?: string): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.orders.update({
        where: { id },
        data: {
          status: 'CANCELLED' as OrderStatus,
          cancelledAt: now(),
          cancelledBy,
          cancellationReason: reason || null,
          updatedAt: now()
        }
      });
      return this.findById(env, id);
    }

    await execute(
      env,
      `UPDATE orders SET status = 'CANCELLED', cancelledAt = ?, cancelledBy = ?,
       cancellationReason = ?, updatedAt = ? WHERE id = ?`,
      now(),
      cancelledBy,
      reason || null,
      now(),
      id
    );
    return this.findById(env, id);
  }

  /**
   * Refund order
   */
  static async refund(
    env: Env | null,
    id: string,
    amount: number,
    method: string,
    reason?: string
  ): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.orders.update({
        where: { id },
        data: {
          status: 'REFUNDED' as OrderStatus,
          paymentStatus: 'REFUNDED' as PaymentStatus,
          refundedAt: now(),
          refundedAmount: amount,
          refundMethod: method,
          refundReason: reason || null,
          updatedAt: now()
        }
      });
      return this.findById(env, id);
    }

    await execute(
      env,
      `UPDATE orders SET status = 'REFUNDED', paymentStatus = 'REFUNDED',
       refundedAt = ?, refundedAmount = ?, refundMethod = ?, refundReason = ?,
       updatedAt = ? WHERE id = ?`,
      now(),
      amount,
      method,
      reason || null,
      now(),
      id
    );
    return this.findById(env, id);
  }

  /**
   * Get all orders (admin view)
   */
  static async findAll(
    env: Env | null,
    options: {
      limit?: number;
      offset?: number;
      status?: OrderStatus;
      email?: string;
    } = {}
  ): Promise<Order[]> {
    const { limit = 50, offset = 0, status, email } = options;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const where: any = {};
      if (status) where.status = status;
      if (email) where.customerEmail = email;

      const orders = await prisma.orders.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      return orders as unknown as Order[];
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (email) {
      conditions.push('customerEmail = ?');
      params.push(email);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return queryAll<Order>(
      env,
      `SELECT * FROM orders ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
  }

  /**
   * Count orders
   */
  static async count(env: Env | null, status?: OrderStatus): Promise<number> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const where: any = {};
      if (status) where.status = status;

      return await prisma.orders.count({ where });
    }

    const whereClause = status ? 'WHERE status = ?' : '';
    const result = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM orders ${whereClause}`,
      ...(status ? [status] : [])
    );
    return result?.count || 0;
  }

  // Order Items
  /**
   * Get items for an order
   */
  static async getItems(env: Env | null, orderId: string): Promise<OrderItem[]> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const items = await prisma.order_items.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' }
      });
      return items as unknown as OrderItem[];
    }

    return queryAll<OrderItem>(
      env,
      'SELECT * FROM order_items WHERE orderId = ? ORDER BY createdAt ASC',
      orderId
    );
  }

  /**
   * Add item to order
   */
  static async addItem(env: Env | null, data: {
    orderId: string;
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    productName: string;
    productImage?: string;
    variantSku?: string;
    variantSize?: string;
    variantColor?: string;
    variantMaterial?: string;
  }): Promise<OrderItem> {
    const id = generateId();
    const currentTime = now();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const item = await prisma.order_items.create({
        data: {
          id,
          orderId: data.orderId,
          productId: data.productId,
          variantId: data.variantId || null,
          quantity: data.quantity,
          price: data.price,
          productName: data.productName,
          productImage: data.productImage || null,
          variantSku: data.variantSku || null,
          variantSize: data.variantSize || null,
          variantColor: data.variantColor || null,
          variantMaterial: data.variantMaterial || null,
          createdAt: currentTime
        }
      });
      return item as unknown as OrderItem;
    }

    await execute(
      env,
      `INSERT INTO order_items (id, orderId, productId, variantId, quantity, price,
       productName, productImage, variantSku, variantSize, variantColor, variantMaterial, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.orderId,
      data.productId,
      data.variantId || null,
      data.quantity,
      data.price,
      data.productName,
      data.productImage || null,
      data.variantSku || null,
      data.variantSize || null,
      data.variantColor || null,
      data.variantMaterial || null,
      currentTime
    );

    return (await queryFirst<OrderItem>(
      env,
      'SELECT * FROM order_items WHERE id = ? LIMIT 1',
      id
    ))!;
  }

  /**
   * Archive old completed orders
   * Archives orders that are DELIVERED/COMPLETED and older than specified days
   */
  static async archiveOldOrders(env: Env | null, olderThanDays: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffDateStr = cutoffDate.toISOString();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const result = await prisma.orders.updateMany({
        where: {
          status: { in: ['DELIVERED', 'COMPLETED'] as OrderStatus[] },
          createdAt: { lt: cutoffDateStr },
          deletedAt: null // Only archive non-deleted orders
        },
        data: {
          deletedAt: cutoffDateStr,
          deletedBy: 'system',
          deletedReason: `Archived (older than ${olderThanDays} days)`,
          updatedAt: now()
        }
      });
      return result.count;
    }

    const result = await execute(
      env,
      `UPDATE orders
       SET deletedAt = ?, deletedBy = 'system', deletedReason = ?, updatedAt = ?
       WHERE status IN ('DELIVERED', 'COMPLETED')
       AND createdAt < ?
       AND deletedAt IS NULL`,
      cutoffDateStr,
      `Archived (older than ${olderThanDays} days)`,
      now(),
      cutoffDateStr
    );

    // Get count by querying archived orders
    const archivedCountResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM orders
       WHERE deletedAt = ? AND deletedBy = 'system' AND deletedReason = ?`,
      cutoffDateStr,
      `Archived (older than ${olderThanDays} days)`
    );
    return archivedCountResult?.count || 0;
  }

  /**
   * Permanently delete soft-deleted orders
   * Permanently removes orders that were deleted/archived older than specified days
   */
  static async cleanupDeletedOrders(env: Env | null, olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffDateStr = cutoffDate.toISOString();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const orders = await prisma.orders.findMany({
        where: {
          deletedAt: { lt: cutoffDateStr }
        },
        select: { id: true }
      });

      const orderIds = orders.map(o => o.id);

      if (orderIds.length === 0) return 0;

      // Delete order items first
      await prisma.order_items.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // Delete orders
      const result = await prisma.orders.deleteMany({
        where: { id: { in: orderIds } }
      });

      return result.count;
    }

    // Get order IDs to delete
    const orders = await queryAll<{ id: string }>(
      env,
      'SELECT id FROM orders WHERE deletedAt < ?',
      cutoffDateStr
    );

    if (!orders || orders.length === 0) return 0;

    const orderIds = orders.map(o => o.id);
    const count = orderIds.length;

    // Delete order items first (FK constraint might be RESTRICT)
    await execute(
      env,
      `DELETE FROM order_items WHERE orderId IN (${orderIds.map(() => '?').join(',')})`,
      ...orderIds
    );

    // Delete orders
    await execute(
      env,
      `DELETE FROM orders WHERE id IN (${orderIds.map(() => '?').join(',')})`,
      ...orderIds
    );

    return count;
  }

  /**
   * Get archived orders count
   */
  static async getArchivedCount(env: Env | null): Promise<number> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      return await prisma.orders.count({
        where: { deletedAt: { not: null } }
      });
    }

    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM orders WHERE deletedAt IS NOT NULL'
    );
    return result?.count || 0;
  }

  /**
   * Create order with items and stock updates in a transaction
   * This ensures atomicity - either all operations succeed or none do
   */
  static async createOrderWithItems(
    env: Env | null,
    orderData: {
      userId?: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      shippingAddress: string;
      billingAddress?: string;
      city?: string;
      district?: string;
      division?: string;
      subtotal: number;
      shipping: number;
      tax: number;
      discount: number;
      total: number;
      paymentMethod?: string;
      promoCode?: string;
    },
    orderItems: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      productName: string;
      productImage?: string;
      variantSku?: string;
      variantSize?: string;
      variantColor?: string;
      variantMaterial?: string;
    }>,
    userId?: string
  ): Promise<{ order: Order; items: OrderItem[] } | null> {
    const result = await runTransaction(async (db, commit, rollback) => {
      try {
        const id = generateId();
        const orderNumber = generateOrderNumber();
        const currentTime = now();

        // Check if using Prisma transaction
        const isPrisma = !env || !env.DB;

        // Create order
        let order: Order;
        if (isPrisma) {
          order = await db.orders.create({
            data: {
              id,
              orderNumber,
              userId: orderData.userId || null,
              customerName: orderData.customerName,
              customerEmail: orderData.customerEmail,
              customerPhone: orderData.customerPhone || null,
              shippingAddress: orderData.shippingAddress,
              billingAddress: orderData.billingAddress || null,
              city: orderData.city || null,
              district: orderData.district || null,
              division: orderData.division || null,
              subtotal: orderData.subtotal,
              shipping: orderData.shipping,
              tax: orderData.tax,
              discount: orderData.discount,
              total: orderData.total,
              status: 'PENDING' as OrderStatus,
              paymentStatus: 'PENDING' as PaymentStatus,
              paymentMethod: orderData.paymentMethod || null,
              promoCode: orderData.promoCode || null,
              trackingStatus: 'PENDING' as TrackingStatus,
              createdAt: currentTime,
              updatedAt: currentTime,
            }
          });
          order = order as unknown as Order;
        } else {
          // D1 transaction
          const columns = [
            'id', 'orderNumber', 'userId', 'customerName', 'customerEmail', 'customerPhone',
            'shippingAddress', 'billingAddress', 'city', 'district', 'division',
            'subtotal', 'shipping', 'tax', 'discount', 'total',
            'status', 'paymentStatus', 'paymentMethod', 'promoCode', 'trackingStatus',
            'createdAt', 'updatedAt'
          ];

          const placeholders = columns.map(() => '?').join(', ');
          const values = [
            id, orderNumber, orderData.userId || null, orderData.customerName, orderData.customerEmail,
            orderData.customerPhone || null, orderData.shippingAddress, orderData.billingAddress || null,
            orderData.city || null, orderData.district || null, orderData.division || null,
            orderData.subtotal, orderData.shipping, orderData.tax, orderData.discount, orderData.total,
            'PENDING', 'PENDING', orderData.paymentMethod || null, orderData.promoCode || null,
            'PENDING', currentTime, currentTime
          ];

          const sql = `INSERT INTO orders (${columns.join(', ')}) VALUES (${placeholders})`;
          const stmt = db.prepare(sql).bind(values);
          await stmt.run();

          // Fetch the created order
          const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind([id]);
          const orderResult = await orderStmt.first();
          order = orderResult as Order;
        }

        // Create order items and update stock
        const items: OrderItem[] = [];
        for (const item of orderItems) {
          const itemId = generateId();
          const itemTime = now();

          // Create order item
          if (isPrisma) {
            const createdItem = await db.order_items.create({
              data: {
                id: itemId,
                orderId: order.id,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                price: item.price,
                productName: item.productName,
                productImage: item.productImage || null,
                variantSku: item.variantSku || null,
                variantSize: item.variantSize || null,
                variantColor: item.variantColor || null,
                variantMaterial: item.variantMaterial || null,
                createdAt: itemTime
              }
            });
            items.push(createdItem as unknown as OrderItem);
          } else {
            const itemColumns = [
              'id', 'orderId', 'productId', 'variantId', 'quantity', 'price',
              'productName', 'productImage', 'variantSku', 'variantSize', 'variantColor',
              'variantMaterial', 'createdAt'
            ];
            const itemPlaceholders = itemColumns.map(() => '?').join(', ');
            const itemValues = [
              itemId, order.id, item.productId, item.variantId || null, item.quantity,
              item.price, item.productName, item.productImage || null, item.variantSku || null,
              item.variantSize || null, item.variantColor || null, item.variantMaterial || null,
              itemTime
            ];

            const itemSql = `INSERT INTO order_items (${itemColumns.join(', ')}) VALUES (${itemPlaceholders})`;
            const itemStmt = db.prepare(itemSql).bind(itemValues);
            await itemStmt.run();

            // Fetch the created item
            const fetchItemStmt = db.prepare('SELECT * FROM order_items WHERE id = ? LIMIT 1').bind([itemId]);
            const fetchedItem = await fetchItemStmt.first();
            items.push(fetchedItem as OrderItem);
          }

          // Update stock and generate alerts
          if (item.variantId) {
            // Update variant stock
            if (isPrisma) {
              const variant = await db.product_variants.findUnique({
                where: { id: item.variantId },
                select: { stock: true, lowStockAlert: true, reorderLevel: true }
              });

              if (variant) {
                const newStock = Math.max(0, variant.stock - item.quantity);
                await db.product_variants.update({
                  where: { id: item.variantId },
                  data: { stock: newStock }
                });

                // Generate alerts
                if (newStock === 0 || newStock < variant.reorderLevel || newStock < variant.lowStockAlert) {
                  const existingAlert = await db.inventory_alerts.findFirst({
                    where: {
                      variantId: item.variantId,
                      alertType: newStock === 0 ? 'OUT_OF_STOCK' :
                               newStock < variant.reorderLevel ? 'REORDER_NEEDED' : 'LOW_STOCK',
                      isResolved: 0
                    }
                  });

                  if (!existingAlert) {
                    await db.inventory_alerts.create({
                      data: {
                        id: generateSecureId(),
                        variantId: item.variantId,
                        alertType: newStock === 0 ? 'OUT_OF_STOCK' :
                                 newStock < variant.reorderLevel ? 'REORDER_NEEDED' : 'LOW_STOCK',
                        quantity: newStock,
                        isRead: 0,
                        isResolved: 0,
                        createdAt: new Date().toISOString()
                      }
                    });
                  }
                }
              }
            } else {
              // D1 variant stock update
              const variantStmt = db.prepare(
                'SELECT id, stock, lowStockAlert, reorderLevel FROM product_variants WHERE id = ? LIMIT 1'
              ).bind([item.variantId]);
              const variant = await variantStmt.first() as { stock: number; lowStockAlert: number; reorderLevel: number } | null;

              if (variant) {
                const newStock = Math.max(0, variant.stock - item.quantity);
                const updateStockStmt = db.prepare(
                  'UPDATE product_variants SET stock = ? WHERE id = ?'
                ).bind([newStock, item.variantId]);
                await updateStockStmt.run();

                // Generate alerts
                const alertType = newStock === 0 ? 'OUT_OF_STOCK' :
                                  newStock < variant.reorderLevel ? 'REORDER_NEEDED' : 'LOW_STOCK';

                const existingAlertStmt = db.prepare(
                  'SELECT id FROM inventory_alerts WHERE variantId = ? AND alertType = ? AND isResolved = 0 LIMIT 1'
                ).bind([item.variantId, alertType]);
                const existingAlert = await existingAlertStmt.first();

                if (!existingAlert) {
                  const createAlertStmt = db.prepare(
                    'INSERT INTO inventory_alerts (id, variantId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)'
                  ).bind([generateSecureId(), item.variantId, alertType, newStock, new Date().toISOString()]);
                  await createAlertStmt.run();
                }
              }
            }
          } else {
            // Update product stock
            if (isPrisma) {
              const product = await db.products.findUnique({
                where: { id: item.productId },
                select: { stock: true, lowStockAlert: true, reorderLevel: true }
              });

              if (product) {
                const newStock = Math.max(0, product.stock - item.quantity);
                await db.products.update({
                  where: { id: item.productId },
                  data: { stock: newStock }
                });

                // Generate alerts
                if (newStock === 0 || newStock < product.reorderLevel || newStock < product.lowStockAlert) {
                  const existingAlert = await db.inventory_alerts.findFirst({
                    where: {
                      productId: item.productId,
                      alertType: newStock === 0 ? 'OUT_OF_STOCK' :
                               newStock < product.reorderLevel ? 'REORDER_NEEDED' : 'LOW_STOCK',
                      isResolved: 0
                    }
                  });

                  if (!existingAlert) {
                    await db.inventory_alerts.create({
                      data: {
                        id: generateSecureId(),
                        productId: item.productId,
                        alertType: newStock === 0 ? 'OUT_OF_STOCK' :
                                 newStock < product.reorderLevel ? 'REORDER_NEEDED' : 'LOW_STOCK',
                        quantity: newStock,
                        isRead: 0,
                        isResolved: 0,
                        createdAt: new Date().toISOString()
                      }
                    });
                  }
                }
              }
            } else {
              // D1 product stock update
              const productStmt = db.prepare(
                'SELECT id, stock, lowStockAlert, reorderLevel FROM products WHERE id = ? LIMIT 1'
              ).bind([item.productId]);
              const product = await productStmt.first() as { stock: number; lowStockAlert: number; reorderLevel: number } | null;

              if (product) {
                const newStock = Math.max(0, product.stock - item.quantity);
                const updateStockStmt = db.prepare(
                  'UPDATE products SET stock = ? WHERE id = ?'
                ).bind([newStock, item.productId]);
                await updateStockStmt.run();

                // Generate alerts
                const alertType = newStock === 0 ? 'OUT_OF_STOCK' :
                                  newStock < product.reorderLevel ? 'REORDER_NEEDED' : 'LOW_STOCK';

                const existingAlertStmt = db.prepare(
                  'SELECT id FROM inventory_alerts WHERE productId = ? AND alertType = ? AND isResolved = 0 LIMIT 1'
                ).bind([item.productId, alertType]);
                const existingAlert = await existingAlertStmt.first();

                if (!existingAlert) {
                  const createAlertStmt = db.prepare(
                    'INSERT INTO inventory_alerts (id, productId, alertType, quantity, isRead, isResolved, createdAt) VALUES (?, ?, ?, ?, 0, 0, ?)'
                  ).bind([generateSecureId(), item.productId, alertType, newStock, new Date().toISOString()]);
                  await createAlertStmt.run();
                }
              }
            }
          }
        }

        // Consume inventory reservations (delete them since stock was already deducted)
        // This prevents reservations from expiring and causing issues
        if (orderData.userId) {
          if (isPrisma) {
            // Delete all reservations for this user's order items
            for (const item of orderItems) {
              if (item.variantId) {
                await db.inventory_reservations.deleteMany({
                  where: {
                    userId: orderData.userId,
                    variantId: item.variantId
                  }
                });
              } else {
                await db.inventory_reservations.deleteMany({
                  where: {
                    userId: orderData.userId,
                    productId: item.productId,
                    variantId: null
                  }
                });
              }
            }
          } else {
            // D1: Delete reservations for each item
            for (const item of orderItems) {
              if (item.variantId) {
                const deleteResStmt = db.prepare(
                  'DELETE FROM inventory_reservations WHERE userId = ? AND variantId = ?'
                ).bind([orderData.userId, item.variantId]);
                await deleteResStmt.run();
              } else {
                const deleteResStmt = db.prepare(
                  'DELETE FROM inventory_reservations WHERE userId = ? AND productId = ? AND variantId IS NULL'
                ).bind([orderData.userId, item.productId]);
                await deleteResStmt.run();
              }
            }
          }
        }

        await commit();

        return { order, items };
      } catch (error) {
        console.error('Error in order transaction:', error);
        await rollback();
        throw error;
      }
    });

    return result.success && result.data ? result.data : null;
  }

  /**
   * Cancel order and restore stock in a transaction
   * This ensures atomicity - either stock is restored AND order is cancelled, or neither happens
   */
  static async cancelOrderWithRestock(
    env: Env | null,
    orderId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Order | null> {
    const result = await runTransaction(async (db, commit, rollback) => {
      try {
        const isPrisma = !env || !env.DB;

        // Fetch order items first
        let orderItems: OrderItem[];
        if (isPrisma) {
          orderItems = await db.order_items.findMany({
            where: { orderId },
          });
          orderItems = orderItems as unknown as OrderItem[];
        } else {
          const stmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?').bind([orderId]);
          const result = await stmt.all();
          orderItems = result.results as OrderItem[];
        }

        // Restore stock for each item
        for (const item of orderItems) {
          if (item.variantId) {
            // Restore variant stock
            if (isPrisma) {
              const variant = await db.product_variants.findUnique({
                where: { id: item.variantId },
                select: { stock: true }
              });

              if (variant) {
                await db.product_variants.update({
                  where: { id: item.variantId },
                  data: { stock: variant.stock + item.quantity }
                });
              }
            } else {
              const variantStmt = db.prepare('SELECT stock FROM product_variants WHERE id = ?').bind([item.variantId]);
              const variant = await variantStmt.first() as { stock: number } | null;

              if (variant) {
                const newStock = variant.stock + item.quantity;
                const updateStmt = db.prepare('UPDATE product_variants SET stock = ? WHERE id = ?').bind([newStock, item.variantId]);
                await updateStmt.run();
              }
            }
          } else {
            // Restore product stock
            if (isPrisma) {
              const product = await db.products.findUnique({
                where: { id: item.productId },
                select: { stock: true }
              });

              if (product) {
                await db.products.update({
                  where: { id: item.productId },
                  data: { stock: product.stock + item.quantity }
                });
              }
            } else {
              const productStmt = db.prepare('SELECT stock FROM products WHERE id = ?').bind([item.productId]);
              const product = await productStmt.first() as { stock: number } | null;

              if (product) {
                const newStock = product.stock + item.quantity;
                const updateStmt = db.prepare('UPDATE products SET stock = ? WHERE id = ?').bind([newStock, item.productId]);
                await updateStmt.run();
              }
            }
          }
        }

        // Consume any remaining inventory reservations as a safety net
        // This handles edge cases where reservations weren't deleted during order creation
        if (isPrisma) {
          // Get order to find userId
          const order = await db.orders.findUnique({
            where: { id: orderId },
            select: { userId: true }
          });

          if (order?.userId) {
            // Delete reservations for each order item
            for (const item of orderItems) {
              if (item.variantId) {
                await db.inventory_reservations.deleteMany({
                  where: {
                    userId: order.userId,
                    variantId: item.variantId
                  }
                });
              } else {
                await db.inventory_reservations.deleteMany({
                  where: {
                    userId: order.userId,
                    productId: item.productId,
                    variantId: null
                  }
                });
              }
            }
          }
        } else {
          // D1: Get order to find userId
          const orderStmt = db.prepare('SELECT userId FROM orders WHERE id = ? LIMIT 1').bind([orderId]);
          const order = await orderStmt.first() as { userId?: string } | null;

          if (order?.userId) {
            // Delete reservations for each item
            for (const item of orderItems) {
              if (item.variantId) {
                const deleteResStmt = db.prepare(
                  'DELETE FROM inventory_reservations WHERE userId = ? AND variantId = ?'
                ).bind([order.userId, item.variantId]);
                await deleteResStmt.run();
              } else {
                const deleteResStmt = db.prepare(
                  'DELETE FROM inventory_reservations WHERE userId = ? AND productId = ? AND variantId IS NULL'
                ).bind([order.userId, item.productId]);
                await deleteResStmt.run();
              }
            }
          }
        }

        // Cancel the order
        let cancelledOrder: Order;
        if (isPrisma) {
          cancelledOrder = await db.orders.update({
            where: { id: orderId },
            data: {
              status: 'CANCELLED' as OrderStatus,
              cancelledAt: now(),
              cancelledBy,
              cancellationReason: reason || null,
              updatedAt: now()
            }
          });
          cancelledOrder = cancelledOrder as unknown as Order;
        } else {
          const cancelStmt = db.prepare(
            `UPDATE orders SET status = 'CANCELLED', cancelledAt = ?, cancelledBy = ?, cancellationReason = ?, updatedAt = ? WHERE id = ?`
          ).bind([now(), cancelledBy, reason || null, now(), orderId]);
          await cancelStmt.run();

          // Fetch updated order
          const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind([orderId]);
          const result = await orderStmt.first();
          cancelledOrder = result as Order;
        }

        await commit();

        return cancelledOrder;
      } catch (error) {
        console.error('Error in cancellation transaction:', error);
        await rollback();
        throw error;
      }
    });

    return result.success && result.data ? result.data : null;
  }
}
