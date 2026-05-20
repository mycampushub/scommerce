import { Env } from './types';
import { queryFirst, queryAll, execute, count as dbCount, generateId } from './db';

export type PurchaseOrderWithItems = {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  orderDate: Date | string;
  expectedDeliveryDate?: Date | string | null;
  receivedDate?: Date | string | null;
  notes?: string | null;
  totalAmount: number;
  totalQuantity: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  supplierName: string;
  supplier: any;
  items: any[];
};

export type PurchaseOrderCreateInput = {
  supplierId: string;
  status?: string;
  orderDate?: Date | string;
  expectedDeliveryDate?: Date | string | null;
  receivedDate?: Date | string | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitCost: number;
  }>;
};

class PurchaseOrderRepository {
  async findById(env: Env | null, id: string): Promise<PurchaseOrderWithItems | null> {
    const po = await queryFirst<any>(
      env,
      `SELECT po.*, s.name as supplierName, 
              s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact, 
              s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address,
              s.createdAt as supplier_createdAt, s.updatedAt as supplier_updatedAt
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplierId = s.id
       WHERE po.id = ?`,
      id
    );

    if (!po) return null;

    const items = await queryAll<any>(
      env,
      `SELECT poi.*, p.name as productName
       FROM purchase_order_items poi
       LEFT JOIN products p ON poi.productId = p.id
       WHERE poi.purchaseOrderId = ?`,
      id
    );

    const supplier = {
      id: po.supplier_id,
      name: po.supplier_name,
      contact: po.supplier_contact,
      email: po.supplier_email,
      phone: po.supplier_phone,
      address: po.supplier_address,
      createdAt: po.supplier_createdAt,
      updatedAt: po.supplier_updatedAt,
    };

    const itemsWithProductNames = items.map(item => ({
      ...item,
      productName: item.productName || 'Unknown Product',
    }));

    return {
      id: po.id,
      orderNumber: po.orderNumber,
      supplierId: po.supplierId,
      status: po.status,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      receivedDate: po.receivedDate,
      notes: po.notes,
      totalAmount: po.totalAmount,
      totalQuantity: po.totalQuantity,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      supplierName: po.supplierName,
      supplier,
      items: itemsWithProductNames,
    } as PurchaseOrderWithItems;
  }

  async findByOrderNumber(env: Env | null, orderNumber: string): Promise<PurchaseOrderWithItems | null> {
    const po = await queryFirst<any>(
      env,
      `SELECT po.*, s.name as supplierName,
              s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact,
              s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address,
              s.createdAt as supplier_createdAt, s.updatedAt as supplier_updatedAt
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplierId = s.id
       WHERE po.orderNumber = ?`,
      orderNumber
    );

    if (!po) return null;

    const items = await queryAll<any>(
      env,
      `SELECT poi.*, p.name as productName
       FROM purchase_order_items poi
       LEFT JOIN products p ON poi.productId = p.id
       WHERE poi.purchaseOrderId = ?`,
      po.id
    );

    const supplier = {
      id: po.supplier_id,
      name: po.supplier_name,
      contact: po.supplier_contact,
      email: po.supplier_email,
      phone: po.supplier_phone,
      address: po.supplier_address,
      createdAt: po.supplier_createdAt,
      updatedAt: po.supplier_updatedAt,
    };

    const itemsWithProductNames = items.map(item => ({
      ...item,
      productName: item.productName || 'Unknown Product',
    }));

    return {
      id: po.id,
      orderNumber: po.orderNumber,
      supplierId: po.supplierId,
      status: po.status,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      receivedDate: po.receivedDate,
      notes: po.notes,
      totalAmount: po.totalAmount,
      totalQuantity: po.totalQuantity,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      supplierName: po.supplierName,
      supplier,
      items: itemsWithProductNames,
    } as PurchaseOrderWithItems;
  }

  async findAll(env: Env | null, options?: {
    supplierId?: string;
    status?: string;
    startDate?: Date | string;
    endDate?: Date | string;
  }): Promise<PurchaseOrderWithItems[]> {
    const { supplierId, status, startDate, endDate } = options || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (supplierId) {
      conditions.push('po.supplierId = ?');
      params.push(supplierId);
    }
    if (status) {
      conditions.push('po.status = ?');
      params.push(status);
    }
    if (startDate) {
      conditions.push('po.orderDate >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('po.orderDate <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const pos = await queryAll<any>(
      env,
      `SELECT po.*, s.name as supplierName,
              s.id as supplier_id, s.name as supplier_name, s.contact as supplier_contact,
              s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address,
              s.createdAt as supplier_createdAt, s.updatedAt as supplier_updatedAt
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplierId = s.id
       ${whereClause}
       ORDER BY po.orderDate DESC`,
      ...params
    );

    const allItemIds = pos.flatMap(po => po.id);

    const items = await queryAll<any>(
      env,
      `SELECT poi.*, p.name as productName, poi.purchaseOrderId
       FROM purchase_order_items poi
       LEFT JOIN products p ON poi.productId = p.id
       WHERE poi.purchaseOrderId IN (${allItemIds.map(() => '?').join(',')})`,
      ...allItemIds
    );

    const itemsByPO = new Map<string, any[]>();
    items.forEach(item => {
      if (!itemsByPO.has(item.purchaseOrderId)) {
        itemsByPO.set(item.purchaseOrderId, []);
      }
      itemsByPO.get(item.purchaseOrderId)!.push({
        ...item,
        productName: item.productName || 'Unknown Product',
      });
    });

    return pos.map(po => {
      const supplier = {
        id: po.supplier_id,
        name: po.supplier_name,
        contact: po.supplier_contact,
        email: po.supplier_email,
        phone: po.supplier_phone,
        address: po.supplier_address,
        createdAt: po.supplier_createdAt,
        updatedAt: po.supplier_updatedAt,
      };

      return {
        id: po.id,
        orderNumber: po.orderNumber,
        supplierId: po.supplierId,
        status: po.status,
        orderDate: po.orderDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        receivedDate: po.receivedDate,
        notes: po.notes,
        totalAmount: po.totalAmount,
        totalQuantity: po.totalQuantity,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
        supplierName: po.supplierName,
        supplier,
        items: itemsByPO.get(po.id) || [],
      } as PurchaseOrderWithItems;
    });
  }

  async create(env: Env | null, data: PurchaseOrderCreateInput): Promise<PurchaseOrderWithItems> {
    const { items, ...poData } = data;

    const totalAmount = items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const orderNumber = await this.generateOrderNumber(env);
    const poId = generateId();
    const now = new Date().toISOString();
    const orderDate = poData.orderDate ? new Date(poData.orderDate).toISOString() : now;

    await execute(
      env,
      `INSERT INTO purchase_orders (id, orderNumber, supplierId, status, orderDate, expectedDeliveryDate, receivedDate, notes, totalAmount, totalQuantity, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      poId,
      orderNumber,
      poData.supplierId,
      poData.status || 'PENDING',
      orderDate,
      poData.expectedDeliveryDate ? new Date(poData.expectedDeliveryDate).toISOString() : null,
      poData.receivedDate ? new Date(poData.receivedDate).toISOString() : null,
      poData.notes || null,
      totalAmount,
      totalQuantity,
      now,
      now
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = generateId();
      await execute(
        env,
        `INSERT INTO purchase_order_items (id, purchaseOrderId, productId, variantId, quantity, unitCost, totalCost, receivedQty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        itemId,
        poId,
        item.productId,
        item.variantId || null,
        item.quantity,
        item.unitCost,
        item.unitCost * item.quantity,
        0
      );
    }

    return this.findById(env, poId) as Promise<PurchaseOrderWithItems>;
  }

  async update(env: Env | null, id: string, data: Partial<{
    supplierId?: string;
    status?: string;
    orderDate?: Date | string;
    expectedDeliveryDate?: Date | string | null;
    receivedDate?: Date | string | null;
    notes?: string | null;
    totalAmount?: number;
    totalQuantity?: number;
  }>): Promise<any | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.supplierId !== undefined) {
      updates.push('supplierId = ?');
      params.push(data.supplierId);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.orderDate !== undefined) {
      updates.push('orderDate = ?');
      params.push(new Date(data.orderDate).toISOString());
    }
    if (data.expectedDeliveryDate !== undefined) {
      updates.push('expectedDeliveryDate = ?');
      params.push(data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString() : null);
    }
    if (data.receivedDate !== undefined) {
      updates.push('receivedDate = ?');
      params.push(data.receivedDate ? new Date(data.receivedDate).toISOString() : null);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }
    if (data.totalAmount !== undefined) {
      updates.push('totalAmount = ?');
      params.push(data.totalAmount);
    }
    if (data.totalQuantity !== undefined) {
      updates.push('totalQuantity = ?');
      params.push(data.totalQuantity);
    }

    if (updates.length === 0) {
      return this.findById(env, id);
    }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await execute(
      env,
      `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`,
      ...params
    );

    return this.findById(env, id);
  }

  async updateStatus(env: Env | null, id: string, status: string, receivedDate?: Date): Promise<any | null> {
    const updates: string[] = ['status = ?', 'updatedAt = ?'];
    const params: unknown[] = [status, new Date().toISOString()];

    if (receivedDate) {
      updates.push('receivedDate = ?');
      params.push(new Date(receivedDate).toISOString());
    }

    params.push(id);

    await execute(
      env,
      `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`,
      ...params
    );

    return this.findById(env, id);
  }

  async delete(env: Env | null, id: string): Promise<any | null> {
    const po = await this.findById(env, id);
    if (!po) return null;

    await execute(
      env,
      `DELETE FROM purchase_order_items WHERE purchaseOrderId = ?`,
      id
    );

    await execute(
      env,
      `DELETE FROM purchase_orders WHERE id = ?`,
      id
    );

    return po;
  }

  async receiveOrder(env: Env | null, id: string, receivedItems: Array<{ itemId: string; quantity: number }>): Promise<PurchaseOrderWithItems | null> {
    const po = await this.findById(env, id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status === 'RECEIVED') {
      throw new Error('Order has already been received');
    }

    for (const item of receivedItems) {
      await execute(
        env,
        `UPDATE purchase_order_items SET receivedQty = ? WHERE id = ?`,
        item.quantity,
        item.itemId
      );
    }

    for (const item of po.items) {
      const receivedItem = receivedItems.find((ri) => ri.itemId === item.id);
      if (!receivedItem) continue;

      const quantity = receivedItem.quantity;

      if (item.variantId) {
        const variant = await queryFirst<any>(
          env,
          `SELECT * FROM product_variants WHERE id = ?`,
          item.variantId
        );

        if (variant) {
          const newTotalPurchased = variant.totalPurchased + quantity;
          const oldTotalCost = variant.totalCost || 0;
          const newCost = item.unitCost * quantity;
          const newTotalCost = oldTotalCost + newCost;
          const newAverageCost = newTotalCost / newTotalPurchased;

          await execute(
            env,
            `UPDATE product_variants SET stock = stock + ?, totalPurchased = ?, totalCost = ?, averageCost = ?, costPrice = ? WHERE id = ?`,
            quantity,
            newTotalPurchased,
            newTotalCost,
            newAverageCost,
            newAverageCost,
            item.variantId
          );
        }
      } else {
        const product = await queryFirst<any>(
          env,
          `SELECT * FROM products WHERE id = ?`,
          item.productId
        );

        if (product) {
          const newTotalPurchased = product.totalPurchased + quantity;
          const oldTotalCost = product.totalCost || 0;
          const newCost = item.unitCost * quantity;
          const newTotalCost = oldTotalCost + newCost;
          const newAverageCost = newTotalCost / newTotalPurchased;

          await execute(
            env,
            `UPDATE products SET stock = stock + ?, totalPurchased = ?, totalCost = ?, averageCost = ?, costPrice = ?, lastPurchaseAt = ?, lastPurchaseCost = ? WHERE id = ?`,
            quantity,
            newTotalPurchased,
            newTotalCost,
            newAverageCost,
            newAverageCost,
            new Date().toISOString(),
            item.unitCost,
            item.productId
          );
        }
      }

      const movementId = generateId();
      await execute(
        env,
        `INSERT INTO inventory_movements (id, productId, variantId, movementType, quantity, unitCost, totalCost, referenceId, referenceType, supplierId, approved, approvedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        movementId,
        item.productId,
        item.variantId,
        'PURCHASE',
        quantity,
        item.unitCost,
        item.unitCost * quantity,
        id,
        'PURCHASE_ORDER',
        po.supplierId,
        1,
        new Date().toISOString()
      );
    }

    await this.updateStatus(env, id, 'RECEIVED', new Date());

    return this.findById(env, id);
  }

  async count(env: Env | null, options?: { supplierId?: string; status?: string }): Promise<number> {
    const { supplierId, status } = options || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (supplierId) {
      conditions.push('supplierId = ?');
      params.push(supplierId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return dbCount(env, `SELECT COUNT(*) as count FROM purchase_orders ${whereClause}`, ...params);
  }

  private async generateOrderNumber(env: Env | null): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    const lastPO = await queryFirst<any>(
      env,
      `SELECT orderNumber FROM purchase_orders
       WHERE orderNumber LIKE ?
       ORDER BY orderNumber DESC
       LIMIT 1`,
      `PO-${year}${month}%`
    );

    let sequence = 1;
    if (lastPO && lastPO.orderNumber) {
      const lastSequence = parseInt(lastPO.orderNumber.slice(-4));
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `PO-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
