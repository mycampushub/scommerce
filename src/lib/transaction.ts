import { getEnv } from '@/lib/cloudflare';
import { Env } from '@/db/types';
import { execute } from '@/db/db';
import prisma from '@/lib/database';

/**
 * Transaction result type
 */
export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Transaction callback type
 */
export type TransactionCallback<T = any> = (
  db: any,
  commit: () => Promise<void>,
  rollback: () => Promise<void>
) => Promise<T>;

/**
 * Execute a transaction
 * Works with both Prisma (local dev) and D1 (Cloudflare)
 *
 * @param callback Function to execute within the transaction
 * @returns Transaction result with data or error
 */
export async function runTransaction<T = any>(
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  const env = getEnv();

  // Use Prisma transaction for local development
  if (!env || !env.DB) {
    return await runPrismaTransaction(callback);
  }

  // Use D1 transaction for Cloudflare
  return await runD1Transaction(env, callback);
}

/**
 * Run Prisma transaction
 */
async function runPrismaTransaction<T>(
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const commit = async () => {
        // Prisma auto-commits on success, no manual commit needed
      };

      const rollback = async () => {
        // Prisma auto-rolls back on throw
        throw new Error('Transaction rolled back');
      };

      return await callback(tx, commit, rollback);
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Prisma transaction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Run D1 transaction
 */
async function runD1Transaction<T>(
  env: Env,
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Begin transaction
    await execute(env, 'BEGIN TRANSACTION');

    // Create transaction-aware database wrapper
    const txDb = {
      prepare: (sql: string) => {
        const stmt = env.DB.prepare(sql);
        return {
          bind: (params: any[]) => stmt.bind(params),
          first: async () => {
            const result = await stmt.first();
            return result;
          },
          all: async () => {
            const result = await stmt.all();
            return result.results || [];
          },
          run: async () => {
            return await stmt.run();
          },
        };
      },
    };

    // Commit function
    const commit = async () => {
      await execute(env, 'COMMIT');
    };

    // Rollback function
    const rollback = async () => {
      await execute(env, 'ROLLBACK');
      throw new Error('Transaction rolled back');
    };

    // Execute callback
    const result = await callback(txDb, commit, rollback);

    // Auto-commit if not already committed
    await execute(env, 'COMMIT');

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Ensure rollback on error
    try {
      await execute(env, 'ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }

    console.error(`D1 transaction error (${txId}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Execute multiple operations in a batch transaction
 * Useful for bulk operations where order doesn't matter
 */
export async function runBatchTransaction(
  operations: Array<() => Promise<void>>
): Promise<TransactionResult<void>> {
  return await runTransaction(async (db, commit, rollback) => {
    for (const operation of operations) {
      await operation();
    }
    await commit();
  });
}

/**
 * With retry for transient failures
 */
export async function runTransactionWithRetry<T>(
  callback: TransactionCallback<T>,
  maxRetries: number = 3,
  retryDelay: number = 100
): Promise<TransactionResult<T>> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await runTransaction(callback);

    if (result.success) {
      return result;
    }

    lastError = new Error(result.error);

    // Don't retry on certain errors
    if (result.error?.includes('UNIQUE constraint') ||
        result.error?.includes('FOREIGN KEY constraint') ||
        result.error?.includes('NOT NULL constraint')) {
      break;
    }

    // Wait before retry
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Transaction failed after retries',
  };
}
