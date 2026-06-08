import { Env } from './types';
import { queryFirst, queryAll, execute, count as dbCount, generateId, retry, batchTransaction } from './db';
import { runTransaction } from '@/lib/transaction';

export type PurchaseOrderWithItems = {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  orderDate: Date | string;
  expectedDate?: Date | string | null;
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
  expectedDate?: Date | string | null;
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
              s.id as supplier_id, s.name as supplier_name,
              s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address,
              s.city as supplier_city, s.country as supplier_country,
              s.notes as supplier_notes, s.isActive as supplier_isActive,
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
      email: po.supplier_email,
      phone: po.supplier_phone,
      address: po.supplier_address,
      city: po.supplier_city,
      country: po.supplier_country,
      notes: po.supplier_notes,
      isActive: po.supplier_isActive,
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
      expectedDate: po.expectedDate,
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
              s.id as supplier_id, s.name as supplier_name,
              s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address,
              s.city as supplier_city, s.country as supplier_country,
              s.notes as supplier_notes, s.isActive as supplier_isActive,
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
      email: po.supplier_email,
      phone: po.supplier_phone,
      address: po.supplier_address,
      city: po.supplier_city,
      country: po.supplier_country,
      notes: po.supplier_notes,
      isActive: po.supplier_isActive,
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
      expectedDate: po.expectedDate,
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
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrderWithItems[]> {
    const { supplierId, status, startDate, endDate, limit, offset } = options || {};

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
    const limitClause = limit ? `LIMIT ?` : '';
    const offsetClause = offset ? `OFFSET ?` : '';

    const pos = await queryAll<any>(
      env,
      `SELECT po.*, s.name as supplierName,
              s.id as supplier_id, s.name as supplier_name,
              s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address,
              s.city as supplier_city, s.country as supplier_country,
              s.notes as supplier_notes, s.isActive as supplier_isActive,
              s.createdAt as supplier_createdAt, s.updatedAt as supplier_updatedAt
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplierId = s.id
       ${whereClause}
       ORDER BY po.orderDate DESC
       ${limitClause}
       ${offsetClause}`,
      ...params,
      ...(limit ? [limit] : []),
      ...(offset ? [offset] : [])
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
        email: po.supplier_email,
        phone: po.supplier_phone,
        address: po.supplier_address,
        city: po.supplier_city,
        country: po.supplier_country,
        notes: po.supplier_notes,
        isActive: po.supplier_isActive,
        createdAt: po.supplier_createdAt,
        updatedAt: po.supplier_updatedAt,
      };

      return {
        id: po.id,
        orderNumber: po.orderNumber,
        supplierId: po.supplierId,
        status: po.status,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
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
    console.log('[PurchaseOrderRepository.create] Starting creation with data:', data);
    console.log('[PurchaseOrderRepository.create] Env available:', !!env);

    const { items, ...poData } = data;

    const totalAmount = parseFloat(
      items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0)
        .toFixed(2)
    );
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    console.log('[PurchaseOrderRepository.create] Calculated totals:', { totalAmount, totalQuantity });

    const poId = generateId();
    const now = new Date().toISOString();
    const orderDate = poData.orderDate ? new Date(poData.orderDate).toISOString() : now;

    console.log('[PurchaseOrderRepository.create] Generated poId:', poId);

    // Use retry mechanism for order number generation to prevent race conditions
    const orderNumber = await retry(
      async () => {
        const num = await this.generateOrderNumber(env);
        console.log('[PurchaseOrderRepository.create] Generated orderNumber:', num);
        return num;
      },
      3, // max 3 retries
      100 // 100ms base delay
    );

    // Use transaction to ensure atomicity - PO header + items must all succeed or all fail
    const result = await runTransaction(async (db, commit, rollback) => {
      try {
        // Insert PO header
        await db.prepare(
          `INSERT INTO purchase_orders (id, orderNumber, supplierId, status, totalAmount, totalQuantity, orderDate, expectedDate, receivedDate, notes, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          poId,
          orderNumber,
          poData.supplierId,
          poData.status || 'PENDING',
          totalAmount,
          totalQuantity,
          orderDate,
          poData.expectedDate ? new Date(poData.expectedDate).toISOString() : null,
          poData.receivedDate ? new Date(poData.receivedDate).toISOString() : null,
          poData.notes || null,
          now,
          now
        ).run();

        console.log('[PurchaseOrderRepository.create] Inserted purchase order header');

        // Insert all items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemId = generateId();
          console.log(`[PurchaseOrderRepository.create] Inserting item ${i + 1}/${items.length}:`, item);

          await db.prepare(
            `INSERT INTO purchase_order_items (id, purchaseOrderId, productId, variantId, quantity, unitCost, totalCost, receivedQty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            itemId,
            poId,
            item.productId,
            item.variantId || null,
            item.quantity,
            item.unitCost,
            item.unitCost * item.quantity,
            0
          ).run();

          console.log(`[PurchaseOrderRepository.create] Inserted item ${i + 1}/${items.length} successfully`);
        }

        // Commit the transaction
        await commit();
        console.log('[PurchaseOrderRepository.create] Transaction committed');

        return poId;
      } catch (error) {
        console.error('[PurchaseOrderRepository.create] Error in transaction:', error);
        await rollback();
        throw error;
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create purchase order');
    }

    console.log('[PurchaseOrderRepository.create] Transaction successful, calling findById...');
    const finalResult = await this.findById(env, poId);
    console.log('[PurchaseOrderRepository.create] findById returned:', finalResult);

    if (!finalResult) {
      throw new Error('Failed to retrieve created purchase order');
    }

    return finalResult;
  }

  async update(env: Env | null, id: string, data: Partial<{
    supplierId?: string;
    status?: string;
    orderDate?: Date | string;
    expectedDate?: Date | string | null;
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
    if (data.expectedDate !== undefined) {
      updates.push('expectedDate = ?');
      params.push(data.expectedDate ? new Date(data.expectedDate).toISOString() : null);
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

    console.log('[receiveOrder] Starting to receive PO:', id);

    // First, fetch all variant and product data we need
    const variantIds = po.items
      .filter(item => item.variantId)
      .map(item => item.variantId)
      .filter(Boolean) as string[];

    const productIds = po.items
      .filter(item => !item.variantId)
      .map(item => item.productId);

    const variants: Record<string, any> = {};
    const products: Record<string, any> = {};

    // Fetch variants
    if (variantIds.length > 0) {
      const variantRecords = await queryAll<any>(
        env,
        `SELECT * FROM product_variants WHERE id IN (${variantIds.map(() => '?').join(',')})`,
        ...variantIds
      );
      variantRecords.forEach(v => {
        variants[v.id] = v;
      });
    }

    // Fetch products
    if (productIds.length > 0) {
      const productRecords = await queryAll<any>(
        env,
        `SELECT * FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
        ...productIds
      );
      productRecords.forEach(p => {
        products[p.id] = p;
      });
    }

    // Collect all operations for atomic batch execution
    const operations: Array<{ sql: string; params?: unknown[] }> = [];
    const currentTime = new Date().toISOString();

    // Update purchase order items with received quantities
    for (const item of receivedItems) {
      operations.push({
        sql: `UPDATE purchase_order_items SET receivedQty = ? WHERE id = ?`,
        params: [item.quantity, item.itemId]
      });
      console.log('[receiveOrder] Queued update for receivedQty item:', item.itemId);
    }

    // Update inventory for each item and prepare inventory movement records
    for (const item of po.items) {
      const receivedItem = receivedItems.find((ri) => ri.itemId === item.id);
      if (!receivedItem) continue;

      const quantity = receivedItem.quantity;

      if (item.variantId) {
        const variant = variants[item.variantId];
        if (!variant) {
          console.error(`[receiveOrder] Variant not found: ${item.variantId}. Skipping stock update for item: ${item.productName || item.productId}`);
          continue;
        }

        const newTotalPurchased = variant.totalPurchased + quantity;
        const oldTotalCost = variant.totalCost || 0;
        const newCost = item.unitCost * quantity;
        const newTotalCost = oldTotalCost + newCost;
        const newAverageCost = newTotalCost / newTotalPurchased;

        operations.push({
          sql: `UPDATE product_variants SET stock = stock + ?, totalPurchased = ?, totalCost = ?, averageCost = ?, costPrice = ? WHERE id = ?`,
          params: [
            quantity,
            newTotalPurchased,
            newTotalCost,
            newAverageCost,
            newAverageCost,
            item.variantId
          ]
        });
        console.log('[receiveOrder] Queued variant stock update:', item.variantId);
      } else {
        const product = products[item.productId];
        if (!product) {
          console.error(`[receiveOrder] Product not found: ${item.productId}. Skipping stock update for item: ${item.productName || item.productId}`);
          continue;
        }

        const newTotalPurchased = product.totalPurchased + quantity;
        const oldTotalCost = product.totalCost || 0;
        const newCost = item.unitCost * quantity;
        const newTotalCost = oldTotalCost + newCost;
        const newAverageCost = newTotalCost / newTotalPurchased;

        operations.push({
          sql: `UPDATE products SET stock = stock + ?, totalPurchased = ?, totalCost = ?, averageCost = ?, costPrice = ?, lastPurchaseAt = ?, lastPurchaseCost = ? WHERE id = ?`,
          params: [
            quantity,
            newTotalPurchased,
            newTotalCost,
            newAverageCost,
            newAverageCost,
            currentTime,
            item.unitCost,
            item.productId
          ]
        });
        console.log('[receiveOrder] Queued product stock update:', item.productId);
      }

      // Create inventory movement record for audit trail
      const movementId = generateId();
      operations.push({
        sql: `INSERT INTO inventory_movements (id, productId, variantId, movementType, quantity, unitCost, totalCost, referenceId, referenceType, approved, approvedAt, supplierId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          movementId,
          item.productId,
          item.variantId,
          'PURCHASE',
          quantity,
          item.unitCost,
          item.unitCost * quantity,
          id,
          'PURCHASE_ORDER',
          1,
          currentTime,
          po.supplierId
        ]
      });
      console.log('[receiveOrder] Queued inventory movement:', movementId);
    }

    // Update PO status to RECEIVED
    operations.push({
      sql: `UPDATE purchase_orders SET status = ?, receivedDate = ?, updatedAt = ? WHERE id = ?`,
      params: ['RECEIVED', currentTime, currentTime, id]
    });
    console.log('[receiveOrder] Queued PO status update to RECEIVED:', id);

    // Execute all operations atomically using batchTransaction
    try {
      console.log('[receiveOrder] Executing batch transaction with', operations.length, 'operations');
      await batchTransaction(env, operations);
      console.log('[receiveOrder] Batch transaction completed successfully');
    } catch (error) {
      console.error('[receiveOrder] Batch transaction failed:', error);
      throw new Error(`Failed to receive purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Return the updated PO
    const result = await this.findById(env, id);
    return result;
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
