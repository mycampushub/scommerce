import { db } from '@/lib/db';
import { inventory_movements, suppliers } from '@prisma/client';

export type InventoryMovementWithDetails = inventory_movements & {
  supplier?: suppliers | null;
  productName?: string;
  variantName?: string;
};

class InventoryMovementRepository {
  async findById(id: string): Promise<InventoryMovementWithDetails | null> {
    const movement = await db.inventory_movements.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!movement) return null;

    // Fetch product name
    const product = await db.products.findUnique({
      where: { id: movement.productId },
      select: { name: true },
    });

    // Fetch variant name if applicable
    let variantName: string | null | undefined = undefined;
    if (movement.variantId) {
      const variant = await db.product_variants.findUnique({
        where: { id: movement.variantId },
        select: { name: true },
      });
      variantName = variant?.name;
    }

    return {
      ...movement,
      productName: product?.name,
      variantName,
    } as InventoryMovementWithDetails;
  }

  async findAll(options?: {
    productId?: string;
    variantId?: string;
    movementType?: string;
    referenceId?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<InventoryMovementWithDetails[]> {
    const { productId, variantId, movementType, referenceId, referenceType, limit = 100, offset = 0 } = options || {};

    let where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (movementType) where.movementType = movementType;
    if (referenceId) where.referenceId = referenceId;
    if (referenceType) where.referenceType = referenceType;

    const movements = await db.inventory_movements.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Fetch all unique product and variant IDs
    const productIds = [...new Set(movements.map(m => m.productId))];
    const variantIds = [...new Set(movements.map(m => m.variantId).filter(Boolean) as string[])];

    // Fetch products and variants in batch
    const products = await db.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const variants = variantIds.length > 0
      ? await db.product_variants.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, name: true },
        })
      : [];

    // Create maps for quick lookup
    const productMap = new Map(products.map(p => [p.id, p.name]));
    const variantMap = new Map(variants.map(v => [v.id, v.name]));

    // Enrich movements with product and variant names
    return movements.map(movement => ({
      ...movement,
      productName: productMap.get(movement.productId),
      variantName: movement.variantId ? variantMap.get(movement.variantId) : undefined,
    })) as InventoryMovementWithDetails[];
  }

  async findByProduct(productId: string, variantId?: string, limit: number = 50): Promise<InventoryMovementWithDetails[]> {
    return this.findAll({ productId, variantId, limit });
  }

  async findByMovementType(movementType: string, limit: number = 100): Promise<InventoryMovementWithDetails[]> {
    return this.findAll({ movementType, limit });
  }

  async findByReference(referenceId: string, referenceType: string): Promise<InventoryMovementWithDetails[]> {
    return this.findAll({ referenceId, referenceType, limit: 1000 });
  }

  async create(data: Omit<inventory_movements, 'id' | 'createdAt'>): Promise<inventory_movements> {
    return db.inventory_movements.create({
      data: {
        ...data,
        id: `im-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    });
  }

  async count(options?: {
    productId?: string;
    variantId?: string;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const { productId, variantId, movementType, startDate, endDate } = options || {};

    let where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (movementType) where.movementType = movementType;
    if (startDate || endDate) {
      const createdAt: any = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    return db.inventory_movements.count({ where });
  }

  async getSummary(options?: {
    productId?: string;
    variantId?: string;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalMovements: number;
    totalQuantityIn: number;
    totalQuantityOut: number;
    totalCostIn: number;
    totalCostOut: number;
  }> {
    const { productId, variantId, movementType, startDate, endDate } = options || {};

    let where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (movementType) where.movementType = movementType;
    if (startDate || endDate) {
      const createdAt: any = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    const movements = await db.inventory_movements.findMany({
      where,
    });

    const totalMovements = movements.length;
    const totalQuantityIn = movements
      .filter((m) => m.quantity > 0)
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalQuantityOut = movements
      .filter((m) => m.quantity < 0)
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    const totalCostIn = movements
      .filter((m) => m.quantity > 0 && m.totalCost)
      .reduce((sum, m) => sum + (m.totalCost || 0), 0);
    const totalCostOut = movements
      .filter((m) => m.quantity < 0 && m.totalCost)
      .reduce((sum, m) => sum + (m.totalCost || 0), 0);

    return {
      totalMovements,
      totalQuantityIn,
      totalQuantityOut,
      totalCostIn,
      totalCostOut,
    };
  }
}

export const inventoryMovementRepository = new InventoryMovementRepository();
