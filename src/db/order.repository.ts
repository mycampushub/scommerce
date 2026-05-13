import { Env, Order, OrderItem, OrderStatus, PaymentStatus, TrackingStatus } from '@/db/types';
import { generateId, generateOrderNumber, boolToNumber, now, queryFirst, queryAll, execute, buildPaginationClause } from '@/db/db';
import prisma from '@/lib/database';

export class OrderRepository {
  /**
   * Find order by order number
   */
  static async findByOrderNumber(env: Env | null, orderNumber: string): Promise<Order | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const order = await prisma.order.findUnique({
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
      const order = await prisma.order.findUnique({
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
      const orders = await prisma.order.findMany({
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
        const order = await prisma.order.create({
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
      await prisma.order.update({
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
      await prisma.order.update({
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
      await prisma.order.update({
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
      await prisma.order.update({
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
      await prisma.order.update({
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

      const orders = await prisma.order.findMany({
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

      return await prisma.order.count({ where });
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
      const items = await prisma.orderItem.findMany({
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
      const item = await prisma.orderItem.create({
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
      const result = await prisma.order.updateMany({
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
      const orders = await prisma.order.findMany({
        where: {
          deletedAt: { lt: cutoffDateStr }
        },
        select: { id: true }
      });

      const orderIds = orders.map(o => o.id);

      if (orderIds.length === 0) return 0;

      // Delete order items first
      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // Delete orders
      const result = await prisma.order.deleteMany({
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
      return await prisma.order.count({
        where: { deletedAt: { not: null } }
      });
    }

    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM orders WHERE deletedAt IS NOT NULL'
    );
    return result?.count || 0;
  }
}
