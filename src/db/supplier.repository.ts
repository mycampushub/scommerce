import { Env, Supplier } from '@/db/types';
import {
  generateId,
  now,
  queryFirst,
  queryAll,
  execute,
} from '@/db/db';

/**
 * Generate a unique supplier code
 * Format: SUP-XXXX where XXXX is a sequential number
 */
async function generateSupplierCode(env: Env | null): Promise<string> {
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

  return `SUP-${sequence.toString().padStart(4, '0')}`;
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

  /**
   * Search suppliers
   */
  static async search(env: Env | null, query: string): Promise<Supplier[]> {
    try {
      const suppliers = await queryAll<Supplier>(
        env,
        `SELECT * FROM suppliers WHERE name LIKE ? OR email LIKE ? OR code LIKE ? ORDER BY name ASC`,
        `%${query}%`,
        `%${query}%`,
        `%${query}%`
      );
      return Array.isArray(suppliers) ? suppliers : [];
    } catch (error) {
      console.error('[SupplierRepository] Error searching suppliers:', error);
      return [];
    }
  }
}
