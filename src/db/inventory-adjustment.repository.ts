import { Env } from './types';
import { queryFirst, queryAll, execute, count as dbCount, generateId, now, boolToNumber } from './db';
import { runTransaction } from '@/lib/transaction';

interface InventoryAdjustment {
  id: string;
  productId: string;
  variantId: string | null;
  adjustmentType: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityDiff: number;
  reason: string;
  notes: string | null;
  approvedBy: string | null;
  approved: number | boolean;
  approvedAt: string | null;
  createdAt: string;
}

interface InventoryAdjustmentWithRelations extends InventoryAdjustment {
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    categoryId: string;
    brandName: string | null;
    countryOfOrigin: string | null;
    sizeType: string | null;
    sizeValue: string | null;
    sizeUnit: string | null;
    sizeLabel: string | null;
  } | null;
  variant: {
    id: string;
    name: string;
    stock: number;
    productId: string;
  } | null;
}

class InventoryAdjustmentRepository {
  async findById(env: Env | null, id: string): Promise<InventoryAdjustment | null> {
    const sql = `
      SELECT 
        id, productId, variantId, adjustmentType, 
        quantityBefore, quantityAfter, quantityDiff, 
        reason, notes, approvedBy, approved, approvedAt, createdAt
      FROM inventory_adjustments
      WHERE id = ?
    `;
    return await queryFirst<InventoryAdjustment>(env, sql, id);
  }

  async findAll(
    env: Env | null,
    options?: {
      productId?: string;
      variantId?: string;
      adjustmentType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<InventoryAdjustmentWithRelations[]> {
    const { productId, variantId, adjustmentType, limit = 100, offset = 0 } = options || {};

    // Build WHERE clause conditions
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (productId) {
      conditions.push('ia.productId = ?');
      params.push(productId);
    }
    if (variantId) {
      conditions.push('ia.variantId = ?');
      params.push(variantId);
    }
    if (adjustmentType) {
      conditions.push('ia.adjustmentType = ?');
      params.push(adjustmentType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Main query with JOINs for products and variants
    const sql = `
      SELECT 
        ia.id,
        ia.productId,
        ia.variantId,
        ia.adjustmentType,
        ia.quantityBefore,
        ia.quantityAfter,
        ia.quantityDiff,
        ia.reason,
        ia.notes,
        ia.approvedBy,
        ia.approved,
        ia.approvedAt,
        ia.createdAt,
        json_object(
          'id', p.id,
          'name', p.name,
          'slug', p.slug,
          'stock', p.stock,
          'categoryId', p.categoryId,
          'brandName', p.brandName,
          'countryOfOrigin', p.countryOfOrigin,
          'sizeType', p.sizeType,
          'sizeValue', p.sizeValue,
          'sizeUnit', p.sizeUnit,
          'sizeLabel', p.sizeLabel
        ) as product,
        CASE WHEN ia.variantId IS NOT NULL THEN
          json_object(
            'id', v.id,
            'name', v.name,
            'stock', v.stock,
            'productId', v.productId
          )
        ELSE NULL END as variant
      FROM inventory_adjustments ia
      LEFT JOIN products p ON ia.productId = p.id
      LEFT JOIN product_variants v ON ia.variantId = v.id
      ${whereClause}
      ORDER BY ia.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const results = await queryAll<
      InventoryAdjustmentWithRelations & { product: string; variant: string }
    >(env, sql, ...params, limit, offset);

    // Parse JSON fields and convert approved to boolean
    return results.map(row => ({
      ...row,
      product: row.product ? JSON.parse(row.product) : null,
      variant: row.variant ? JSON.parse(row.variant) : null,
      approved: row.approved === 1,
    }));
  }

  async findByProduct(
    env: Env | null,
    productId: string,
    variantId?: string,
    limit: number = 50
  ): Promise<InventoryAdjustmentWithRelations[]> {
    return this.findAll(env, { productId, variantId, limit });
  }

  async create(
    env: Env | null,
    data: Omit<InventoryAdjustment, 'id' | 'createdAt'>
  ): Promise<InventoryAdjustment> {
    const id = generateId();
    const createdAt = now();

    const sql = `
      INSERT INTO inventory_adjustments (
        id, productId, variantId, adjustmentType,
        quantityBefore, quantityAfter, quantityDiff,
        reason, notes, approvedBy, approved, approvedAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await execute(
      env,
      sql,
      id,
      data.productId,
      data.variantId,
      data.adjustmentType,
      data.quantityBefore,
      data.quantityAfter,
      data.quantityDiff,
      data.reason,
      data.notes,
      data.approvedBy,
      typeof data.approved === 'boolean' ? (data.approved ? 1 : 0) : data.approved,
      data.approvedAt,
      createdAt
    );

    return {
      id,
      ...data,
      approved: typeof data.approved === 'boolean' ? data.approved : data.approved === 1,
      createdAt,
    };
  }

  async applyAdjustment(
    env: Env | null,
    data: {
      productId: string;
      variantId?: string;
      adjustmentType: string;
      quantityBefore: number;
      quantityAfter: number;
      reason: string;
      approvedBy?: string;
    }
  ): Promise<{ adjustment: InventoryAdjustment; movement: any }> {
    const { productId, variantId, adjustmentType, quantityBefore, quantityAfter, reason, approvedBy } = data;

    // Calculate difference
    const quantityDiff = quantityAfter - quantityBefore;

    // Use transaction to ensure atomicity - adjustment + stock update + movement must all succeed or all fail
    const result = await runTransaction(async (db, commit, rollback) => {
      const adjustmentId = generateId();
      const currentTime = now();

      // Create adjustment record
      await db.prepare(
        `INSERT INTO inventory_adjustments (
          id, productId, variantId, adjustmentType, quantityBefore, quantityAfter,
          quantityDiff, reason, notes, approvedBy, approved, approvedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        adjustmentId,
        productId,
        variantId || null,
        adjustmentType,
        quantityBefore,
        quantityAfter,
        quantityDiff,
        reason,
        reason || null,
        approvedBy || null,
        0,
        null,
        currentTime
      ).run();

      // Update inventory
      if (variantId) {
        await db.prepare(
          `UPDATE product_variants SET stock = ? WHERE id = ?`
        ).bind(quantityAfter, variantId).run();
      } else {
        await db.prepare(
          `UPDATE products SET stock = ? WHERE id = ?`
        ).bind(quantityAfter, productId).run();
      }

      // Create inventory movement
      const movementId = generateId();
      await db.prepare(
        `INSERT INTO inventory_movements (
          id, productId, variantId, movementType, quantity,
          unitCost, totalCost, referenceId, referenceType,
          supplierId, approved, approvedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        movementId,
        productId,
        variantId || null,
        'ADJUSTMENT',
        quantityDiff,
        null,
        null,
        adjustmentId,
        'ADJUSTMENT',
        null,
        1,
        currentTime,
        currentTime
      ).run();

      // Commit the transaction
      await commit();

      return { adjustmentId, movementId };
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to apply adjustment');
    }

    if (!result.data) {
      throw new Error('Transaction result data is missing');
    }

    // Fetch and return the created records
    const adjustment = await this.findById(env, result.data.adjustmentId);
    const movement = await queryFirst<any>(env, 'SELECT * FROM inventory_movements WHERE id = ?', result.data.movementId);

    if (!adjustment || !movement) {
      throw new Error('Failed to retrieve adjustment records');
    }

    return { adjustment, movement };
  }

  async count(
    env: Env | null,
    options?: {
      productId?: string;
      variantId?: string;
      adjustmentType?: string;
    }
  ): Promise<number> {
    const { productId, variantId, adjustmentType } = options || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (productId) {
      conditions.push('productId = ?');
      params.push(productId);
    }
    if (variantId) {
      conditions.push('variantId = ?');
      params.push(variantId);
    }
    if (adjustmentType) {
      conditions.push('adjustmentType = ?');
      params.push(adjustmentType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return await dbCount(env, `SELECT COUNT(*) as count FROM inventory_adjustments ${whereClause}`, ...params);
  }
}

export const inventoryAdjustmentRepository = new InventoryAdjustmentRepository();
