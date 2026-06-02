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
import {
  updateStockWithLock,
  getVersionConflictErrorMessage,
  retryOnVersionConflict,
  OptimisticLockResult
} from '@/lib/optimistic-lock';

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
      availableSizes: parseJSON<string[]>(product.availableSizes) || null,
      availableColors: parseJSON<string[]>(product.availableColors) || null,
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
      availableSizes: parseJSON<string[]>(product.availableSizes) || null,
      availableColors: parseJSON<string[]>(product.availableColors) || null,
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
    costPrice?: number;
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
    weight?: number;
    dimensions?: string;
    tags?: string[];
    // Brand fields (inline, no separate table)
    brandId?: string;
    brandName?: string;
    brandLogo?: string;
    // Size system fields
    sizeType?: 'unit' | 'label';
    sizeValue?: number;
    sizeUnit?: string;
    sizeLabel?: string;
    // Material and color for single products
    material?: string;
    color?: string;
    // Country of origin
    countryOfOrigin?: string;
    // Multi-size/color fields
    availableSizes?: string[];
    availableColors?: string[];
    // Inventory tracking fields
    totalPurchased?: number;
    totalSold?: number;
    totalCost?: number;
    averageCost?: number;
    lastPurchaseAt?: Date | string;
    lastPurchaseCost?: number;
  }): Promise<Product> {
    const id = generateId();
    const currentTime = now();

    console.log('[ProductRepository.create] Creating product with data:', {
      id,
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      basePrice: data.basePrice,
      stock: data.stock,
    });

    try {
      await execute(
        env,
        `INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, discount, discountType,
       images, stock, lowStockAlert, reorderLevel, reorderQty, isActive, isFeatured, hasVariants, weight, dimensions, tags,
       createdAt, updatedAt, costPrice, brandId, brandName, brandLogo, sizeType, sizeValue, sizeUnit, sizeLabel,
       material, color, countryOfOrigin, availableSizes, availableColors, totalPurchased, totalSold, totalCost, averageCost, lastPurchaseAt, lastPurchaseCost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      data.weight || null,
      data.dimensions || null,
      data.tags ? stringifyJSON(data.tags) : null,
      currentTime,
      currentTime,
      data.costPrice || null,
      data.brandId || null,
      data.brandName || null,
      data.brandLogo || null,
      data.sizeType || null,
      data.sizeValue || null,
      data.sizeUnit || null,
      data.sizeLabel || null,
      data.material || null,
      data.color || null,
      data.countryOfOrigin || null,
      data.availableSizes ? stringifyJSON(data.availableSizes) : null,
      data.availableColors ? stringifyJSON(data.availableColors) : null,
      data.totalPurchased || 0,
      data.totalSold || 0,
      data.totalCost || 0,
      data.averageCost || 0,
      data.lastPurchaseAt || null,
      data.lastPurchaseCost || null
      );

      console.log('[ProductRepository.create] Product inserted successfully, fetching by id:', id);

      return (await this.findById(env, id))!;
    } catch (error) {
      console.error('[ProductRepository.create] Error during product creation:', error);
      throw error;
    }
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
    // Handle price and basePrice - they should always be in sync
    if (data.price !== undefined || data.basePrice !== undefined) {
      // If only one is provided, use it for both
      const newPrice = data.price !== undefined ? data.price : (data.basePrice || 0);
      const newBasePrice = data.basePrice !== undefined ? data.basePrice : (data.price || 0);

      updates.push('price = ?');
      values.push(newPrice);
      updates.push('basePrice = ?');
      values.push(newBasePrice);
    }
    if (data.comparePrice !== undefined) {
      updates.push('comparePrice = ?');
      values.push(data.comparePrice);
    }
    if (data.costPrice !== undefined) {
      updates.push('costPrice = ?');
      values.push(data.costPrice);
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
    // Brand fields
    if (data.brandId !== undefined) {
      updates.push('brandId = ?');
      values.push(data.brandId);
    }
    if (data.brandName !== undefined) {
      updates.push('brandName = ?');
      values.push(data.brandName);
    }
    if (data.brandLogo !== undefined) {
      updates.push('brandLogo = ?');
      values.push(data.brandLogo);
    }
    // Size system fields
    if (data.sizeType !== undefined) {
      updates.push('sizeType = ?');
      values.push(data.sizeType);
    }
    if (data.sizeValue !== undefined) {
      updates.push('sizeValue = ?');
      values.push(data.sizeValue);
    }
    if (data.sizeUnit !== undefined) {
      updates.push('sizeUnit = ?');
      values.push(data.sizeUnit);
    }
    if (data.sizeLabel !== undefined) {
      updates.push('sizeLabel = ?');
      values.push(data.sizeLabel);
    }
    // Material and color for single products
    if (data.material !== undefined) {
      updates.push('material = ?');
      values.push(data.material);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }

    // Country of origin
    if (data.countryOfOrigin !== undefined) {
      updates.push('countryOfOrigin = ?');
      values.push(data.countryOfOrigin);
    }
    // Multi-size/color fields
    if (data.availableSizes !== undefined) {
      updates.push('availableSizes = ?');
      values.push(data.availableSizes != null && data.availableSizes.length > 0 ? stringifyJSON(data.availableSizes) : null);
    }
    if (data.availableColors !== undefined) {
      updates.push('availableColors = ?');
      values.push(data.availableColors != null && data.availableColors.length > 0 ? stringifyJSON(data.availableColors) : null);
    }
    // Inventory tracking fields
    if (data.totalPurchased !== undefined) {
      updates.push('totalPurchased = ?');
      values.push(data.totalPurchased);
    }
    if (data.totalSold !== undefined) {
      updates.push('totalSold = ?');
      values.push(data.totalSold);
    }
    if (data.totalCost !== undefined) {
      updates.push('totalCost = ?');
      values.push(data.totalCost);
    }
    if (data.averageCost !== undefined) {
      updates.push('averageCost = ?');
      values.push(data.averageCost);
    }
    if (data.lastPurchaseAt !== undefined) {
      updates.push('lastPurchaseAt = ?');
      values.push(data.lastPurchaseAt);
    }
    if (data.lastPurchaseCost !== undefined) {
      updates.push('lastPurchaseCost = ?');
      values.push(data.lastPurchaseCost);
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
    costPrice?: number;
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
    // Size system fields
    sizeType?: 'unit' | 'label';
    sizeValue?: number;
    sizeUnit?: string;
    sizeLabel?: string;
    // Country of origin
    countryOfOrigin?: string;
    // Inventory tracking fields
    totalPurchased?: number;
    totalSold?: number;
    totalCost?: number;
    averageCost?: number;
  }): Promise<ProductVariant> {
    const id = generateId();
    const currentTime = now();

    console.log('[ProductRepository.createVariant] About to create variant with data:', {
      id,
      productId: data.productId,
      sku: data.sku,
      name: data.name,
      price: data.price,
      size: data.size,
      color: data.color,
      material: data.material
    });

    await execute(
      env,
      `INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, images, size, color, material,
       isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt, costPrice,
       sizeType, sizeValue, sizeUnit, sizeLabel, countryOfOrigin, totalPurchased, totalSold, totalCost, averageCost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      currentTime,
      data.costPrice || null,
      data.sizeType || null,
      data.sizeValue || null,
      data.sizeUnit || null,
      data.sizeLabel || null,
      data.countryOfOrigin || null,
      data.totalPurchased || 0,
      data.totalSold || 0,
      data.totalCost || 0,
      data.averageCost || 0
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
    // Size system fields
    if (data.sizeType !== undefined) {
      updates.push('sizeType = ?');
      values.push(data.sizeType);
    }
    if (data.sizeValue !== undefined) {
      updates.push('sizeValue = ?');
      values.push(data.sizeValue);
    }
    if (data.sizeUnit !== undefined) {
      updates.push('sizeUnit = ?');
      values.push(data.sizeUnit);
    }
    if (data.sizeLabel !== undefined) {
      updates.push('sizeLabel = ?');
      values.push(data.sizeLabel);
    }
    // Country of origin
    if (data.countryOfOrigin !== undefined) {
      updates.push('countryOfOrigin = ?');
      values.push(data.countryOfOrigin);
    }
    // Inventory tracking fields
    if (data.totalPurchased !== undefined) {
      updates.push('totalPurchased = ?');
      values.push(data.totalPurchased);
    }
    if (data.totalSold !== undefined) {
      updates.push('totalSold = ?');
      values.push(data.totalSold);
    }
    if (data.totalCost !== undefined) {
      updates.push('totalCost = ?');
      values.push(data.totalCost);
    }
    if (data.averageCost !== undefined) {
      updates.push('averageCost = ?');
      values.push(data.averageCost);
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
   * Update variant stock with optimistic locking (prevents overselling in high-concurrency scenarios)
   * Uses version checking and automatic retry on conflicts
   */
  static async updateVariantStock(env: Env | null, id: string, quantity: number): Promise<void> {
    const result = await retryOnVersionConflict(async () => {
      return await updateStockWithLock(env, id, quantity, false);
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('product variant'));
      }
      throw new Error(result.error || 'Failed to update variant stock');
    }
  }

  /**
   * Update product stock with optimistic locking (for products without variants)
   * Uses version checking and automatic retry on conflicts
   */
  static async updateProductStock(env: Env | null, id: string, quantity: number): Promise<void> {
    const result = await retryOnVersionConflict(async () => {
      return await updateStockWithLock(env, id, quantity, true);
    });

    if (!result.success) {
      if (result.conflict) {
        throw new Error(getVersionConflictErrorMessage('product'));
      }
      throw new Error(result.error || 'Failed to update product stock');
    }
  }

  /**
   * Sync hasVariants flag for a product based on actual variants
   */
  static async syncHasVariants(env: Env | null, productId: string): Promise<void> {
    const variants = await queryAll<any>(
      env,
      'SELECT COUNT(*) as count FROM product_variants WHERE productId = ? AND isActive = 1',
      productId
    );

    const hasVariantsCount = variants[0]?.count || 0;
    const hasVariants = hasVariantsCount > 0;

    await execute(
      env,
      'UPDATE products SET hasVariants = ?, updatedAt = ? WHERE id = ?',
      boolToNumber(hasVariants),
      now(),
      productId
    );
  }

  /**
   * Sync hasVariants flag for all products
   */
  static async syncAllHasVariants(env: Env | null): Promise<{ updated: number }> {
    // Get all products
    const products = await queryAll<any>(
      env,
      'SELECT id, hasVariants FROM products'
    );

    let updated = 0;

    for (const product of products) {
      const variants = await queryFirst<{ count: number }>(
        env,
        'SELECT COUNT(*) as count FROM product_variants WHERE productId = ? AND isActive = 1',
        product.id
      );

      const hasVariantsCount = variants?.count || 0;
      const hasVariants = hasVariantsCount > 0;
      const currentHasVariants = typeof product.hasVariants === 'boolean' ? product.hasVariants : Boolean(product.hasVariants);

      // Update if out of sync
      if (currentHasVariants !== hasVariants) {
        await execute(
          env,
          'UPDATE products SET hasVariants = ?, updatedAt = ? WHERE id = ?',
          boolToNumber(hasVariants),
          now(),
          product.id
        );
        updated++;
      }
    }

    return { updated };
  }

  // Product Color Images (Multi-Size/Color System)
  /**
   * Get all color images for a product
   */
  static async getColorImages(env: Env | null, productId: string): Promise<Array<{ id: string; color: string; images: string[] }>> {
    const colorImages = await queryAll<any>(
      env,
      'SELECT * FROM product_color_images WHERE productId = ? ORDER BY color ASC',
      productId
    );

    return colorImages.map(ci => ({
      id: ci.id,
      color: ci.color,
      images: parseJSON<string[]>(ci.images) || []
    }));
  }

  /**
   * Get color images for a specific color
   */
  static async getColorImageForColor(env: Env | null, productId: string, color: string): Promise<{ id: string; color: string; images: string[] } | null> {
    const colorImage = await queryFirst<any>(
      env,
      'SELECT * FROM product_color_images WHERE productId = ? AND color = ? LIMIT 1',
      productId,
      color
    );

    if (!colorImage) return null;

    return {
      id: colorImage.id,
      color: colorImage.color,
      images: parseJSON<string[]>(colorImage.images) || []
    };
  }

  /**
   * Upsert (add or update) a color image for a product
   */
  static async upsertColorImage(env: Env | null, data: {
    productId: string;
    color: string;
    images: string[];
  }): Promise<{ id: string; color: string; images: string[] }> {
    const currentTime = now();

    // Check if color image already exists
    const existing = await this.getColorImageForColor(env, data.productId, data.color);

    if (existing) {
      // Update existing
      await execute(
        env,
        'UPDATE product_color_images SET images = ?, updatedAt = ? WHERE id = ?',
        data.images.length > 0 ? stringifyJSON(data.images) : null,
        currentTime,
        existing.id
      );

      return {
        id: existing.id,
        color: data.color,
        images: data.images
      };
    } else {
      // Insert new
      const id = generateId();
      await execute(
        env,
        'INSERT INTO product_color_images (id, productId, color, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        data.productId,
        data.color,
        data.images.length > 0 ? stringifyJSON(data.images) : null,
        currentTime,
        currentTime
      );

      return {
        id,
        color: data.color,
        images: data.images
      };
    }
  }

  /**
   * Delete a color image
   */
  static async deleteColorImage(env: Env | null, colorImageId: string): Promise<void> {
    await execute(env, 'DELETE FROM product_color_images WHERE id = ?', colorImageId);
  }

  /**
   * Delete all color images for a product
   */
  static async deleteAllColorImages(env: Env | null, productId: string): Promise<void> {
    await execute(env, 'DELETE FROM product_color_images WHERE productId = ?', productId);
  }

  /**
   * Update availableSizes and availableColors fields in products table
   */
  static async updateAvailableSizesAndColors(env: Env | null, productId: string, data: {
    availableSizes?: string[];
    availableColors?: string[];
  }): Promise<Product | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.availableSizes !== undefined) {
      updates.push('availableSizes = ?');
      values.push(data.availableSizes.length > 0 ? stringifyJSON(data.availableSizes) : null);
    }

    if (data.availableColors !== undefined) {
      updates.push('availableColors = ?');
      values.push(data.availableColors.length > 0 ? stringifyJSON(data.availableColors) : null);
    }

    if (updates.length === 0) return this.findById(env, productId);

    updates.push('updatedAt = ?');
    values.push(now());
    values.push(productId);

    await execute(
      env,
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, productId);
  }

  /**
   * Generate variant combinations from size × color matrix
   * Supports three modes:
   * 1. Both sizes and colors: creates size × color combinations
   * 2. Only sizes: creates one variant per size
   * 3. Only colors: creates one variant per color
   */
  static async generateVariantCombinations(env: Env | null, data: {
    productId: string;
    sizes: string[];
    colors: string[];
    basePrice: number;
    baseStock: number;
    material?: string;
  }): Promise<{ generated: number; variants: ProductVariant[] }> {
    const { productId, sizes, colors, basePrice, baseStock, material } = data;
    const variants: ProductVariant[] = [];
    let counter = 0;

    console.log('[ProductRepository.generateVariantCombinations] Generating variants:', {
      productId,
      sizes,
      colors,
      basePrice,
      baseStock,
      material
    });

    // Determine mode: both, sizes-only, or colors-only
    const hasSizes = sizes && sizes.length > 0;
    const hasColors = colors && colors.length > 0;
    const mode = hasSizes && hasColors ? 'both' : (hasSizes ? 'sizes' : (hasColors ? 'colors' : 'none'));

    if (mode === 'none') {
      console.log('[ProductRepository.generateVariantCombinations] No sizes or colors provided, skipping');
      return { generated: 0, variants: [] };
    }

    if (mode === 'both') {
      // Original behavior: create size × color combinations
      for (const color of colors) {
        for (const size of sizes) {
          counter++;

          // Generate variant name
          const variantName = `${size} / ${color}${material ? ` / ${material}` : ''}`;

          // Generate SKU (will be checked for conflicts later)
          const sku = `${productId.substring(0, 8).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${size.toUpperCase()}`;

          // Check if variant already exists
          const existing = await queryFirst<any>(
            env,
            'SELECT * FROM product_variants WHERE productId = ? AND size = ? AND color = ? LIMIT 1',
            productId,
            size,
            color
          );

          if (!existing) {
            const variant = await this.createVariant(env, {
              productId,
              sku,
              name: variantName,
              price: basePrice,
              stock: baseStock,
              size,
              color,
              material,
              isDefault: counter === 1,
              isActive: true
            });
            variants.push(variant);
          } else {
            console.log('[ProductRepository.generateVariantCombinations] Variant already exists:', {
              size,
              color,
              sku: existing.sku
            });
            variants.push({
              ...existing,
              images: parseJSON<string[]>(existing.images) || [],
              isActive: typeof existing.isActive === 'boolean' ? existing.isActive : Boolean(existing.isActive),
              isDefault: typeof existing.isDefault === 'boolean' ? existing.isDefault : Boolean(existing.isDefault)
            });
          }
        }
      }
    } else if (mode === 'sizes') {
      // Create one variant per size
      for (const size of sizes) {
        counter++;

        // Generate variant name
        const variantName = `${size}${material ? ` / ${material}` : ''}`;

        // Generate SKU
        const sku = `${productId.substring(0, 8).toUpperCase()}-${size.toUpperCase()}`;

        // Check if variant already exists
        const existing = await queryFirst<any>(
          env,
          'SELECT * FROM product_variants WHERE productId = ? AND size = ? AND (color IS NULL OR color = ?) LIMIT 1',
          productId,
          size,
          ''
        );

        if (!existing) {
          const variant = await this.createVariant(env, {
            productId,
            sku,
            name: variantName,
            price: basePrice,
            stock: baseStock,
            size,
            color: undefined,
            material,
            isDefault: counter === 1,
            isActive: true
          });
          variants.push(variant);
        } else {
          console.log('[ProductRepository.generateVariantCombinations] Variant already exists:', {
            size,
            sku: existing.sku
          });
          variants.push({
            ...existing,
            images: parseJSON<string[]>(existing.images) || [],
            isActive: typeof existing.isActive === 'boolean' ? existing.isActive : Boolean(existing.isActive),
            isDefault: typeof existing.isDefault === 'boolean' ? existing.isDefault : Boolean(existing.isDefault)
          });
        }
      }
    } else if (mode === 'colors') {
      // Create one variant per color
      for (const color of colors) {
        counter++;

        // Generate variant name
        const variantName = `${color}${material ? ` / ${material}` : ''}`;

        // Generate SKU
        const sku = `${productId.substring(0, 8).toUpperCase()}-${color.substring(0, 3).toUpperCase()}`;

        // Check if variant already exists
        const existing = await queryFirst<any>(
          env,
          'SELECT * FROM product_variants WHERE productId = ? AND color = ? AND (size IS NULL OR size = ?) LIMIT 1',
          productId,
          color,
          ''
        );

        if (!existing) {
          const variant = await this.createVariant(env, {
            productId,
            sku,
            name: variantName,
            price: basePrice,
            stock: baseStock,
            size: undefined,
            color,
            material,
            isDefault: counter === 1,
            isActive: true
          });
          variants.push(variant);
        } else {
          console.log('[ProductRepository.generateVariantCombinations] Variant already exists:', {
            color,
            sku: existing.sku
          });
          variants.push({
            ...existing,
            images: parseJSON<string[]>(existing.images) || [],
            isActive: typeof existing.isActive === 'boolean' ? existing.isActive : Boolean(existing.isActive),
            isDefault: typeof existing.isDefault === 'boolean' ? existing.isDefault : Boolean(existing.isDefault)
          });
        }
      }
    }

    // Update product's hasVariants flag and available sizes/colors
    await this.syncHasVariants(env, productId);
    await this.updateAvailableSizesAndColors(env, productId, {
      availableSizes: sizes,
      availableColors: colors
    });

    console.log('[ProductRepository.generateVariantCombinations] Generated:', {
      total: variants.length,
      new: counter
    });

    return { generated: variants.length, variants };
  }
}
