/**
 * Database Query Optimization
 * Helpers to optimize D1 queries for better performance
 */

import { D1PreparedStatement } from '@/db/types';

export interface QueryOptions {
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Fields to select */
  fields?: string[];
  /** Order by clause */
  orderBy?: string;
  /** Order direction */
  orderDirection?: 'ASC' | 'DESC';
  /** Where conditions */
  where?: string;
  /** Group by clause */
  groupBy?: string;
}

/**
 * Build optimized SELECT query
 */
export function buildSelectQuery(
  table: string,
  options: QueryOptions = {}
): { sql: string; params: unknown[] } {
  const {
    fields = ['*'],
    limit = 100,
    offset = 0,
    orderBy,
    orderDirection = 'ASC',
    where,
    groupBy,
  } = options;

  const params: unknown[] = [];
  const parts: string[] = [];

  // SELECT clause
  parts.push(`SELECT ${fields.join(', ')}`);
  parts.push(`FROM ${table}`);

  // WHERE clause
  if (where) {
    parts.push(`WHERE ${where}`);
  }

  // GROUP BY clause
  if (groupBy) {
    parts.push(`GROUP BY ${groupBy}`);
  }

  // ORDER BY clause
  if (orderBy) {
    parts.push(`ORDER BY ${orderBy} ${orderDirection}`);
  }

  // LIMIT and OFFSET
  parts.push(`LIMIT ? OFFSET ?`);
  params.push(limit, offset);

  return {
    sql: parts.join(' '),
    params,
  };
}

/**
 * Build COUNT query
 */
export function buildCountQuery(
  table: string,
  where?: string
): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const parts: string[] = [`SELECT COUNT(*) as count FROM ${table}`];

  if (where) {
    parts.push(`WHERE ${where}`);
    // Extract params from where clause (simplified)
    // In production, you'd want more sophisticated parsing
  }

  return {
    sql: parts.join(' '),
    params,
  };
}

/**
 * Build batch INSERT query
 */
export function buildBatchInsertQuery(
  table: string,
  columns: string[],
  values: unknown[][]
): { sql: string; params: unknown[] } {
  if (values.length === 0) {
    throw new Error('No values provided for batch insert');
  }

  const placeholders = values.map((row, rowIndex) => {
    const rowPlaceholders = row.map((_, colIndex) => {
      return `?`;
    });
    return `(${rowPlaceholders.join(', ')})`;
  });

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders.join(', ')}
  `;

  return {
    sql,
    params: values.flat(),
  };
}

/**
 * Build batch UPDATE query (D1 doesn't support batch updates directly,
 * but we can generate multiple UPDATE statements)
 */
export function buildBatchUpdateQuery(
  table: string,
  idColumn: string,
  updates: Array<{ id: string; [key: string]: unknown }>
): { sql: string; params: unknown[] } {
  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  const parts: string[] = [];
  const params: unknown[] = [];

  updates.forEach(update => {
    const id = update[idColumn];
    const setParts: string[] = [];

    Object.entries(update).forEach(([column, value]) => {
      if (column !== idColumn) {
        setParts.push(`${column} = ?`);
        params.push(value);
      }
    });

    parts.push(`UPDATE ${table} SET ${setParts.join(', ')} WHERE ${idColumn} = ?`);
    params.push(id);
  });

  return {
    sql: parts.join('; '),
    params,
  };
}

/**
 * Add index hint to query (for query optimization)
 */
export function addIndexHint(sql: string, indexName: string): string {
  return sql.replace(/FROM\s+(\w+)/, `FROM $1 INDEXED BY ${indexName}`);
}

/**
 * Create materialized view-like pattern using cache
 */
export async function cachedAggregate<T>(
  db: D1Database,
  cacheKey: string,
  query: string,
  params: unknown[] = [],
  ttl: number = 300000 // 5 minutes default
): Promise<T> {
  // Try to get from cache first
  const cached = await db
    .prepare(`SELECT value FROM query_cache WHERE key = ? AND expires_at > ?`)
    .bind(cacheKey, Date.now())
    .first();

  if (cached) {
    return JSON.parse(cached.value as string) as T;
  }

  // Execute query
  const result = await db.prepare(query).bind(...params).first() as T;

  // Cache the result
  await db
    .prepare(
      `INSERT OR REPLACE INTO query_cache (key, value, expires_at)
       VALUES (?, ?, ?)`
    )
    .bind(
      cacheKey,
      JSON.stringify(result),
      Date.now() + ttl
    )
    .run();

  return result;
}

/**
 * Optimize IN clause by batching (D1 has limits)
 */
export function buildInClauseBatch(
  column: string,
  values: unknown[],
  batchSize: number = 100
): string[] {
  const clauses: string[] = [];

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const placeholders = batch.map(() => '?').join(', ');
    clauses.push(`${column} IN (${placeholders})`);
  }

  return clauses;
}

/**
 * Build optimized full-text search query
 */
export function buildSearchQuery(
  table: string,
  searchColumn: string,
  searchTerm: string,
  options: QueryOptions = {}
): { sql: string; params: unknown[] } {
  const terms = searchTerm.trim().split(/\s+/);
  const likeConditions = terms.map(() => `${searchColumn} LIKE ?`);

  const where = `(${likeConditions.join(' OR ')})`;

  const params = terms.map(term => `%${term}%`);

  return buildSelectQuery(table, {
    ...options,
    where,
  }).sql.split(' WHERE ')[0] + ` WHERE ${where}`;
}

/**
 * Execute batch query with transaction
 */
export async function executeBatch(
  db: D1Database,
  statements: Array<{ sql: string; params: unknown[] }>
): Promise<void> {
  const preparedStatements = statements.map(stmt => {
    const prepared = db.prepare(stmt.sql);
    return stmt.params.length > 0 ? prepared.bind(...stmt.params) : prepared;
  });

  await db.batch(preparedStatements);
}

/**
 * Query with automatic retry for lock contention
 */
export async function queryWithRetry<T>(
  db: D1Database,
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a lock or timeout error
      const errorMsg = (error as Error).message.toLowerCase();
      const isLockError =
        errorMsg.includes('locked') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('database is locked');

      if (!isLockError || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, delay * Math.pow(2, attempt))
      );
    }
  }

  throw lastError!;
}

/**
 * Get query execution statistics (for monitoring)
 */
export interface QueryStats {
  query: string;
  executionTime: number;
  rowsAffected: number;
}

export async function queryWithStats<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<{ result: T; stats: QueryStats }> {
  const startTime = performance.now();

  const prepared = db.prepare(sql);
  const boundStatement = params.length > 0 ? prepared.bind(...params) : prepared;
  const result = await boundStatement.run();

  const executionTime = performance.now() - startTime;

  return {
    result: result as T,
    stats: {
      query: sql,
      executionTime,
      rowsAffected: result.meta.rows_written,
    },
  };
}

/**
 * Optimize by selecting only needed fields
 */
export function buildOptimizedSelect<T extends Record<string, unknown>>(
  table: string,
  fields: Array<keyof T>,
  options: QueryOptions = {}
): { sql: string; params: unknown[] } {
  return buildSelectQuery(
    table,
    {
      ...options,
      fields: fields.map(f => String(f)),
    }
  );
}

/**
 * Build recursive CTE for hierarchical data (categories, etc.)
 */
export function buildRecursiveCTE(
  table: string,
  idColumn: string,
  parentColumn: string,
  rootId: string
): string {
  return `
    WITH RECURSIVE category_tree AS (
      -- Base case: root category
      SELECT * FROM ${table}
      WHERE ${idColumn} = ?

      UNION ALL

      -- Recursive case: child categories
      SELECT c.* FROM ${table} c
      INNER JOIN category_tree ct ON c.${parentColumn} = ct.${idColumn}
    )
    SELECT * FROM category_tree
  `;
}

/**
 * Calculate optimal batch size based on row size
 */
export function calculateOptimalBatchSize(
  avgRowSize: number,
  maxMemory: number = 10 * 1024 * 1024 // 10MB default
): number {
  const maxRows = Math.floor(maxMemory / avgRowSize);
  return Math.min(1000, maxRows); // Cap at 1000 rows
}

/**
 * Build optimized query for related data (avoid N+1)
 */
export function buildRelatedQuery(
  mainTable: string,
  relatedTable: string,
  foreignKey: string,
  options: QueryOptions = {}
): string {
  return `
    SELECT ${options.fields?.join(', ') || `${mainTable}.*, ${relatedTable}.*`}
    FROM ${mainTable}
    LEFT JOIN ${relatedTable} ON ${mainTable}.id = ${relatedTable}.${foreignKey}
    ${options.where ? `WHERE ${options.where}` : ''}
    ${options.orderBy ? `ORDER BY ${options.orderBy}` : ''}
    ${options.limit ? `LIMIT ${options.limit}` : ''}
  `;
}

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private queries: Map<string, QueryStats[]> = new Map();
  private slowQueryThreshold = 1000; // 1 second

  record(query: string, stats: QueryStats): void {
    if (!this.queries.has(query)) {
      this.queries.set(query, []);
    }

    this.queries.get(query)!.push(stats);

    // Alert on slow queries
    if (stats.executionTime > this.slowQueryThreshold) {
      console.warn(`Slow query detected:`, {
        query,
        executionTime: stats.executionTime,
        rowsAffected: stats.rowsAffected,
      });
    }
  }

  getStats(query: string): QueryStats[] | undefined {
    return this.queries.get(query);
  }

  getAllStats(): Map<string, QueryStats[]> {
    return this.queries;
  }

  clear(): void {
    this.queries.clear();
  }
}
