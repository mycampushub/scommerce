import { Env, Order, OrderItem, OrderStatus, PaymentStatus, TrackingStatus } from '@/db/types';
import { generateId, generateOrderNumber, now, queryFirst, queryAll, execute, generateSecureId, retry } from '@/db/db';
import { runTransaction } from '@/lib/transaction';
import {
  updateOrderStatusWithLock,
  getVersionConflictErrorMessage,
  retryOnVersionConflict,
  updateWithOptimisticLock,
  OptimisticLockResult
} from '@/lib/optimistic-lock';

export class OrderRepository {
  /**
   * Find order by order number
   */
  static async findByOrderNumber(env: Env | null, orderNumber: string): Promise<Order | null> {
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

    return queryAll<Order>(
      env,
      'SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      userId,
      limit,
      offset
    );
  }

  /**
   * Create new order with retry to handle order number collision
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
    // Use retry to handle rare order number collisions
    return await retry(async () => {
      const id = generateId();
      const orderNumber = await generateOrderNumber();
      const currentTime = now();

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

      try {
        await execute(env, sql, ...values);
      } catch (error: any) {
        // If it's a unique constraint violation on orderNumber, retry
        if (error.message && error.message.includes('UNIQUE')) {
          throw new Error(`Order number collision - retrying`);
        }
        throw error;
      }

      return (await this.findById(env, id))!;
    }, 3, 50); // Retry up to 3 times with 50ms base delay
  }

  /**
   * Update order status with optimistic locking (prevents concurrent status updates)
   * Uses version checking and automatic retry on conflicts
   */
  static async updateStatus(env: Env | null, id: string, status: OrderStatus): Promise<Order | null> {
    const result = await retryOnVersionConflict(async () => {
      return await updateOrderStatusWithLock(env, id, status);
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('order'));
      }
      throw new Error(result.error || 'Failed to update order status');
    }

    return this.findById(env, id);
  }

  /**
   * Update payment status with optimistic locking
   */
  static async updatePaymentStatus(env: Env | null, id: string, paymentStatus: PaymentStatus): Promise<Order | null> {
    const order = await queryFirst<{ version: number }>(
      env,
      `SELECT version FROM orders WHERE id = ?`,
      id
    );

    if (!order) {
      throw new Error('Order not found');
    }

    const result = await retryOnVersionConflict(async () => {
      return await updateWithOptimisticLock(env, 'orders', id, order.version, {
        paymentStatus,
      });
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('order'));
      }
      throw new Error(result.error || 'Failed to update payment status');
    }

    return this.findById(env, id);
  }

  /**
   * Update tracking with optimistic locking
   */
  static async updateTracking(
    env: Env | null,
    id: string,
    trackingNumber: string,
    trackingStatus: TrackingStatus
  ): Promise<Order | null> {
    const order = await queryFirst<{ version: number }>(
      env,
      `SELECT version FROM orders WHERE id = ?`,
      id
    );

    if (!order) {
      throw new Error('Order not found');
    }

    const result = await retryOnVersionConflict(async () => {
      return await updateWithOptimisticLock(env, 'orders', id, order.version, {
        trackingNumber,
        trackingStatus,
      });
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('order'));
      }
      throw new Error(result.error || 'Failed to update tracking');
    }

    return this.findById(env, id);
  }

  /**
   * Cancel order with optimistic locking
   */
  static async cancel(env: Env | null, id: string, cancelledBy: string, reason?: string): Promise<Order | null> {
    const order = await queryFirst<{ version: number }>(
      env,
      `SELECT version FROM orders WHERE id = ?`,
      id
    );

    if (!order) {
      throw new Error('Order not found');
    }

    const result = await retryOnVersionConflict(async () => {
      return await updateWithOptimisticLock(env, 'orders', id, order.version, {
        status: 'CANCELLED',
        cancelledAt: now(),
        cancelledBy,
        cancellationReason: reason || null,
      });
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('order'));
      }
      throw new Error(result.error || 'Failed to cancel order');
    }

    return this.findById(env, id);
  }

  /**
   * Refund order with optimistic locking (supports partial and cumulative refunds)
   */
  static async refund(
    env: Env | null,
    id: string,
    amount: number,
    method: string,
    reason?: string
  ): Promise<Order | null> {
    const order = await queryFirst<{ version: number; refundedAmount: number | null; total: number }>(
      env,
      `SELECT version, refundedAmount, total FROM orders WHERE id = ?`,
      id
    );

    if (!order) {
      throw new Error('Order not found');
    }

    // Check cumulative refund amount doesn't exceed total
    const currentRefunded = order.refundedAmount ? Number(order.refundedAmount) : 0;
    const newRefundAmount = currentRefunded + amount;

    if (newRefundAmount > Number(order.total)) {
      throw new Error(`Refund amount (${newRefundAmount}) exceeds order total (${order.total})`);
    }

    const result = await retryOnVersionConflict(async () => {
      return await updateWithOptimisticLock(env, 'orders', id, order.version, {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        refundedAt: now(),
        refundedAmount: newRefundAmount,
        refundMethod: method,
        refundReason: reason || null,
      });
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('order'));
      }
      throw new Error(result.error || 'Failed to refund order');
    }

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
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM orders WHERE deletedAt IS NOT NULL'
    );
    return result?.count || 0;
  }

  /**
   * Create order with items and stock updates in a transaction with retry
   * This ensures atomicity - either all operations succeed or none do
   * Retry handles rare order number collisions
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
    // Use retry to handle rare order number collisions
    return await retry(async () => {
      const result = await runTransaction(async (db, commit, rollback) => {
        try {
          const id = generateId();
          const orderNumber = await generateOrderNumber();
          const currentTime = now();

          // Create order
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
          try {
            await stmt.run();
          } catch (error: any) {
            // If it's a unique constraint violation on orderNumber, let retry handle it
            if (error.message && error.message.includes('UNIQUE')) {
              throw new Error(`Order number collision - retrying`);
            }
            throw error;
          }

          // Fetch the created order
          const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind([id]);
          const orderResult = await orderStmt.first();
          const order = orderResult as Order;

          // Create order items and update stock
          const items: OrderItem[] = [];
          for (const item of orderItems) {
            const itemId = generateId();
            const itemTime = now();

            // Create order item
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

            // Update stock and generate alerts
            if (item.variantId) {
              // ATOMIC stock deduction - prevents overselling race condition
              // This updates stock only if sufficient stock is available
              const updateStockStmt = db.prepare(
                'UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?'
              ).bind([item.quantity, item.variantId, item.quantity]);
              const updateResult = await updateStockStmt.run();

              // Check if the update succeeded (stock was available)
              if (!updateResult.meta || (updateResult.meta as any).changes === 0) {
                throw new Error(`Insufficient stock for variant ${item.variantId}`);
              }

              // Fetch updated variant for alert generation
              const variantStmt = db.prepare(
                'SELECT id, stock, lowStockAlert, reorderLevel FROM product_variants WHERE id = ? LIMIT 1'
              ).bind([item.variantId]);
              const variant = await variantStmt.first() as { stock: number; lowStockAlert: number; reorderLevel: number } | null;

              if (variant) {
                const newStock = variant.stock;
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
            } else {
              // ATOMIC stock deduction - prevents overselling race condition
              const updateStockStmt = db.prepare(
                'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
              ).bind([item.quantity, item.productId, item.quantity]);
              const updateResult = await updateStockStmt.run();

              // Check if the update succeeded (stock was available)
              if (!updateResult.meta || (updateResult.meta as any).changes === 0) {
                throw new Error(`Insufficient stock for product ${item.productId}`);
              }

              // Fetch updated product for alert generation
              const productStmt = db.prepare(
                'SELECT id, stock, lowStockAlert, reorderLevel FROM products WHERE id = ? LIMIT 1'
              ).bind([item.productId]);
              const product = await productStmt.first() as { stock: number; lowStockAlert: number; reorderLevel: number } | null;

              if (product) {
                const newStock = product.stock;
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

          // Consume inventory reservations (delete them since stock was already deducted)
          // This prevents reservations from expiring and causing issues
          if (orderData.userId) {
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

          await commit();

          return { order, items };
        } catch (error) {
          console.error('Error in order transaction:', error);
          await rollback();
          throw error;
        }
      });

      return result.success && result.data ? result.data : null;
    }, 3, 50); // Retry up to 3 times with 50ms base delay for order number collisions
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
        // Fetch order items first
        const stmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?').bind([orderId]);
        const result = await stmt.all();
        const orderItems = result.results as OrderItem[];

        // Restore stock for each item using atomic increment
        for (const item of orderItems) {
          if (item.variantId) {
            // ATOMIC stock restore - prevents double-restore race condition
            const updateStmt = db.prepare('UPDATE product_variants SET stock = stock + ? WHERE id = ?').bind([item.quantity, item.variantId]);
            await updateStmt.run();
          } else {
            // ATOMIC stock restore - prevents double-restore race condition
            const updateStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').bind([item.quantity, item.productId]);
            await updateStmt.run();
          }
        }

        // Consume any remaining inventory reservations as a safety net
        // This handles edge cases where reservations weren't deleted during order creation
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

        // Cancel the order
        const cancelStmt = db.prepare(
          `UPDATE orders SET status = 'CANCELLED', cancelledAt = ?, cancelledBy = ?, cancellationReason = ?, updatedAt = ? WHERE id = ?`
        ).bind([now(), cancelledBy, reason || null, now(), orderId]);
        await cancelStmt.run();

        // Fetch updated order
        const fetchOrderStmt = db.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind([orderId]);
        const cancelledOrderResult = await fetchOrderStmt.first();
        const cancelledOrder = cancelledOrderResult as Order;

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
