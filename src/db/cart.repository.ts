import { Env, CartItem } from '@/db/types';
import { generateId, now, queryFirst, queryAll, execute } from '@/db/db';

export class CartRepository {
  /**
   * Get cart items for a user
   */
  static async findByUserId(env: Env, userId: string): Promise<CartItem[]> {
    return queryAll<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE userId = ? ORDER BY createdAt DESC',
      userId
    );
  }

  /**
   * Find specific cart item
   */
  static async findItem(env: Env, userId: string, productId: string): Promise<CartItem | null> {
    return queryFirst<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE userId = ? AND productId = ? LIMIT 1',
      userId,
      productId
    );
  }

  /**
   * Add item to cart
   */
  static async addItem(env: Env, data: {
    userId: string;
    productId: string;
    variantId?: string;
    quantity?: number;
  }): Promise<CartItem> {
    // Check if item already exists
    const existing = await this.findItem(env, data.userId, data.productId);

    if (existing) {
      // Update quantity
      return this.updateQuantity(
        env,
        existing.id,
        existing.quantity + (data.quantity || 1)
      );
    }

    // Create new cart item
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO cart_items (id, userId, productId, variantId, quantity, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.userId,
      data.productId,
      data.variantId || null,
      data.quantity || 1,
      currentTime,
      currentTime
    );

    return (await queryFirst<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE id = ? LIMIT 1',
      id
    ))!;
  }

  /**
   * Update cart item quantity
   */
  static async updateQuantity(env: Env, id: string, quantity: number): Promise<CartItem | null> {
    await execute(
      env,
      'UPDATE cart_items SET quantity = ?, updatedAt = ? WHERE id = ?',
      quantity,
      now(),
      id
    );
    return queryFirst<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Remove item from cart
   */
  static async removeItem(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM cart_items WHERE id = ?', id);
  }

  /**
   * Clear cart for a user
   */
  static async clearCart(env: Env, userId: string): Promise<void> {
    await execute(env, 'DELETE FROM cart_items WHERE userId = ?', userId);
  }

  /**
   * Delete cart item by product
   */
  static async removeByProduct(env: Env, userId: string, productId: string): Promise<void> {
    await execute(
      env,
      'DELETE FROM cart_items WHERE userId = ? AND productId = ?',
      userId,
      productId
    );
  }

  /**
   * Get cart item count for a user
   */
  static async countItems(env: Env, userId: string): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM cart_items WHERE userId = ?',
      userId
    );
    return result?.count || 0;
  }
}
