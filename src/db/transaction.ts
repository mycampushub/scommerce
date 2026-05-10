import { Env } from './types';
import { execute, queryFirst } from './db';

/**
 * Transaction interface for manual transaction management
 * D1 doesn't support native transactions, so we implement a rollback pattern
 */
export interface Transaction {
  env: Env;
  rollbackSteps: Array<() => Promise<void>>;
  committed: boolean;
  rolledBack: boolean;
}

/**
 * Create a new transaction context
 */
export function createTransaction(env: Env): Transaction {
  return {
    env,
    rollbackSteps: [],
    committed: false,
    rolledBack: false,
  };
}

/**
 * Add a rollback step to the transaction
 * These steps will be executed if the transaction is rolled back
 */
export function addRollbackStep(
  transaction: Transaction,
  step: () => Promise<void>
): void {
  transaction.rollbackSteps.push(step);
}

/**
 * Commit the transaction (mark as successful)
 * After committing, rollback steps are cleared
 */
export function commitTransaction(transaction: Transaction): void {
  transaction.committed = true;
  transaction.rollbackSteps = []; // Clear rollback steps
}

/**
 * Rollback the transaction
 * Executes all rollback steps in reverse order
 */
export async function rollbackTransaction(transaction: Transaction): Promise<void> {
  if (transaction.rolledBack || transaction.committed) {
    return;
  }

  transaction.rolledBack = true;

  // Execute rollback steps in reverse order (LIFO)
  for (let i = transaction.rollbackSteps.length - 1; i >= 0; i--) {
    try {
      await transaction.rollbackSteps[i]();
    } catch (error) {
      console.error('[Transaction] Rollback step failed:', error);
      // Continue with other rollback steps even if one fails
    }
  }
}

/**
 * Execute a function within a transaction context
 * Automatically handles commit/rollback based on success/failure
 */
export async function withTransaction<T>(
  env: Env,
  fn: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = createTransaction(env);

  try {
    const result = await fn(transaction);

    if (!transaction.rolledBack) {
      commitTransaction(transaction);
    }

    return result;
  } catch (error) {
    if (!transaction.committed && !transaction.rolledBack) {
      await rollbackTransaction(transaction);
    }
    throw error;
  }
}

/**
 * Helper to track inserted record for rollback
 */
export function trackInsertForRollback(
  transaction: Transaction,
  table: string,
  id: string
): void {
  addRollbackStep(transaction, async () => {
    try {
      await execute(transaction.env, `DELETE FROM ${table} WHERE id = ?`, id);
    } catch (error) {
      console.error(`[Transaction] Failed to delete ${table} record ${id}:`, error);
    }
  });
}

/**
 * Helper to track stock update for rollback
 */
export function trackStockUpdateForRollback(
  transaction: Transaction,
  table: string,
  id: string,
  quantityDelta: number,
  isVariant: boolean = false
): void {
  addRollbackStep(transaction, async () => {
    try {
      // Revert the stock change
      const column = isVariant ? 'variantId' : 'productId';
      await execute(
        transaction.env,
        `UPDATE ${table} SET stock = stock + ? WHERE id = ?`,
        quantityDelta,
        id
      );
    } catch (error) {
      console.error(`[Transaction] Failed to revert stock for ${table} record ${id}:`, error);
    }
  });
}
