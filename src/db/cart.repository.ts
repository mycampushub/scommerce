import { Env, CartItem } from '@/db/types';
import { generateId, now, queryFirst, queryAll, execute } from '@/db/db';
import { runTransactionWithRetry } from '@/lib/transaction';
import {
  updateCartItemQuantityWithLock,
  getVersionConflictErrorMessage,
  retryOnVersionConflict
} from '@/lib/optimistic-lock';

export class CartRepository {
  /**
   * Get cart items for a user
   */
  static async findByUserId(env: Env | null, userId: string): Promise<CartItem[]> {
    return queryAll<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE userId = ? ORDER BY createdAt DESC',
      userId
    );
  }

  /**
   * Find specific cart item
   */
  static async findItem(env: Env | null, userId: string, productId: string, variantId?: string): Promise<CartItem | null> {
    if (variantId) {
      return queryFirst<CartItem>(
        env,
        'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ? LIMIT 1',
        userId,
        productId,
        variantId
      );
    }
    return queryFirst<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId IS NULL LIMIT 1',
      userId,
      productId
    );
  }

  /**
   * Add item to cart with atomic operation to prevent race conditions
   * Uses a transaction to ensure atomicity: check-then-update is done atomically
   */
  static async addItem(env: Env | null, data: {
    userId: string;
    productId: string;
    variantId?: string;
    quantity?: number;
  }): Promise<CartItem> {
    const quantityToAdd = data.quantity || 1;

    // Use transaction with retry to handle race conditions
    const result = await runTransactionWithRetry(async (db, commit, rollback) => {
      // Check if item already exists within the transaction
      const existingStmt = data.variantId
        ? db.prepare(
            'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId = ? LIMIT 1'
          ).bind(data.userId, data.productId, data.variantId)
        : db.prepare(
            'SELECT * FROM cart_items WHERE userId = ? AND productId = ? AND variantId IS NULL LIMIT 1'
          ).bind(data.userId, data.productId);
      const existing = await existingStmt.first() as CartItem | null;

      if (existing) {
        // Update quantity atomically using increment
        const newQuantity = existing.quantity + quantityToAdd;
        const updateStmt = db.prepare(
          'UPDATE cart_items SET quantity = ?, updatedAt = ? WHERE id = ?'
        ).bind(newQuantity, now(), existing.id);
        await updateStmt.run();

        // Fetch and return updated item
        const fetchStmt = db.prepare('SELECT * FROM cart_items WHERE id = ? LIMIT 1').bind(existing.id);
        const updatedItem = await fetchStmt.first() as CartItem;
        return updatedItem;
      } else {
        // Create new cart item
        const id = generateId();
        const currentTime = now();

        const insertStmt = db.prepare(
          `INSERT INTO cart_items (id, userId, productId, variantId, quantity, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, data.userId, data.productId, data.variantId || null, quantityToAdd, currentTime, currentTime);
        await insertStmt.run();

        // Fetch and return new item
        const fetchStmt = db.prepare('SELECT * FROM cart_items WHERE id = ? LIMIT 1').bind(id);
        const newItem = await fetchStmt.first() as CartItem;
        return newItem;
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to add item to cart');
    }

    return result.data!;
  }

  /**
   * Update cart item quantity with optimistic locking
   * Uses version checking and automatic retry on conflicts
   */
  static async updateQuantity(env: Env | null, id: string, quantity: number): Promise<CartItem | null> {
    const result = await retryOnVersionConflict(async () => {
      return await updateCartItemQuantityWithLock(env, id, quantity);
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('cart item'));
      }
      throw new Error(result.error || 'Failed to update cart quantity');
    }

    return queryFirst<CartItem>(
      env,
      'SELECT * FROM cart_items WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Increment cart item quantity atomically
   * Prevents lost-update race condition
   */
  static async incrementQuantity(env: Env | null, id: string, increment: number = 1): Promise<CartItem | null> {
    // Use SQL's increment operation for atomicity
    await execute(
      env,
      'UPDATE cart_items SET quantity = quantity + ?, updatedAt = ? WHERE id = ?',
      increment,
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
  static async removeItem(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM cart_items WHERE id = ?', id);
  }

  /**
   * Clear cart for a user
   */
  static async clearCart(env: Env | null, userId: string): Promise<void> {
    await execute(env, 'DELETE FROM cart_items WHERE userId = ?', userId);
  }

  /**
   * Delete cart item by product
   */
  static async removeByProduct(env: Env | null, userId: string, productId: string): Promise<void> {
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
  static async countItems(env: Env | null, userId: string): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM cart_items WHERE userId = ?',
      userId
    );
    return result?.count || 0;
  }
}
