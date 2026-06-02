import { Env } from '@/db/types';
import {
  generateId,
  now,
  queryFirst,
  queryAll,
  execute,
} from '@/db/db';
import { runTransactionWithRetry } from '@/lib/transaction';

/**
 * Reserve stock for a product/variant with atomic operation
 * Uses a transaction to ensure stock check and reservation happen atomically
 */
export async function reserveStock(env: Env | null, data: {
  variantId?: string;
  productId?: string;
  userId: string;
  quantity: number;
  expiresAt: Date;
  existingCartQuantity?: number; // User's existing cart quantity
}): Promise<any | null> {
  const existingCartQuantity = data.existingCartQuantity || 0;

  const result = await runTransactionWithRetry(async (db, commit, rollback) => {
    // Check if product/variant has enough stock WITHIN the transaction
    const stockCheckStmt = db.prepare(
      data.variantId
        ? 'SELECT stock FROM product_variants WHERE id = ? LIMIT 1'
        : 'SELECT stock FROM products WHERE id = ? LIMIT 1'
    ).bind(data.variantId || data.productId);
    const stockCheck = await stockCheckStmt.first() as { stock: number } | null;

    if (!stockCheck || stockCheck.stock < (data.quantity + existingCartQuantity)) {
      // Rollback and return null for insufficient stock
      return null;
    }

    // Check existing reservations for this product/variant (excluding current user's existing cart)
    const existingReservationsStmt = db.prepare(
      data.variantId
        ? 'SELECT COALESCE(SUM(quantity), 0) as reserved FROM inventory_reservations WHERE variantId = ? AND expiresAt > ? AND userId != ?'
        : 'SELECT COALESCE(SUM(quantity), 0) as reserved FROM inventory_reservations WHERE productId = ? AND variantId IS NULL AND expiresAt > ? AND userId != ?'
    ).bind(data.variantId || data.productId, now(), data.userId);
    const existingReservations = await existingReservationsStmt.first() as { reserved: number } | null;
    const reservedQuantity = existingReservations?.reserved || 0;

    // Calculate available stock (total stock - already reserved - user's existing cart)
    const availableStock = stockCheck.stock - reservedQuantity - existingCartQuantity;

    if (availableStock < data.quantity) {
      // Not enough available stock after considering reservations and existing cart
      return null;
    }

    // Create reservation
    const id = generateId();
    const insertStmt = db.prepare(
      `INSERT INTO inventory_reservations (id, userId, productId, variantId, quantity, expiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.userId,
      data.productId || null,
      data.variantId || null,
      data.quantity,
      data.expiresAt.toISOString(),
      now()
    );
    await insertStmt.run();

    return { id };
  });

  return result.success ? result.data : null;
}

/**
 * Release stock reservation
 */
export async function releaseStock(env: Env | null, reservationId: string): Promise<void> {
  await execute(env, 'DELETE FROM inventory_reservations WHERE id = ?', reservationId);
}

/**
 * Cleanup expired reservations
 */
export async function cleanupExpiredReservations(env: Env | null): Promise<void> {
  await execute(
    env,
    'DELETE FROM inventory_reservations WHERE expiresAt < ?',
    now()
  );
}

/**
 * Get user reservations
 */
export async function getUserReservations(env: Env | null, userId: string): Promise<any[]> {
  return queryAll(
    env,
    'SELECT * FROM inventory_reservations WHERE userId = ? AND expiresAt > ? ORDER BY createdAt DESC',
    userId,
    now()
  );
}

/**
 * Release cart item reservation for a specific product/variant
 */
export async function releaseCartItemReservation(
  env: Env | null,
  userId: string,
  productId: string,
  variantId?: string | null
): Promise<void> {
  // Build WHERE clause based on whether variantId is present
  if (variantId) {
    // For products with variants - match both productId and variantId
    await execute(
      env,
      'DELETE FROM inventory_reservations WHERE userId = ? AND productId = ? AND variantId = ?',
      userId,
      productId,
      variantId
    );
  } else {
    // For products without variants - match productId and variantId IS NULL
    await execute(
      env,
      'DELETE FROM inventory_reservations WHERE userId = ? AND productId = ? AND variantId IS NULL',
      userId,
      productId
    );
  }
}

/**
 * Release all reservations for a user
 */
export async function releaseAllUserReservations(env: Env | null, userId: string): Promise<void> {
  await execute(env, 'DELETE FROM inventory_reservations WHERE userId = ?', userId);
}

/**
 * Release all cart reservations for a user
 * Correctly uses OR logic to match any of the items
 */
export async function releaseCartReservations(env: Env | null, userId: string, orderItems: any[]): Promise<void> {
  if (orderItems.length === 0) {
    return;
  }

  // Build conditions for each item
  const conditions: string[] = [];
  const params: any[] = [userId];

  for (const item of orderItems) {
    const variantId = item.variantId || item.variantId === null ? (item.variantId || null) : null;
    const productId = item.productId || item.id;

    if (variantId) {
      conditions.push('(variantId = ?)');
      params.push(variantId);
    } else {
      conditions.push('(productId = ? AND variantId IS NULL)');
      params.push(productId);
    }
  }

  // Single DELETE query with OR conditions (this is correct - releases if ANY condition matches)
  const query = `DELETE FROM inventory_reservations WHERE userId = ? AND (${conditions.join(' OR ')})`;
  await execute(env, query, ...params);
}
