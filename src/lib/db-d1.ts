/**
 * D1 Database Client Wrapper for Cloudflare Pages
 * This provides a simplified interface for D1 database operations
 */

export interface Env {
  DB: D1Database;
}

export interface D1Database {
  prepare: (sql: string, params?: any[]) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<any>;
  exec: (sql: string) => D1Result;
}

export interface D1PreparedStatement {
  bind: (params: any[]) => D1PreparedStatement;
  first: () => Promise<any>;
  all: () => Promise<any[]>;
  run: () => Promise<D1Result>;
}

export interface D1Result {
  success: boolean;
  meta: any;
  results?: any[];
}

/**
 * Generate a unique ID (similar to cuid)
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return prefix + timestamp + randomPart;
}

/**
 * Format a date for SQLite
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Parse SQLite date to Date object
 */
export function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  return new Date(dateString);
}

/**
 * Convert boolean to SQLite integer
 */
export function toBool(value: any): boolean {
  if (value === null || value === undefined) return false;
  return value === 1 || value === '1' || value === true;
}

/**
 * Convert SQLite integer to boolean
 */
export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Parse JSON from SQLite string
 */
export function parseJson<T = any>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Stringify JSON for SQLite
 */
export function toJson(value: any): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

/**
 * D1 Query Builder helper
 */
export class D1Client {
  constructor(private db: D1Database) {}

  /**
   * Execute a raw SQL query and return all results
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    const results = await stmt.all(...params);
    return results.results as T[];
  }

  /**
   * Execute a query and return the first result
   */
  async first<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const result = await stmt.first(...params);
    return result as T | null;
  }

  /**
   * Execute a query and return the run result
   */
  async run(sql: string, params: any[] = []): Promise<D1Result> {
    const stmt = this.db.prepare(sql);
    return await stmt.run(...params);
  }

  /**
   * Insert a record and return the inserted ID
   */
  async insert(table: string, data: Record<string, any>): Promise<string> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.run(sql, values);

    if (result.success && result.meta?.last_row_id) {
      return result.meta.last_row_id.toString();
    }

    // If we have an id, return it
    return data.id || generateId();
  }

  /**
   * Update records and return affected count
   */
  async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams: any[] = []
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = [...Object.values(data), ...whereParams];
    const setClause = keys.map((k) => `${k} = ?`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const result = await this.run(sql, values);

    return result.meta?.changes || 0;
  }

  /**
   * Delete records and return affected count
   */
  async delete(
    table: string,
    where: string,
    params: any[] = []
  ): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.run(sql, params);

    return result.meta?.changes || 0;
  }

  /**
   * Check if a record exists
   */
  async exists(
    table: string,
    where: string,
    params: any[] = []
  ): Promise<boolean> {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
    const result = await this.first<{ count: number }>(sql, params);

    return (result?.count || 0) > 0;
  }

  /**
   * Get record by ID
   */
  async getById<T = any>(table: string, id: string): Promise<T | null> {
    return await this.first<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  }

  /**
   * Get all records from table with optional filtering
   */
  async getAll<T = any>(
    table: string,
    where?: string,
    params: any[] = [],
    orderBy: string = 'createdAt DESC',
    limit?: number
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${table}`;
    const allParams = [...params];

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      sql += ` LIMIT ?`;
      allParams.push(limit);
    }

    return await this.query<T>(sql, allParams);
  }
}

/**
 * Create a D1 client from the request context
 */
export function createD1Client(env: Env): D1Client {
  return new D1Client(env.DB);
}
