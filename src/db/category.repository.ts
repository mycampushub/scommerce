import { Env, Category } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  buildPaginationClause
} from '@/db/db';

export class CategoryRepository {
  /**
   * Find category by slug
   */
  static async findBySlug(env: Env, slug: string): Promise<Category | null> {
    return queryFirst<Category>(
      env,
      'SELECT * FROM categories WHERE slug = ? LIMIT 1',
      slug
    );
  }

  /**
   * Find category by ID
   */
  static async findById(env: Env, id: string): Promise<Category | null> {
    return queryFirst<Category>(
      env,
      'SELECT * FROM categories WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Create new category
   */
  static async create(env: Env, data: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive?: boolean;
  }): Promise<Category> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO categories (id, name, slug, description, image, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.name,
      data.slug,
      data.description || null,
      data.image || null,
      boolToNumber(data.isActive !== undefined ? true : data.isActive),
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update category
   */
  static async update(env: Env, id: string, data: Partial<Category>): Promise<Category | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      updates.push('slug = ?');
      values.push(data.slug);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.image !== undefined) {
      updates.push('image = ?');
      values.push(data.image);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(boolToNumber(data.isActive));
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete category
   */
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM categories WHERE id = ?', id);
  }

  /**
   * Get all active categories
   */
  static async findAllActive(env: Env): Promise<Category[]> {
    return queryAll<Category>(
      env,
      'SELECT * FROM categories WHERE isActive = 1 ORDER BY name ASC'
    );
  }

  /**
   * Get all categories (with pagination)
   */
  static async findAll(
    env: Env,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Category[]> {
    const pagination = buildPaginationClause(options);
    return queryAll<Category>(
      env,
      `SELECT * FROM categories ORDER BY createdAt DESC ${pagination}`
    );
  }

  /**
   * Count categories
   */
  static async count(env: Env): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM categories'
    );
    return result?.count || 0;
  }
}
