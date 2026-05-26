import { Env } from '@/db/types';
import { getDatabase, shouldUsePrisma, getPrisma } from '@/db/unified-db';

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
 * Uses D1-style database API
 */
export type TransactionCallback<T = any> = (
  db: any,
  commit: () => Promise<void>,
  rollback: () => Promise<void>
) => Promise<T>;

/**
 * Execute a transaction using proper ACID guarantees
 * For D1: Uses batch() for atomic operations
 * For Prisma/SQLite: Uses BEGIN/COMMIT/ROLLBACK
 *
 * @param callback Function to execute within the transaction
 * @returns Transaction result with data or error
 */
export async function runTransaction<T = any>(
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  const env = await import('@/lib/cloudflare').then(m => m.getEnv());

  const db = getDatabase(env);
  if (!db) {
    return {
      success: false,
      error: 'Database not available',
    };
  }

  const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check if we're using Cloudflare D1 (has batch method)
  const isD1 = typeof (db as any).batch === 'function';

  if (isD1) {
    // Cloudflare D1 - use batch() for atomic transactions
    return await runD1Transaction(db, txId, callback);
  } else {
    // Prisma/SQLite - use traditional transactions
    return await runSQLiteTransaction(env, txId, callback);
  }
}

/**
 * Run D1 transaction using batch() API
 * D1 doesn't support BEGIN/COMMIT/ROLLBACK - uses batch() instead
 */
async function runD1Transaction<T>(
  db: any,
  txId: string,
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  // Collect all statements to execute
  const statements: Array<{ sql: string; params: any[] }> = [];

  // Create transaction-aware database wrapper that collects statements
  const txDb = {
    prepare: (sql: string) => {
      return {
        bind: (params: any[]) => {
          return {
            first: async () => {
              const stmt = db.prepare(sql).bind(...params);
              const result = await stmt.first();
              return result;
            },
            all: async () => {
              const stmt = db.prepare(sql).bind(...params);
              const result = await stmt.all();
              return result.results || [];
            },
            run: async () => {
              // Collect for batch execution
              statements.push({ sql, params });
              return { success: true };
            },
          };
        },
      };
    },
    // Execute immediately for SELECT queries
    batch: async (stmts: Array<{ sql: string; params: any[] }>) => {
      const batch = stmts.map(s => db.prepare(s.sql).bind(s.params));
      const results = await db.batch(batch);
      return results;
    },
  };

  try {
    console.log(`[${txId}] Starting D1 transaction...`);

    // Execute callback to collect statements
    const result = await callback(txDb, async () => {}, async () => {
      throw new Error('Transaction rolled back');
    });

    // Execute all statements atomically using batch()
    if (statements.length > 0) {
      console.log(`[${txId}] Executing ${statements.length} statements atomically via batch()...`);
      const batchStmts = statements.map(s => db.prepare(s.sql).bind(s.params));
      const batchResults = await db.batch(batchStmts);

      // Check for errors
      for (let i = 0; i < batchResults.length; i++) {
        const batchResult = batchResults[i];
        if ('error' in batchResult && batchResult.error) {
          throw new Error(`Batch operation failed: ${batchResult.error.message}`);
        }
      }
    }

    console.log(`[${txId}] Transaction completed successfully`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`[${txId}] Transaction error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Run SQLite transaction using Prisma's $transaction() for proper ACID guarantees
 * This provides better concurrency handling and automatic rollback on errors
 */
async function runSQLiteTransaction<T>(
  env: Env | null,
  txId: string,
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  const prisma = getPrisma();

  try {
    console.log(`[${txId}] Starting Prisma transaction...`);

    // Use Prisma's built-in $transaction() for proper ACID guarantees
    const result = await prisma.$transaction(async (tx) => {
      // Create Prisma transaction-aware database wrapper
      const txDb = {
        prepare: (sql: string) => {
          return {
            bind: (params: any[]) => {
              return {
                first: async () => {
                  const sqlTemplate = [sql] as unknown as TemplateStringsArray;
                  const results = await tx.$queryRaw<any>(sqlTemplate, ...params);
                  return Array.isArray(results) && results.length > 0 ? results[0] : null;
                },
                all: async () => {
                  const sqlTemplate = [sql] as unknown as TemplateStringsArray;
                  const results = await tx.$queryRaw<any>(sqlTemplate, ...params);
                  return Array.isArray(results) ? results : [];
                },
                run: async () => {
                  const sqlTemplate = [sql] as unknown as TemplateStringsArray;
                  await tx.$executeRaw(sqlTemplate, ...params);
                  return { success: true };
                },
              };
            },
          };
        },
        // Provide access to the transaction for Prisma model operations
        prisma: tx,
      };

      // Commit and rollback are handled automatically by Prisma $transaction()
      const result = await callback(txDb, async () => {}, async () => {
        throw new Error('Transaction rolled back');
      });

      return result;
    });

    console.log(`[${txId}] Prisma transaction completed successfully`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`[${txId}] Prisma transaction error:`, error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

/**
 * Execute multiple operations in a batch transaction
 * Useful for bulk operations where order doesn't matter
 *
 * @param operations Array of async functions to execute in the transaction
 * @returns Transaction result
 */
export async function runBatchTransaction(
  operations: Array<(db: any, commit: () => Promise<void>, rollback: () => Promise<void>) => Promise<void>>
): Promise<TransactionResult<void>> {
  return await runTransaction(async (db, commit, rollback) => {
    for (const operation of operations) {
      await operation(db, commit, rollback);
    }
    await commit();
  });
}

/**
 * With retry for transient failures
 * Useful for handling optimistic concurrency conflicts
 *
 * @param callback Transaction callback
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Base delay between retries (ms)
 * @returns Transaction result
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

    // Don't retry on certain errors (these are not transient)
    if (result.error?.includes('UNIQUE constraint') ||
        result.error?.includes('FOREIGN KEY constraint') ||
        result.error?.includes('NOT NULL constraint') ||
        result.error?.includes('Record to update not found')) {
      console.log(`[Retry] Non-transient error, not retrying: ${result.error}`);
      break;
    }

    // Wait before retry with exponential backoff
    if (attempt < maxRetries) {
      const waitTime = retryDelay * Math.pow(2, attempt - 1);
      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Transaction failed after retries',
  };
}

/**
 * Execute a transaction with optimistic locking
 * This is useful for preventing lost updates in high-concurrency scenarios
 *
 * @param callback Transaction callback that should return version number
 * @param maxRetries Maximum retry attempts for version conflicts
 * @returns Transaction result
 */
export async function runOptimisticTransaction<T>(
  callback: TransactionCallback<{ data: T; version: number }>,
  maxRetries: number = 5
): Promise<TransactionResult<T>> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await runTransaction(callback);

    if (result.success) {
      return {
        success: true,
        data: result.data!.data,
      };
    }

    lastError = new Error(result.error);

    // Check if this is a version conflict (optimistic locking failure)
    if (result.error?.includes('version') || result.error?.includes('concurrent')) {
      console.log(`[Optimistic Lock] Version conflict, retrying (${attempt}/${maxRetries})...`);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
        continue;
      }
    }

    // For other errors, don't retry
    break;
  }

  return {
    success: false,
    error: lastError?.message || 'Optimistic transaction failed',
  };
}

/**
 * Helper function to execute operations atomically
 * All operations must succeed or none will be applied
 *
 * @param operations Array of operations to execute
 * @returns Transaction result
 */
export async function executeAtomically<T>(
  operations: Array<(db: any, commit: () => Promise<void>, rollback: () => Promise<void>) => Promise<T>>
): Promise<TransactionResult<T[]>> {
  return await runTransaction(async (db, commit, rollback) => {
    const results: T[] = [];
    for (const operation of operations) {
      const result = await operation(db, commit, rollback);
      results.push(result);
    }
    await commit();
    return results;
  });
}
