import { Env, Order, OrderItem, OrderStatus, PaymentStatus, TrackingStatus, D1Result } from '@/db/types';
import { generateId, generateOrderNumber, boolToNumber, now, queryFirst, queryAll, execute, buildPaginationClause, transaction } from '@/db/db';

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
    env: Env,
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
  }): Promise<Order> {
    const id = generateId();
    const orderNumber = generateOrderNumber();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone,
       shippingAddress, billingAddress, city, district, division, subtotal, shipping,
       tax, discount, total, status, paymentStatus, paymentMethod, trackingStatus,
       createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      'PENDING',
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Create new order with items in a single transaction (data integrity)
   * All operations succeed or all fail - no partial orders
   *
   * This ensures data integrity by using a database transaction.
   * If any item fails to create, the entire order (order + all items) is rolled back.
   *
   * @param env - Cloudflare environment with DB binding
   * @param orderData - Order details
   * @param items - Array of order items to create
   * @returns Promise<Order> - The created order
   */
  static async createWithItems(
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
      shipping?: number;
      tax?: number;
      discount?: number;
      total: number;
      paymentMethod?: string;
    },
    items: Array<{
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
    }>
  ): Promise<Order> {
    const orderId = generateId();
    const orderNumber = generateOrderNumber();
    const currentTime = now();

    // Build transaction statements
    const statements: Array<{ sql: string; params: unknown[] }> = [];

    // 1. Insert order
    statements.push({
      sql: `INSERT INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone,
             shippingAddress, billingAddress, city, district, division, subtotal, shipping,
             tax, discount, total, status, paymentStatus, paymentMethod, trackingStatus,
             createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        orderId,
        orderNumber,
        orderData.userId || null,
        orderData.customerName,
        orderData.customerEmail,
        orderData.customerPhone || null,
        orderData.shippingAddress,
        orderData.billingAddress || null,
        orderData.city || null,
        orderData.district || null,
        orderData.division || null,
        orderData.subtotal,
        orderData.shipping || 0,
        orderData.tax || 0,
        orderData.discount || 0,
        orderData.total,
        'PENDING',
        'PENDING',
        orderData.paymentMethod || null,
        'PENDING',
        currentTime,
        currentTime
      ]
    });

    // 2. Insert all order items
    for (const item of items) {
      const itemId = generateId();
      statements.push({
        sql: `INSERT INTO order_items (id, orderId, productId, variantId, quantity, price,
               productName, productImage, variantSku, variantSize, variantColor, variantMaterial, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          itemId,
          orderId,
          item.productId,
          item.variantId || null,
          item.quantity,
          item.price,
          item.productName,
          item.productImage || null,
          item.variantSku || null,
          item.variantSize || null,
          item.variantColor || null,
          item.variantMaterial || null,
          currentTime
        ]
      });
    }

    // Execute transaction - all statements succeed or all fail
    await transaction(env, statements);

    // Return the created order
    return (await this.findById(env, orderId))!;
  }

  /**
   * Update order status
   */
  static async updateStatus(env: Env | null, id: string, status: OrderStatus): Promise<Order | null> {
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
   * Delete order with items in a single transaction (data integrity)
   * All operations succeed or all fail - no orphaned records
   *
   * This ensures data integrity by using a database transaction.
   * If the order deletion fails, the items will NOT be deleted (no orphaned records).
   *
   * @param env - Cloudflare environment with DB binding
   * @param id - Order ID to delete
   * @returns Promise<void>
   */
  static async deleteWithItems(env: Env | null, id: string): Promise<void> {
    const statements: Array<{ sql: string; params: unknown[] }> = [];

    // 1. Delete order items first (referential integrity)
    statements.push({
      sql: 'DELETE FROM order_items WHERE orderId = ?',
      params: [id]
    });

    // 2. Delete the order
    statements.push({
      sql: 'DELETE FROM orders WHERE id = ?',
      params: [id]
    });

    // Execute transaction - both delete operations succeed or both fail
    await transaction(env, statements);
  }
}
