import { Env } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  count,
} from '@/db/db';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  country?: string | null;
  isActive: number;
  featured: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BrandCreateInput = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>;
export type BrandUpdateInput = Partial<BrandCreateInput>;

export class BrandRepository {
  /**
   * Find brand by ID
   */
  static async findById(env: Env | null, id: string): Promise<Brand | null> {
    return queryFirst<Brand>(
      env,
      'SELECT * FROM brands WHERE id = ? LIMIT 1',
      id
    );
  }

  /**
   * Find brand by slug
   */
  static async findBySlug(env: Env | null, slug: string): Promise<Brand | null> {
    return queryFirst<Brand>(
      env,
      'SELECT * FROM brands WHERE slug = ? LIMIT 1',
      slug
    );
  }

  /**
   * Find all brands with pagination
   */
  static async findAllPaginated(env: Env | null, options?: {
    activeOnly?: boolean;
    featuredOnly?: boolean;
    includeProductCount?: boolean;
  }, limit: number = 20, offset: number = 0): Promise<(Brand & { productCount?: number })[]> {
    const { activeOnly = false, featuredOnly = false, includeProductCount = false } = options || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (activeOnly) {
      conditions.push('isActive = ?');
      params.push(1);
    }
    if (featuredOnly) {
      conditions.push('featured = ?');
      params.push(1);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const brands = await queryAll<Brand>(
      env,
      `SELECT * FROM brands ${whereClause} ORDER BY sortOrder ASC, name ASC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    if (includeProductCount && brands.length > 0) {
      const brandsWithCount = await Promise.all(
        brands.map(async (brand) => {
          const productCount = await count(
            env,
            'products',
            'WHERE brandId = ?',
            brand.id
          );
          return {
            ...brand,
            productCount,
          };
        })
      );
      return brandsWithCount;
    }

    return brands;
  }

  /**
   * Find all brands
   */
  static async findAll(env: Env | null, options?: {
    activeOnly?: boolean;
    featuredOnly?: boolean;
    includeProductCount?: boolean;
  }): Promise<(Brand & { productCount?: number })[]> {
    const { activeOnly = false, featuredOnly = false, includeProductCount = false } = options || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (activeOnly) {
      conditions.push('isActive = ?');
      params.push(1);
    }
    if (featuredOnly) {
      conditions.push('featured = ?');
      params.push(1);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const brands = await queryAll<Brand>(
      env,
      `SELECT * FROM brands ${whereClause} ORDER BY sortOrder ASC, name ASC`,
      ...params
    );

    if (includeProductCount && brands.length > 0) {
      const brandsWithCount = await Promise.all(
        brands.map(async (brand) => {
          const productCount = await count(
            env,
            'products',
            'WHERE brandId = ?',
            brand.id
          );
          return {
            ...brand,
            productCount,
          };
        })
      );
      return brandsWithCount;
    }

    return brands;
  }

  /**
   * Search brands with pagination
   */
  static async searchPaginated(env: Env | null, query: string, activeOnly: boolean = false, featuredOnly: boolean = false, includeProductCount: boolean = false, limit: number = 20, offset: number = 0): Promise<(Brand & { productCount?: number })[]> {
    const conditions: string[] = ['(name LIKE ? OR slug LIKE ?)'];
    const params: unknown[] = [`%${query}%`, `%${query.toLowerCase()}%`];

    if (activeOnly) {
      conditions.push('isActive = ?');
      params.push(1);
    }
    if (featuredOnly) {
      conditions.push('featured = ?');
      params.push(1);
    }

    const brands = await queryAll<Brand>(
      env,
      `SELECT * FROM brands WHERE ${conditions.join(' AND ')} ORDER BY sortOrder ASC, name ASC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    if (includeProductCount && brands.length > 0) {
      const brandsWithCount = await Promise.all(
        brands.map(async (brand) => {
          const productCount = await count(
            env,
            'products',
            'WHERE brandId = ?',
            brand.id
          );
          return {
            ...brand,
            productCount,
          };
        })
      );
      return brandsWithCount;
    }

    return brands;
  }

  /**
   * Search brands
   */
  static async search(env: Env | null, query: string, activeOnly: boolean = false): Promise<Brand[]> {
    const conditions: string[] = ['(name LIKE ? OR slug LIKE ?)'];
    const params: unknown[] = [`%${query}%`, `%${query.toLowerCase()}%`];

    if (activeOnly) {
      conditions.push('isActive = ?');
      params.push(1);
    }

    return queryAll<Brand>(
      env,
      `SELECT * FROM brands WHERE ${conditions.join(' AND ')} ORDER BY sortOrder ASC, name ASC LIMIT 20`,
      ...params
    );
  }

  /**
   * Create new brand
   */
  static async create(env: Env | null, data: BrandCreateInput): Promise<Brand> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO brands (id, name, slug, logo, website, description, country, isActive, featured, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.name,
      data.slug,
      data.logo || null,
      data.website || null,
      data.description || null,
      data.country || null,
      boolToNumber(data.isActive),
      boolToNumber(data.featured),
      data.sortOrder,
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update brand
   */
  static async update(env: Env | null, id: string, data: BrandUpdateInput): Promise<Brand | null> {
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
    if (data.logo !== undefined) {
      updates.push('logo = ?');
      values.push(data.logo);
    }
    if (data.website !== undefined) {
      updates.push('website = ?');
      values.push(data.website);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.country !== undefined) {
      updates.push('country = ?');
      values.push(data.country);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(boolToNumber(data.isActive));
    }
    if (data.featured !== undefined) {
      updates.push('featured = ?');
      values.push(boolToNumber(data.featured));
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
      `UPDATE brands SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete brand
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM brands WHERE id = ?', id);
  }

  /**
   * Count brands
   */
  static async count(env: Env | null, options?: { activeOnly?: boolean }): Promise<number> {
    const { activeOnly = false } = options || {};
    const whereClause = activeOnly ? 'WHERE isActive = 1' : '';
    return count(env, 'brands', whereClause);
  }

  /**
   * Check brand usage (how many products use this brand)
   */
  static async checkUsage(env: Env | null, id: string): Promise<{ products: number }> {
    const products = await count(
      env,
      'products',
      'WHERE brandId = ?',
      id
    );
    return { products };
  }

  /**
   * Get featured brands
   */
  static async getFeatured(env: Env | null, limit?: number): Promise<Brand[]> {
    // Validate and sanitize limit to prevent SQL injection
    const safeLimit = limit ? Math.min(Math.max(Math.floor(Number(limit)), 1), 100) : 100;
    
    return queryAll<Brand>(
      env,
      'SELECT * FROM brands WHERE isActive = 1 AND featured = 1 ORDER BY sortOrder ASC, name ASC LIMIT ?',
      safeLimit
    );
  }
}

// Export instance for backward compatibility
export const brandRepository = {
  findById: (id: string) => BrandRepository.findById(null, id),
  findBySlug: (slug: string) => BrandRepository.findBySlug(null, slug),
  findAll: (options?: any) => BrandRepository.findAll(null, options),
  search: (query: string, activeOnly?: boolean) => BrandRepository.search(null, query, activeOnly),
  create: (data: any) => BrandRepository.create(null, data),
  update: (id: string, data: any) => BrandRepository.update(null, id, data),
  delete: (id: string) => BrandRepository.delete(null, id),
  count: (options?: any) => BrandRepository.count(null, options),
  checkUsage: (id: string) => BrandRepository.checkUsage(null, id),
  getFeatured: (limit?: number) => BrandRepository.getFeatured(null, limit),
};
