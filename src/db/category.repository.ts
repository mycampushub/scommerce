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
  static async findBySlug(env: Env | null, slug: string): Promise<Category | null> {
    return queryFirst<Category>(
      env,
      'SELECT * FROM categories WHERE slug = ? LIMIT 1',
      slug
    );
  }

  /**
   * Find category by ID
   */
  static async findById(env: Env | null, id: string): Promise<Category | null> {
    return queryFirst<Category>(
      env,
      'SELECT * FROM categories WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Create new category
   */
  static async create(env: Env | null, data: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive?: boolean;
    parentId?: string;
    sortOrder?: number;
  }): Promise<Category> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO categories (id, name, slug, description, image, isActive, parentId, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.name,
      data.slug,
      data.description || null,
      data.image || null,
      boolToNumber(typeof data.isActive === "boolean" ? data.isActive : (data.isActive !== undefined)),
      data.parentId || null,
      data.sortOrder || 0,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update category
   */
  static async update(env: Env | null, id: string, data: Partial<Category>): Promise<Category | null> {
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
      values.push(boolToNumber(typeof data.isActive === "boolean" ? data.isActive : (data.isActive !== undefined)));
    }
    if (data.parentId !== undefined) {
      updates.push('parentId = ?');
      values.push(data.parentId);
    }
    if (data.sortOrder !== undefined) {
      updates.push('sortOrder = ?');
      values.push(data.sortOrder);
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
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM categories WHERE id = ?', id);
  }

  /**
   * Count products in a category
   */
  static async countProducts(env: Env | null, id: string): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM products WHERE categoryId = ?'
    );
    return result?.count || 0;
  }

  /**
   * Get all active categories
   */
  static async findAllActive(env : Env | null): Promise<Category[]> {
    try {
      const categories = await queryAll<Category>(
        env,
        'SELECT * FROM categories WHERE isActive = 1 ORDER BY name ASC'
      );
      // Ensure categories is always an array
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('[CategoryRepository] Error fetching active categories:', error);
      return [];
    }
  }

  /**
   * Get all categories (with pagination)
   */
  static async findAll(
    env: Env | null,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Category[]> {
    try {
      const pagination = buildPaginationClause(options);
      const categories = await queryAll<Category>(
        env,
        `SELECT * FROM categories ORDER BY createdAt DESC ${pagination}`
      );
      // Ensure categories is always an array
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('[CategoryRepository] Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Count categories
   */
  static async count(env : Env | null): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM categories'
    );
    return result?.count || 0;
  }

  /**
   * Get children of a category
   */
  static async getChildren(env: Env | null, parentId: string): Promise<Category[]> {
    try {
      const categories = await queryAll<Category>(
        env,
        'SELECT * FROM categories WHERE parentId = ? ORDER BY sortOrder ASC, name ASC',
        parentId
      );
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('[CategoryRepository] Error fetching children:', error);
      return [];
    }
  }

  /**
   * Get root categories (no parent)
   */
  static async getRootCategories(env: Env | null): Promise<Category[]> {
    try {
      const categories = await queryAll<Category>(
        env,
        'SELECT * FROM categories WHERE parentId IS NULL ORDER BY sortOrder ASC, name ASC'
      );
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('[CategoryRepository] Error fetching root categories:', error);
      return [];
    }
  }

  /**
   * Get category tree (hierarchical structure)
   */
  static async getTree(env: Env | null): Promise<(Category & { children: Category[] })[]> {
    try {
      const allCategories = await queryAll<Category>(
        env,
        'SELECT * FROM categories WHERE isActive = 1 ORDER BY parentId ASC, sortOrder ASC, name ASC'
      );
      const categories = Array.isArray(allCategories) ? allCategories : [];

      // Build tree structure
      const categoryMap = new Map<string, (Category & { children: Category[] })>();
      const roots: (Category & { children: Category[] })[] = [];

      // Initialize all categories with empty children array
      for (const category of categories) {
        categoryMap.set(category.id, { ...category, children: [] });
      }

      // Build hierarchy
      for (const category of categories) {
        const node = categoryMap.get(category.id)!;

        if (!category.parentId) {
          // Root category
          roots.push(node);
        } else {
          // Add to parent's children
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(node);
          }
        }
      }

      return roots;
    } catch (error) {
      console.error('[CategoryRepository] Error fetching category tree:', error);
      return [];
    }
  }

  /**
   * Get category with full path (breadcrumb)
   */
  static async getWithPath(env: Env | null, id: string): Promise<(Category & { path: Category[] }) | null> {
    try {
      const category = await this.findById(env, id);
      if (!category) return null;

      const path: Category[] = [category];
      let current = category;

      // Walk up the tree
      while (current.parentId) {
        const parent = await this.findById(env, current.parentId);
        if (!parent) break;
        path.unshift(parent);
        current = parent;
      }

      return { ...category, path };
    } catch (error) {
      console.error('[CategoryRepository] Error fetching category with path:', error);
      return null;
    }
  }
}
