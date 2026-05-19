import { db } from '@/lib/db';
import { inventory_adjustments } from '@prisma/client';

class InventoryAdjustmentRepository {
  async findById(id: string): Promise<inventory_adjustments | null> {
    return db.inventory_adjustments.findUnique({
      where: { id },
    });
  }

  async findAll(options?: {
    productId?: string;
    variantId?: string;
    adjustmentType?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { productId, variantId, adjustmentType, limit = 100, offset = 0 } = options || {};

    let where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (adjustmentType) where.adjustmentType = adjustmentType;

    const adjustments = await db.inventory_adjustments.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Fetch all related products
    const productIds = [...new Set(adjustments.map(a => a.productId))];
    const products = await db.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        brandName: true,
        countryOfOrigin: true,
        sizeType: true,
        sizeValue: true,
        sizeUnit: true,
        sizeLabel: true,
        categories: {
          select: { id: true, name: true }
        }
      }
    });

    // Fetch all related variants
    const variantIds = adjustments.map(a => a.variantId).filter(Boolean) as string[];
    let variants: any[] = [];
    if (variantIds.length > 0) {
      variants = await db.product_variants.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          name: true,
          stock: true,
          productId: true,
        }
      });
    }

    // Create maps for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));
    const variantMap = new Map(variants.map(v => [v.id, v]));

    // Merge data
    return adjustments.map(adjustment => ({
      ...adjustment,
      product: productMap.get(adjustment.productId) || null,
      variant: adjustment.variantId ? variantMap.get(adjustment.variantId) : null,
    }));
  }

  async findByProduct(productId: string, variantId?: string, limit: number = 50): Promise<inventory_adjustments[]> {
    return this.findAll({ productId, variantId, limit });
  }

  async create(data: Omit<inventory_adjustments, 'id' | 'createdAt'>): Promise<inventory_adjustments> {
    return db.inventory_adjustments.create({
      data: {
        ...data,
        id: `ia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });
  }

  async applyAdjustment(data: {
    productId: string;
    variantId?: string;
    adjustmentType: string;
    quantityBefore: number;
    quantityAfter: number;
    reason: string;
    approvedBy?: string;
  }): Promise<{ adjustment: inventory_adjustments; movement: any }> {
    const { productId, variantId, adjustmentType, quantityBefore, quantityAfter, reason, approvedBy } = data;

    // Calculate difference
    const quantityDiff = quantityAfter - quantityBefore;

    // Create adjustment record
    const adjustment = await this.create({
      productId,
      variantId: variantId || null,
      adjustmentType,
      quantityBefore,
      quantityAfter,
      quantityDiff,
      reason,
      approvedBy: approvedBy || null,
      approved: 0,
      approvedAt: null,
    });

    // Update inventory
    if (variantId) {
      await db.product_variants.update({
        where: { id: variantId },
        data: {
          stock: quantityAfter,
        },
      });
    } else {
      await db.products.update({
        where: { id: productId },
        data: {
          stock: quantityAfter,
        },
      });
    }

    // Create inventory movement
    const movement = await db.inventory_movements.create({
      data: {
        id: `im-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productId,
        variantId: variantId || null,
        movementType: 'ADJUSTMENT',
        quantity: quantityDiff,
        unitCost: null,
        totalCost: null,
        referenceId: adjustment.id,
        referenceType: 'ADJUSTMENT',
        supplierId: null,
        approved: 1,
        approvedAt: new Date(),
      },
    });

    return { adjustment, movement };
  }

  async count(options?: {
    productId?: string;
    variantId?: string;
    adjustmentType?: string;
  }): Promise<number> {
    const { productId, variantId, adjustmentType } = options || {};

    let where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (adjustmentType) where.adjustmentType = adjustmentType;

    return db.inventory_adjustments.count({ where });
  }
}

export const inventoryAdjustmentRepository = new InventoryAdjustmentRepository();
