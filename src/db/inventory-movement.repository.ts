import type { Env } from './types';
import { queryFirst, queryAll, execute, count, generateId, now } from './db';

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string | null;
  movementType: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  referenceId: string | null;
  referenceType: string | null;
  approved: number;
  approvedAt: string | null;
  supplierId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  isActive: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementWithDetails = InventoryMovement & {
  supplier?: Supplier | null;
  productName?: string;
  variantName?: string;
};

class InventoryMovementRepository {
  async findById(env: Env | null, id: string): Promise<InventoryMovementWithDetails | null> {
    const movement = await queryFirst<any>(
      env,
      `SELECT
        im.*,
        s.id as supplier_id,
        s.code as supplier_code,
        s.name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address as supplier_address,
        s.city as supplier_city,
        s.country as supplier_country,
        s.isActive as supplier_isActive,
        s.notes as supplier_notes,
        s.createdAt as supplier_createdAt,
        s.updatedAt as supplier_updatedAt,
        p.name as productName,
        pv.name as variantName
      FROM inventory_movements im
      LEFT JOIN suppliers s ON im.supplierId = s.id
      LEFT JOIN products p ON im.productId = p.id
      LEFT JOIN product_variants pv ON im.variantId = pv.id
      WHERE im.id = ?`,
      id
    );

    if (!movement) return null;

    // Format supplier object if exists
    if (movement['supplier_id']) {
      movement.supplier = {
        id: movement['supplier_id'],
        code: movement['supplier_code'],
        name: movement['supplier_name'],
        email: movement['supplier_email'],
        phone: movement['supplier_phone'],
        address: movement['supplier_address'],
        city: movement['supplier_city'],
        country: movement['supplier_country'],
        isActive: movement['supplier_isActive'],
        notes: movement['supplier_notes'],
        createdAt: movement['supplier_createdAt'],
        updatedAt: movement['supplier_updatedAt'],
      };

      // Remove raw supplier fields
      delete movement['supplier_id'];
      delete movement['supplier_code'];
      delete movement['supplier_name'];
      delete movement['supplier_email'];
      delete movement['supplier_phone'];
      delete movement['supplier_address'];
      delete movement['supplier_city'];
      delete movement['supplier_country'];
      delete movement['supplier_isActive'];
      delete movement['supplier_notes'];
      delete movement['supplier_createdAt'];
      delete movement['supplier_updatedAt'];
    }

    return movement;
  }

  async findAll(env: Env | null, options?: {
    productId?: string;
    variantId?: string;
    movementType?: string;
    referenceId?: string;
    referenceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<InventoryMovementWithDetails[]> {
    const { productId, variantId, movementType, referenceId, referenceType, limit = 100, offset = 0 } = options || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (productId) {
      conditions.push('im.productId = ?');
      params.push(productId);
    }
    if (variantId) {
      conditions.push('im.variantId = ?');
      params.push(variantId);
    }
    if (movementType) {
      conditions.push('im.movementType = ?');
      params.push(movementType);
    }
    if (referenceId) {
      conditions.push('im.referenceId = ?');
      params.push(referenceId);
    }
    if (referenceType) {
      conditions.push('im.referenceType = ?');
      params.push(referenceType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const movements = await queryAll<any>(
      env,
      `SELECT 
        im.*,
        s.id as supplier_id,
        s.code as supplier_code,
        s.name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address as supplier_address,
        s.city as supplier_city,
        s.country as supplier_country,
        s.isActive as supplier_isActive,
        s.notes as supplier_notes,
        s.createdAt as supplier_createdAt,
        s.updatedAt as supplier_updatedAt,
        p.name as productName,
        pv.name as variantName
      FROM inventory_movements im
      LEFT JOIN suppliers s ON im.supplierId = s.id
      LEFT JOIN products p ON im.productId = p.id
      LEFT JOIN product_variants pv ON im.variantId = pv.id
      ${whereClause}
      ORDER BY im.createdAt DESC
      LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    // Format results
    return movements.map(movement => {
      const result: InventoryMovementWithDetails = {
        id: movement.id,
        productId: movement.productId,
        variantId: movement.variantId,
        movementType: movement.movementType,
        quantity: movement.quantity,
        unitCost: movement.unitCost,
        totalCost: movement.totalCost,
        referenceId: movement.referenceId,
        referenceType: movement.referenceType,
        approved: movement.approved,
        approvedAt: movement.approvedAt,
        supplierId: movement.supplierId,
        notes: movement.notes,
        createdAt: movement.createdAt,
        productName: movement.productName,
        variantName: movement.variantName,
      };

      // Format supplier object if exists
      if (movement.supplier_id) {
        result.supplier = {
          id: movement.supplier_id,
          code: movement.supplier_code,
          name: movement.supplier_name,
          email: movement.supplier_email,
          phone: movement.supplier_phone,
          address: movement.supplier_address,
          city: movement.supplier_city,
          country: movement.supplier_country,
          isActive: movement.supplier_isActive,
          notes: movement.supplier_notes,
          createdAt: movement.supplier_createdAt,
          updatedAt: movement.supplier_updatedAt,
        };
      }

      return result;
    });
  }

  async findByProduct(env: Env | null, productId: string, variantId?: string, limit: number = 50): Promise<InventoryMovementWithDetails[]> {
    return this.findAll(env, { productId, variantId, limit });
  }

  async findByMovementType(env: Env | null, movementType: string, limit: number = 100): Promise<InventoryMovementWithDetails[]> {
    return this.findAll(env, { movementType, limit });
  }

  async findByReference(env: Env | null, referenceId: string, referenceType: string): Promise<InventoryMovementWithDetails[]> {
    return this.findAll(env, { referenceId, referenceType, limit: 1000 });
  }

  async create(env: Env | null, data: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
    const id = generateId();
    const createdAt = now();

    await execute(
      env,
      `INSERT INTO inventory_movements (
        id, productId, variantId, movementType, quantity, 
        unitCost, totalCost, referenceId, referenceType, 
        approved, approvedAt, supplierId, notes, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.productId,
      data.variantId,
      data.movementType,
      data.quantity,
      data.unitCost,
      data.totalCost,
      data.referenceId,
      data.referenceType,
      data.approved,
      data.approvedAt,
      data.supplierId,
      data.notes,
      createdAt
    );

    return {
      id,
      ...data,
      createdAt,
    };
  }

  async count(env: Env | null, options?: {
    productId?: string;
    variantId?: string;
    movementType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const { productId, variantId, movementType, startDate, endDate } = options || {};

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
    if (movementType) {
      conditions.push('movementType = ?');
      params.push(movementType);
    }
    if (startDate) {
      conditions.push('createdAt >= ?');
      params.push(startDate.toISOString());
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return count(env, `SELECT COUNT(*) as count FROM inventory_movements ${whereClause}`, ...params);
  }

  async getSummary(env: Env | null, options?: {
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
    if (movementType) {
      conditions.push('movementType = ?');
      params.push(movementType);
    }
    if (startDate) {
      conditions.push('createdAt >= ?');
      params.push(startDate.toISOString());
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      params.push(endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await queryFirst<{
      totalMovements: number;
      totalQuantityIn: number;
      totalQuantityOut: number;
      totalCostIn: number;
      totalCostOut: number;
    }>(
      env,
      `SELECT 
        COUNT(*) as totalMovements,
        SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) as totalQuantityIn,
        SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) as totalQuantityOut,
        SUM(CASE WHEN quantity > 0 THEN totalCost ELSE 0 END) as totalCostIn,
        SUM(CASE WHEN quantity < 0 THEN totalCost ELSE 0 END) as totalCostOut
      FROM inventory_movements
      ${whereClause}`,
      ...params
    );

    return {
      totalMovements: result?.totalMovements || 0,
      totalQuantityIn: result?.totalQuantityIn || 0,
      totalQuantityOut: result?.totalQuantityOut || 0,
      totalCostIn: result?.totalCostIn || 0,
      totalCostOut: result?.totalCostOut || 0,
    };
  }
}

export const inventoryMovementRepository = new InventoryMovementRepository();
