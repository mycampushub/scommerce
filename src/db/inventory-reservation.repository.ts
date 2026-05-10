import { generateSecureId } from './db';

export interface CreateReservationParams {
  variantId?: string;
  productId?: string;
  userId: string;
  quantity: number;
  expiresAt: Date;
}

/**
 * Reserve stock when an item is added to cart
 * Returns null if stock is unavailable
 */
export async function reserveStock(
  env: any,
  params: CreateReservationParams
): Promise<any | null> {
  const { variantId, productId, userId, quantity, expiresAt } = params;

  // Start transaction-like operation
  // Check available stock (current stock - reserved stock)
  const stockCheck = variantId
    ? await checkVariantAvailability(env, variantId, quantity)
    : await checkProductAvailability(env, productId!, quantity);

  if (!stockCheck.available) {
    return null; // Not enough stock
  }

  // Create reservation
  const id = generateSecureId();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO inventory_reservations (id, variantId, productId, userId, quantity, expiresAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, variantId || null, productId || null, userId, quantity, expiresAt.toISOString(), now)
    .run();

  // Fetch created reservation
  const reservation = await env.DB.prepare(
    'SELECT * FROM inventory_reservations WHERE id = ? LIMIT 1'
  )
    .bind(id)
    .first();

  return reservation;
}

/**
 * Release stock reservation (when item removed from cart or expires)
 */
export async function releaseStock(
  env: any,
  reservationId: string
): Promise<boolean> {
  const result = await env.DB.prepare(
    'DELETE FROM inventory_reservations WHERE id = ?'
  )
    .bind(reservationId)
    .run();

  return result.success;
}

/**
 * Release all reservations for a user
 */
export async function releaseUserReservations(
  env: any,
  userId: string
): Promise<number> {
  const result = await env.DB.prepare(
    'DELETE FROM inventory_reservations WHERE userId = ?'
  )
    .bind(userId)
    .run();

  return result.meta.changes || 0;
}

/**
 * Release all reservations for specific cart items
 */
export async function releaseCartReservations(
  env: any,
  userId: string,
  items: Array<{ productId: string; variantId?: string }>
): Promise<number> {
  let totalReleased = 0;

  for (const item of items) {
    const result = await env.DB.prepare(
      `DELETE FROM inventory_reservations
       WHERE userId = ?
         AND ((productId = ? AND variantId IS NULL)
              OR (variantId = ? AND productId IS NULL))`
    )
      .bind(userId, item.productId, item.variantId || null)
      .run();

    totalReleased += result.meta.changes || 0;
  }

  return totalReleased;
}

/**
 * Clean up expired reservations
 */
export async function cleanupExpiredReservations(
  env: any
): Promise<number> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    'DELETE FROM inventory_reservations WHERE expiresAt < ?'
  )
    .bind(now)
    .run();

  return result.meta.changes || 0;
}

/**
 * Get all reservations for a user
 */
export async function getUserReservations(
  env: any,
  userId: string
): Promise<any[]> {
  const reservations = await env.DB.prepare(
    `SELECT ir.*, p.name as productName, pv.sku as variantSku, pv.size, pv.color
     FROM inventory_reservations ir
     LEFT JOIN products p ON ir.productId = p.id
     LEFT JOIN product_variants pv ON ir.variantId = pv.id
     WHERE ir.userId = ?
     ORDER BY ir.createdAt DESC`
  )
    .bind(userId)
    .all();

  return reservations.results || [];
}

/**
 * Check variant availability (current stock - reserved stock)
 */
async function checkVariantAvailability(
  env: any,
  variantId: string,
  quantity: number
): Promise<{ available: boolean; stock: number; reserved: number }> {
  // Get current stock
  const variant = await env.DB.prepare(
    'SELECT stock FROM product_variants WHERE id = ? LIMIT 1'
  )
    .bind(variantId)
    .first();

  if (!variant) {
    return { available: false, stock: 0, reserved: 0 };
  }

  // Get reserved stock
  const reserved = await env.DB.prepare(
    `SELECT COALESCE(SUM(quantity), 0) as reserved
     FROM inventory_reservations
     WHERE variantId = ? AND expiresAt > datetime('now')`
  )
    .bind(variantId)
    .first();

  const reservedStock = (reserved?.reserved as number) || 0;
  const availableStock = (variant.stock as number) - reservedStock;

  return {
    available: availableStock >= quantity,
    stock: variant.stock as number,
    reserved: reservedStock,
  };
}

/**
 * Check product availability (current stock - reserved stock)
 */
async function checkProductAvailability(
  env: any,
  productId: string,
  quantity: number
): Promise<{ available: boolean; stock: number; reserved: number }> {
  // Get current stock
  const product = await env.DB.prepare(
    'SELECT stock FROM products WHERE id = ? LIMIT 1'
  )
    .bind(productId)
    .first();

  if (!product) {
    return { available: false, stock: 0, reserved: 0 };
  }

  // Get reserved stock
  const reserved = await env.DB.prepare(
    `SELECT COALESCE(SUM(quantity), 0) as reserved
     FROM inventory_reservations
     WHERE productId = ? AND variantId IS NULL AND expiresAt > datetime('now')`
  )
    .bind(productId)
    .first();

  const reservedStock = (reserved?.reserved as number) || 0;
  const availableStock = (product.stock as number) - reservedStock;

  return {
    available: availableStock >= quantity,
    stock: product.stock as number,
    reserved: reservedStock,
  };
}
