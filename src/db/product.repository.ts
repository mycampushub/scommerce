import { Env, Product, ProductVariant, Category } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  buildPaginationClause,
  parseJSON,
  stringifyJSON
} from '@/db/db';

export class ProductRepository {
  /**
   * Find product by slug
   */
  static async findBySlug(env: Env | null, slug: string): Promise<Product | null> {
    const product = await queryFirst<any>(
      env,
      'SELECT * FROM products WHERE slug = ? AND isActive = 1 LIMIT 1',
      slug
    );
    if (!product) return null;

    // Parse JSON fields
    return {
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    };
  }

  /**
   * Find product by ID
   */
  static async findById(env: Env | null, id: string): Promise<Product | null> {
    const product = await queryFirst<any>(
      env,
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      id
    );
    if (!product) return null;

    // Parse JSON fields
    return {
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    };
  }

  /**
   * Create new product
   */
  static async create(env: Env | null, data: {
    name: string;
    slug: string;
    description?: string;
    categoryId: string;
    price?: number;
    basePrice?: number;
    comparePrice?: number;
    discount?: number;
    discountType?: string;
    images?: string[];
    stock?: number;
    lowStockAlert?: number;
    reorderLevel?: number;
    reorderQty?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    hasVariants?: boolean;
  }): Promise<Product> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice,
       discount, discountType, images, stock, lowStockAlert, reorderLevel, reorderQty,
       isActive, isFeatured, hasVariants, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.name,
      data.slug,
      data.description || null,
      data.categoryId,
      data.price ?? data.basePrice ?? 0,
      data.basePrice || 0,
      data.comparePrice || null,
      data.discount || 0,
      data.discountType || 'percentage',
      data.images ? stringifyJSON(data.images) : null,
      data.stock || 0,
      data.lowStockAlert || 10,
      data.reorderLevel || 5,
      data.reorderQty || 20,
      boolToNumber(data.isActive ?? true),
      boolToNumber(data.isFeatured || false),
      boolToNumber(data.hasVariants || false),
      currentTime,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update product
   */
  static async update(env: Env | null, id: string, data: Partial<Product>): Promise<Product | null> {
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
    if (data.categoryId !== undefined) {
      updates.push('categoryId = ?');
      values.push(data.categoryId);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.basePrice !== undefined) {
      updates.push('basePrice = ?');
      values.push(data.basePrice);
    }
    if (data.comparePrice !== undefined) {
      updates.push('comparePrice = ?');
      values.push(data.comparePrice);
    }
    if (data.discount !== undefined) {
      updates.push('discount = ?');
      values.push(data.discount);
    }
    if (data.discountType !== undefined) {
      updates.push('discountType = ?');
      values.push(data.discountType);
    }
    if (data.images !== undefined) {
      updates.push('images = ?');
      values.push(stringifyJSON(data.images));
    }
    if (data.stock !== undefined) {
      updates.push('stock = ?');
      values.push(data.stock);
    }
    if (data.lowStockAlert !== undefined) {
      updates.push('lowStockAlert = ?');
      values.push(data.lowStockAlert);
    }
    if (data.reorderLevel !== undefined) {
      updates.push('reorderLevel = ?');
      values.push(data.reorderLevel);
    }
    if (data.reorderQty !== undefined) {
      updates.push('reorderQty = ?');
      values.push(data.reorderQty);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(typeof data.isActive === 'boolean' ? boolToNumber(data.isActive) : data.isActive);
    }
    if (data.isFeatured !== undefined) {
      updates.push('isFeatured = ?');
      values.push(typeof data.isFeatured === 'boolean' ? boolToNumber(data.isFeatured) : data.isFeatured);
    }
    if (data.hasVariants !== undefined) {
      updates.push('hasVariants = ?');
      values.push(typeof data.hasVariants === 'boolean' ? boolToNumber(data.hasVariants) : data.hasVariants);
    }

    if (updates.length === 0) return this.findById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Delete product
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM products WHERE id = ?', id);
  }

  /**
   * Get all active products
   */
  static async findAllActive(env: Env | null, options: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    const { limit = 50, offset = 0 } = options;
    const products = await queryAll<any>(
      env,
      `SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      limit,
      offset
    );
    // Parse JSON fields for each product
    return products.map(product => ({
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    }));
  }

  /**
   * Get featured products
   */
  static async findFeatured(env: Env | null, limit: number = 10): Promise<Product[]> {
    const products = await queryAll<any>(
      env,
      `SELECT * FROM products WHERE isActive = 1 AND isFeatured = 1 ORDER BY createdAt DESC LIMIT ?`,
      limit
    );
    // Parse JSON fields for each product
    return products.map(product => ({
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    }));
  }

  /**
   * Get products by category
   */
  static async findByCategory(
    env: Env | null,
    categoryId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Product[]> {
    const { limit = 50, offset = 0 } = options;
    const products = await queryAll<any>(
      env,
      `SELECT * FROM products WHERE categoryId = ? AND isActive = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      categoryId,
      limit,
      offset
    );
    // Parse JSON fields for each product
    return products.map(product => ({
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    }));
  }

  /**
   * Search products
   */
  static async search(env: Env | null, query: string, limit: number = 20): Promise<Product[]> {
    const products = await queryAll<any>(
      env,
      `SELECT * FROM products WHERE isActive = 1 AND (name LIKE ? OR description LIKE ?)
       ORDER BY createdAt DESC LIMIT ?`,
      `%${query}%`,
      `%${query}%`,
      limit
    );
    // Parse JSON fields for each product
    return products.map(product => ({
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    }));
  }

  /**
   * Get all products (with pagination)
   */
  static async findAll(
    env: Env | null,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Product[]> {
    const pagination = buildPaginationClause(options);
    const products = await queryAll<any>(
      env,
      `SELECT * FROM products ORDER BY createdAt DESC ${pagination}`
    );
    // Parse JSON fields for each product
    return products.map(product => ({
      ...product,
      images: parseJSON<string[]>(product.images) || [],
      isActive: typeof product.isActive === 'boolean' ? product.isActive : Boolean(product.isActive),
      isFeatured: typeof product.isFeatured === 'boolean' ? product.isFeatured : Boolean(product.isFeatured),
      hasVariants: typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants)
    }));
  }

  /**
   * Count active products
   */
  static async countActive(env : Env | null): Promise<number> {
    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM products WHERE isActive = 1'
    );
    return result?.count || 0;
  }

  // Product Variants
  /**
   * Get variants for a product
   */
  static async getVariants(env: Env | null, productId: string): Promise<ProductVariant[]> {
    const variants = await queryAll<any>(
      env,
      'SELECT * FROM product_variants WHERE productId = ? AND isActive = 1 ORDER BY createdAt ASC',
      productId
    );
    // Parse JSON fields for each variant
    return variants.map(variant => ({
      ...variant,
      images: parseJSON<string[]>(variant.images) || [],
      isActive: typeof variant.isActive === 'boolean' ? variant.isActive : Boolean(variant.isActive),
      isDefault: typeof variant.isDefault === 'boolean' ? variant.isDefault : Boolean(variant.isDefault)
    }));
  }

  /**
   * Find variant by SKU
   */
  static async findVariantBySKU(env: Env | null, sku: string): Promise<ProductVariant | null> {
    const variant = await queryFirst<any>(
      env,
      'SELECT * FROM product_variants WHERE sku = ? LIMIT 1',
      sku
    );
    if (!variant) return null;

    // Parse JSON fields
    return {
      ...variant,
      images: parseJSON<string[]>(variant.images) || [],
      isActive: typeof variant.isActive === 'boolean' ? variant.isActive : Boolean(variant.isActive),
      isDefault: typeof variant.isDefault === 'boolean' ? variant.isDefault : Boolean(variant.isDefault)
    };
  }

  /**
   * Create product variant
   */
  static async createVariant(env: Env | null, data: {
    productId: string;
    sku: string;
    name: string;
    price: number;
    comparePrice?: number;
    stock?: number;
    images?: string[];
    size?: string;
    color?: string;
    material?: string;
    isActive?: boolean;
    isDefault?: boolean;
    lowStockAlert?: number;
    reorderLevel?: number;
    reorderQty?: number;
  }): Promise<ProductVariant> {
    const id = generateId();
    const currentTime = now();

    await execute(
      env,
      `INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock,
       images, size, color, material, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.productId,
      data.sku,
      data.name,
      data.price,
      data.comparePrice || null,
      data.stock || 0,
      data.images ? stringifyJSON(data.images) : null,
      data.size || null,
      data.color || null,
      data.material || null,
      boolToNumber(data.isActive ?? true),
      boolToNumber(data.isDefault || false),
      data.lowStockAlert || 10,
      data.reorderLevel || 5,
      data.reorderQty || 20,
      currentTime,
      currentTime
    );

    return (await this.findVariantById(env, id))!;
  }

  /**
   * Find variant by ID
   */
  static async findVariantById(env: Env | null, id: string): Promise<ProductVariant | null> {
    const variant = await queryFirst<any>(
      env,
      'SELECT * FROM product_variants WHERE id = ? LIMIT 1',
      id
    );
    if (!variant) return null;

    // Parse JSON fields
    return {
      ...variant,
      images: parseJSON<string[]>(variant.images) || [],
      isActive: typeof variant.isActive === 'boolean' ? variant.isActive : Boolean(variant.isActive),
      isDefault: typeof variant.isDefault === 'boolean' ? variant.isDefault : Boolean(variant.isDefault)
    };
  }

  /**
   * Update product variant
   */
  static async updateVariant(env: Env | null, id: string, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.sku !== undefined) {
      updates.push('sku = ?');
      values.push(data.sku);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.comparePrice !== undefined) {
      updates.push('comparePrice = ?');
      values.push(data.comparePrice);
    }
    if (data.stock !== undefined) {
      updates.push('stock = ?');
      values.push(data.stock);
    }
    if (data.images !== undefined) {
      updates.push('images = ?');
      values.push(stringifyJSON(data.images));
    }
    if (data.size !== undefined) {
      updates.push('size = ?');
      values.push(data.size);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.material !== undefined) {
      updates.push('material = ?');
      values.push(data.material);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(typeof data.isActive === 'boolean' ? boolToNumber(data.isActive) : data.isActive);
    }
    if (data.isDefault !== undefined) {
      updates.push('isDefault = ?');
      values.push(typeof data.isDefault === 'boolean' ? boolToNumber(data.isDefault) : data.isDefault);
    }
    if (data.lowStockAlert !== undefined) {
      updates.push('lowStockAlert = ?');
      values.push(data.lowStockAlert);
    }
    if (data.reorderLevel !== undefined) {
      updates.push('reorderLevel = ?');
      values.push(data.reorderLevel);
    }
    if (data.reorderQty !== undefined) {
      updates.push('reorderQty = ?');
      values.push(data.reorderQty);
    }

    if (updates.length === 0) return this.findVariantById(env, id);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(id);

    await execute(
      env,
      `UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findVariantById(env, id);
  }

  /**
   * Delete product variant
   */
  static async deleteVariant(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM product_variants WHERE id = ?', id);
  }

  /**
   * Update variant stock
   */
  static async updateVariantStock(env: Env | null, id: string, quantity: number): Promise<void> {
    await execute(
      env,
      'UPDATE product_variants SET stock = ?, updatedAt = ? WHERE id = ?',
      quantity,
      now(),
      id
    );
  }

  /**
   * Update product stock
   */
  static async updateProductStock(env: Env | null, id: string, quantity: number): Promise<void> {
    await execute(
      env,
      'UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?',
      quantity,
      now(),
      id
    );
  }
}
