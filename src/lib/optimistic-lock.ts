/**
 * Optimistic Locking Utilities
 *
 * This module provides utilities for implementing optimistic locking to prevent
 * race conditions in high-concurrency scenarios (e.g., stock updates, order status changes).
 *
 * Version fields are added to critical tables (products, product_variants, orders, cart_items)
 * and incremented on each update. Operations check the version before applying changes.
 */

import { runTransaction, runTransactionWithRetry, TransactionResult } from './transaction';
import { queryFirst, execute, now } from '@/db/db';
import { Env } from '@/db/types';

/**
 * Result of an optimistic lock update operation
 */
export interface OptimisticLockResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  conflict?: boolean; // True if this was a version conflict
  version?: number; // New version after update
}

/**
 * Interface for versioned entities
 */
export interface VersionedEntity {
  version: number;
}

/**
 * Get current version of an entity
 */
export async function getEntityVersion(
  env: Env | null,
  tableName: string,
  id: string
): Promise<number | null> {
  const result = await queryFirst<{ version: number }>(
    env,
    `SELECT version FROM ${tableName} WHERE id = ?`,
    id
  );
  return result?.version ?? null;
}

/**
 * Update entity with optimistic locking
 *
 * @param env Database environment
 * @param tableName Table name
 * @param id Entity ID
 * @param expectedVersion Expected version (for concurrency check)
 * @param updateFields Fields to update (object with field names and values)
 * @returns OptimisticLockResult with success status and new version
 */
export async function updateWithOptimisticLock(
  env: Env | null,
  tableName: string,
  id: string,
  expectedVersion: number,
  updateFields: Record<string, any>
): Promise<OptimisticLockResult> {
  const txId = `optlock_${tableName}_${id}_${Date.now()}`;

  try {
    // Build SET clause from updateFields
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const [field, value] of Object.entries(updateFields)) {
      setClauses.push(`${field} = ?`);
      params.push(value);
    }

    // Add version increment
    setClauses.push('version = version + 1');
    setClauses.push('updatedAt = ?');
    params.push(now());

    // Add ID and expected version to WHERE clause
    params.push(id);
    params.push(expectedVersion);

    const sql = `
      UPDATE ${tableName}
      SET ${setClauses.join(', ')}
      WHERE id = ? AND version = ?
    `;

    // Run with transaction and retry for transient failures
    const result = await runTransactionWithRetry(async (db, commit, rollback) => {
      const stmt = db.prepare(sql);
      const boundStmt = stmt.bind(...params);
      const runResult = await boundStmt.run();

      // Check if row was updated
      if ('meta' in runResult && 'changes' in runResult.meta) {
        const changes = (runResult.meta as any).changes;
        if (changes === 0) {
          // Version mismatch - no rows updated
          throw new Error('VERSION_CONFLICT');
        }
      } else if ('success' in runResult && !runResult.success) {
        throw new Error('UPDATE_FAILED');
      }

      // Get new version
      const newVersion = await getEntityVersion(env, tableName, id);

      return {
        success: true,
        newVersion: newVersion ?? expectedVersion + 1,
      };
    });

    if (result.success) {
      return {
        success: true,
        version: result.data!.newVersion,
      };
    } else {
      return {
        success: false,
        error: result.error,
        conflict: result.error?.includes('VERSION_CONFLICT'),
      };
    }
  } catch (error) {
    console.error(`[${txId}] Optimistic lock error:`, error);
    const isConflict = error instanceof Error && error.message === 'VERSION_CONFLICT';
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Optimistic lock failed',
      conflict: isConflict,
    };
  }
}

/**
 * Update stock with optimistic locking (prevents overselling)
 *
 * @param variantId Variant ID (or product ID for products without variants)
 * @param quantity Quantity to update (positive for restock, negative for sale)
 * @param isProduct Set to true if updating product stock instead of variant
 * @returns OptimisticLockResult
 */
export async function updateStockWithLock(
  env: Env | null,
  variantId: string,
  quantity: number,
  isProduct: boolean = false
): Promise<OptimisticLockResult> {
  const tableName = isProduct ? 'products' : 'product_variants';
  const id = variantId;

  // Get current entity
  const entity = await queryFirst<{ stock: number; version: number }>(
    env,
    `SELECT stock, version FROM ${tableName} WHERE id = ?`,
    id
  );

  if (!entity) {
    return {
      success: false,
      error: 'Entity not found',
    };
  }

  const currentStock = entity.stock;
  const expectedVersion = entity.version;
  const newStock = currentStock + quantity;

  // Prevent negative stock
  if (newStock < 0) {
    return {
      success: false,
      error: 'Insufficient stock',
    };
  }

  return await updateWithOptimisticLock(env, tableName, id, expectedVersion, {
    stock: newStock,
  });
}

/**
 * Update order status with optimistic locking
 *
 * @param orderId Order ID
 * @param status New status
 * @returns OptimisticLockResult
 */
export async function updateOrderStatusWithLock(
  env: Env | null,
  orderId: string,
  status: string
): Promise<OptimisticLockResult> {
  const order = await queryFirst<{ version: number }>(
    env,
    `SELECT version FROM orders WHERE id = ?`,
    orderId
  );

  if (!order) {
    return {
      success: false,
      error: 'Order not found',
    };
  }

  return await updateWithOptimisticLock(env, 'orders', orderId, order.version, {
    status,
  });
}

/**
 * Update cart item quantity with optimistic locking
 *
 * @param cartItemId Cart item ID
 * @param quantity New quantity
 * @returns OptimisticLockResult
 */
export async function updateCartItemQuantityWithLock(
  env: Env | null,
  cartItemId: string,
  quantity: number
): Promise<OptimisticLockResult> {
  if (quantity < 1) {
    return {
      success: false,
      error: 'Quantity must be at least 1',
    };
  }

  const cartItem = await queryFirst<{ version: number }>(
    env,
    `SELECT version FROM cart_items WHERE id = ?`,
    cartItemId
  );

  if (!cartItem) {
    return {
      success: false,
      error: 'Cart item not found',
    };
  }

  return await updateWithOptimisticLock(env, 'cart_items', cartItemId, cartItem.version, {
    quantity,
  });
}

/**
 * Update product variant with optimistic locking (price, stock, etc.)
 *
 * @param variantId Variant ID
 * @param expectedVersion Expected version
 * @param updateFields Fields to update
 * @returns OptimisticLockResult
 */
export async function updateVariantWithLock(
  env: Env | null,
  variantId: string,
  expectedVersion: number,
  updateFields: Record<string, any>
): Promise<OptimisticLockResult> {
  return await updateWithOptimisticLock(
    env,
    'product_variants',
    variantId,
    expectedVersion,
    updateFields
  );
}

/**
 * Update product with optimistic locking
 *
 * @param productId Product ID
 * @param expectedVersion Expected version
 * @param updateFields Fields to update
 * @returns OptimisticLockResult
 */
export async function updateProductWithLock(
  env: Env | null,
  productId: string,
  expectedVersion: number,
  updateFields: Record<string, any>
): Promise<OptimisticLockResult> {
  return await updateWithOptimisticLock(
    env,
    'products',
    productId,
    expectedVersion,
    updateFields
  );
}

/**
 * Handle version conflict error for user-facing operations
 * Returns a user-friendly error message
 */
export function getVersionConflictErrorMessage(entityType: string): string {
  return `This ${entityType} was modified by another user. Please refresh and try again.`;
}

/**
 * Retry operation on version conflict with exponential backoff
 *
 * @param operation Async operation to retry
 * @param maxRetries Maximum number of retries
 * @param delayMs Base delay between retries (ms)
 * @returns Result of operation or error
 */
export async function retryOnVersionConflict<T>(
  operation: () => Promise<OptimisticLockResult<T>>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<OptimisticLockResult<T>> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await operation();

    if (result.success) {
      return result;
    }

    // If not a version conflict or max retries reached, return the error
    if (!result.conflict || attempt === maxRetries) {
      return result;
    }

    lastError = new Error(result.error);

    // Wait before retry with exponential backoff
    const waitTime = delayMs * Math.pow(2, attempt - 1);
    console.log(`[Retry] Version conflict detected, retrying (${attempt}/${maxRetries}) after ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return {
    success: false,
    error: lastError?.message || 'Operation failed after retries',
  };
}
