import { Env, Promotion } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  buildPaginationClause,
  count,
} from '@/db/db';

export class PromotionRepository {
  /**
   * Find promotion by ID
   */
  static async findById(env: Env, id: string): Promise<Promotion | null> {
    return queryFirst<Promotion>(
      env,
      'SELECT * FROM promotions WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Create new promotion
   */
  static async create(env: Env, data: {
    title: string;
    description?: string;
    image: string;
    ctaText?: string;
    ctaLink?: string;
    type?: string;
    isActive?: boolean;
    orderNum?: number;
  }): Promise<Promotion> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO promotions (id, title, description, image, ctaText, ctaLink,
       type, isActive, orderNum, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.title,
      data.description || null,
      data.image,
      data.ctaText || null,
      data.ctaLink || null,
      data.type || 'banner',
      boolToNumber(data.isActive !== undefined ? data.isActive : true),
      data.orderNum || 0,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update promotion
   */
  static async update(env: Env, id: string, data: Partial<Promotion>): Promise<Promotion | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.image !== undefined) {
      updates.push('image = ?');
      values.push(data.image);
    }
    if (data.ctaText !== undefined) {
      updates.push('ctaText = ?');
      values.push(data.ctaText);
    }
    if (data.ctaLink !== undefined) {
      updates.push('ctaLink = ?');
      values.push(data.ctaLink);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(boolToNumber(data.isActive));
    }
    if (data.orderNum !== undefined) {
      updates.push('orderNum = ?');
      values.push(data.orderNum);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE promotions SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete promotion
   */
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM promotions WHERE id = ?', id);
  }

  /**
   * Get all active promotions
   */
  static async findAllActive(env: Env, type?: string): Promise<Promotion[]> {
    let sql = 'SELECT * FROM promotions WHERE isActive = 1';
    const params: unknown[] = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY orderNum ASC';

    return queryAll<Promotion>(env, sql, ...params);
  }

  /**
   * Get all promotions (with pagination)
   */
  static async findAll(
    env: Env,
    options: { limit?: number; offset?: number; type?: string; isActive?: boolean } = {}
  ): Promise<Promotion[]> {
    const { limit = 50, offset = 0, type, isActive } = options;
    const whereClause: string[] = [];
    const params: unknown[] = [];

    if (isActive !== undefined) {
      whereClause.push('isActive = ?');
      params.push(boolToNumber(isActive));
    }

    if (type) {
      whereClause.push('type = ?');
      params.push(type);
    }

    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    return queryAll<Promotion>(
      env,
      `SELECT * FROM promotions ${whereSQL} ORDER BY orderNum ASC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );
  }

  /**
   * Count promotions
   */
  static async count(env: Env, options: { type?: string; isActive?: boolean } = {}): Promise<number> {
    const { type, isActive } = options;
    const whereClause: string[] = [];
    const params: unknown[] = [];

    if (isActive !== undefined) {
      whereClause.push('isActive = ?');
      params.push(boolToNumber(isActive));
    }

    if (type) {
      whereClause.push('type = ?');
      params.push(type);
    }

    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    return count(env, 'promotions', whereSQL, ...params);
  }

  /**
   * Reorder promotions
   */
  static async reorder(env: Env, orders: Array<{ id: string; orderNum: number }>): Promise<void> {
    for (const item of orders) {
      await execute(
        env,
        'UPDATE promotions SET orderNum = ?, updatedAt = ? WHERE id = ?',
        item.orderNum,
        now(),
        item.id
      );
    }
  }
}
