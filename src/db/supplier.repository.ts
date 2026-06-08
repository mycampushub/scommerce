import { Env, Supplier } from '@/db/types';
import {
  generateId,
  now,
  queryFirst,
  queryAll,
  execute,
  retry,
} from '@/db/db';

/**
 * Generate a unique supplier code with retry logic to prevent race conditions
 * Format: SUP-XXXX where XXXX is a sequential number
 * Uses retry mechanism to handle unique constraint violations from concurrent requests
 */
async function generateSupplierCode(env: Env | null): Promise<string> {
  // Use retry to handle race conditions from concurrent supplier creation
  return await retry(async () => {
    // Find the last supplier code
    const lastSupplier = await queryFirst<{ code: string }>(
      env,
      'SELECT code FROM suppliers WHERE code LIKE "SUP-%" ORDER BY code DESC LIMIT 1'
    );

    let sequence = 1;
    if (lastSupplier && lastSupplier.code) {
      // Extract numeric part from code (e.g., SUP-0001 -> 1)
      const match = lastSupplier.code.match(/SUP-(\d+)/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    const code = `SUP-${sequence.toString().padStart(4, '0')}`;

    // Check if this code already exists (double-check for race condition)
    const existing = await queryFirst<{ id: string }>(
      env,
      'SELECT id FROM suppliers WHERE code = ? LIMIT 1',
      code
    );

    if (existing) {
      // Code already exists - this means there was a race condition
      // Throw an error to trigger retry
      throw new Error(`Supplier code ${code} already exists - retrying`);
    }

    return code;
  }, 5, 50); // Retry up to 5 times with 50ms base delay
}

export class SupplierRepository {
  /**
   * Find supplier by ID
   */
  static async findById(env: Env | null, id: string): Promise<Supplier | null> {
    return queryFirst<Supplier>(
      env,
      'SELECT * FROM suppliers WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Find supplier by code
   */
  static async findByCode(env: Env | null, code: string): Promise<Supplier | null> {
    return queryFirst<Supplier>(
      env,
      'SELECT * FROM suppliers WHERE code = ? LIMIT 1',
      code
    );
  }

  /**
   * Get all suppliers with pagination
   */
  static async findAllPaginated(env: Env | null, options: { activeOnly?: boolean } = {}, limit: number = 20, offset: number = 0): Promise<Supplier[]> {
    const { activeOnly = false } = options;

    const whereClause = activeOnly ? 'WHERE isActive = 1' : '';

    const suppliers = await queryAll<Supplier>(
      env,
      `SELECT * FROM suppliers ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      ...(activeOnly ? [1] : []),
      limit,
      offset
    );

    return Array.isArray(suppliers) ? suppliers : [];
  }

  /**
   * Search suppliers with pagination
   */
  static async searchPaginated(env: Env | null, query: string, activeOnly: boolean = false, limit: number = 20, offset: number = 0): Promise<Supplier[]> {
    const whereClause = activeOnly ? 'WHERE isActive = 1' : '';
    
    const suppliers = await queryAll<Supplier>(
      env,
      `SELECT * FROM suppliers WHERE name LIKE ? OR email LIKE ? OR code LIKE ? ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      ...(activeOnly ? [1] : []),
      limit,
      offset
    );

    return Array.isArray(suppliers) ? suppliers : [];
  }

  /**
   * Get all suppliers
   */
  static async findAll(env: Env | null, options: { activeOnly?: boolean } = {}): Promise<Supplier[]> {
    try {
      const { activeOnly = false } = options;
      const whereClause = activeOnly ? 'WHERE isActive = 1' : '';

      const suppliers = await queryAll<Supplier>(
        env,
        `SELECT * FROM suppliers ${whereClause} ORDER BY name ASC`
      );
      return Array.isArray(suppliers) ? suppliers : [];
    } catch (error) {
      console.error('[SupplierRepository] Error fetching suppliers:', error);
      return [];
    }
  }

  /**
   * Search suppliers
   */
  static async search(env: Env | null, query: string, activeOnly: boolean = false): Promise<Supplier[]> {
    try {
      const whereClause = activeOnly ? 'WHERE isActive = 1' : '';
      
      const suppliers = await queryAll<Supplier>(
        env,
        `SELECT * FROM suppliers WHERE name LIKE ? OR email LIKE ? OR code LIKE ? ${whereClause} ORDER BY name ASC LIMIT 20`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`,
        ...(activeOnly ? [1] : [])
      );
      return Array.isArray(suppliers) ? suppliers : [];
    } catch (error) {
      console.error('[SupplierRepository] Error searching suppliers:', error);
      return [];
    }
  }

  /**
   * Create new supplier
   */
  static async create(env: Env | null, data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    notes?: string;
    isActive?: boolean;
    code?: string;
  }): Promise<Supplier> {
    const id = generateId();
    const code = data.code || await generateSupplierCode(env);
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO suppliers (id, code, name, email, phone, address, city, country, notes, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      code,
      data.name,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.city || null,
      data.country || null,
      data.notes || null,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update supplier
   */
  static async update(env: Env | null, id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      values.push(data.code);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.city !== undefined) {
      updates.push('city = ?');
      values.push(data.city);
    }
    if (data.country !== undefined) {
      updates.push('country = ?');
      values.push(data.country);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : data.isActive);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete supplier
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM suppliers WHERE id = ?', id);
  }

  /**
   * Count suppliers
   */
  static async count(env: Env | null): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM suppliers'
    );
    return result?.count || 0;
  }
}
