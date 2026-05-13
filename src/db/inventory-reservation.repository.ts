import { Env } from '@/db/types';
import {
  generateId,
  now,
  queryFirst,
  queryAll,
  execute,
} from '@/db/db';

/**
 * Reserve stock for a product/variant
 */
export async function reserveStock(env: Env | null, data: {
  variantId?: string;
  productId?: string;
  userId: string;
  quantity: number;
  expiresAt: Date;
}): Promise<any | null> {
  const id = generateId();

  // Check if product/variant has enough stock
  const stockCheck = await queryFirst<{ stock: number }>(
    env,
    data.variantId
      ? 'SELECT stock FROM product_variants WHERE id = ? LIMIT 1'
      : 'SELECT stock FROM products WHERE id = ? LIMIT 1',
    data.variantId || data.productId
  );

  if (!stockCheck || stockCheck.stock < data.quantity) {
    return null;
  }

  // Create reservation
  await execute(
    env,
    `INSERT INTO inventory_reservations (id, userId, productId, variantId, quantity, expiresAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.userId,
    data.productId || null,
    data.variantId || null,
    data.quantity,
    data.expiresAt.toISOString(),
    now()
  );

  return { id };
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
 * Release all cart reservations for a user
 */
export async function releaseCartReservations(env: Env | null, userId: string, orderItems: any[]): Promise<void> {
  const itemIds = orderItems.map(item => item.productId || item.id);
  const variantIds = orderItems.map(item => item.variantId).filter(Boolean) as string[];

  if (variantIds.length > 0) {
    await execute(
      env,
      `DELETE FROM inventory_reservations
       WHERE userId = ? AND productId IN (${itemIds.map(() => '?').join(',')})
       AND variantId IN (${variantIds.map(() => '?').join(',')})`,
      userId,
      ...itemIds,
      ...variantIds
    );
  } else if (itemIds.length > 0) {
    await execute(
      env,
      `DELETE FROM inventory_reservations
       WHERE userId = ? AND productId IN (${itemIds.map(() => '?').join(',')})
       AND variantId IS NULL`,
      userId,
      ...itemIds
    );
  }
}
