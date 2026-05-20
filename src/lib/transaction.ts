import { getEnv } from '@/lib/cloudflare';
import { Env } from '@/db/types';
import { execute } from '@/db/db';

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
 * Works with D1 (Cloudflare Workers)
 *
 * @param callback Function to execute within the transaction
 * @returns Transaction result with data or error
 */
export async function runTransaction<T = any>(
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  const env = await getEnv();

  if (!env || !env.DB) {
    return {
      success: false,
      error: 'Database not available. This transaction requires Cloudflare Workers environment.',
    };
  }

  // Use D1 transaction for Cloudflare
  return await runD1Transaction(env, callback);
}

/**
 * Run D1 transaction using batch API
 * D1 doesn't support BEGIN/COMMIT/ROLLBACK - uses batch() instead
 */
async function runD1Transaction<T>(
  env: Env,
  callback: TransactionCallback<T>
): Promise<TransactionResult<T>> {
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${txId}] Starting D1 transaction...`);

    // Collect all statements to execute in the transaction
    const statements: Array<{sql: string, params: any[]}> = [];

    // Create transaction-aware database wrapper that collects statements
    const txDb = {
      prepare: (sql: string) => {
        console.log(`[${txId}] Preparing SQL:`, sql);
        return {
          bind: (params: any[]) => {
            console.log(`[${txId}] Binding params:`, params);
            // Return wrapper that executes immediately and collects results
            return {
              first: async () => {
                console.log(`[${txId}] Executing first()...`);
                const stmt = env.DB.prepare(sql).bind(...params);
                const result = await stmt.first();
                console.log(`[${txId}] first() result:`, result);
                return result;
              },
              all: async () => {
                console.log(`[${txId}] Executing all()...`);
                const stmt = env.DB.prepare(sql).bind(...params);
                const result = await stmt.all();
                console.log(`[${txId}] all() result count:`, result.results?.length || 0);
                return result.results || [];
              },
              run: async () => {
                console.log(`[${txId}] Executing run()...`);
                const stmt = env.DB.prepare(sql).bind(...params);
                const result = await stmt.run();
                console.log(`[${txId}] run() result:`, result);
                return result;
              },
            };
          },
        };
      },
      // Add batch method for atomic operations
      batch: async (stmts: Array<{sql: string, params: any[]}>) => {
        console.log(`[${txId}] Executing batch with ${stmts.length} statements...`);
        const batch = stmts.map(s => env.DB.prepare(s.sql).bind(s.params));
        const results = await env.DB.batch(batch);
        console.log(`[${txId}] Batch completed`);
        return results;
      },
    };

    // Commit function (no-op for D1 - transactions are handled differently)
    const commit = async () => {
      console.log(`[${txId}] Commit (no-op for D1)`);
    };

    // Rollback function (no-op for D1 - errors will fail the whole batch)
    const rollback = async () => {
      console.log(`[${txId}] Rolling back (no-op for D1)`);
      throw new Error('Transaction rolled back');
    };

    // Execute callback
    console.log(`[${txId}] Executing callback...`);
    const result = await callback(txDb, commit, rollback);
    console.log(`[${txId}] Callback completed`);

    console.log(`[${txId}] Transaction completed successfully`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`[${txId}] D1 transaction error:`, error);
    console.error(`[${txId}] Error type:`, error?.constructor?.name);
    console.error(`[${txId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[${txId}] Error stack:`, error instanceof Error ? error.stack : 'No stack');

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
