import { db } from '@/lib/db';
import { purchase_orders, purchase_order_items, suppliers, products } from '@prisma/client';

export type PurchaseOrderWithItems = purchase_orders & {
  supplierName: string;
  supplier: suppliers;
  items: (purchase_order_items & { productName?: string })[];
};

export type PurchaseOrderCreateInput = Omit<purchase_orders, 'id' | 'createdAt' | 'updatedAt'> & {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitCost: number;
  }>;
};

class PurchaseOrderRepository {
  async findById(id: string): Promise<PurchaseOrderWithItems | null> {
    const po = await db.purchase_orders.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!po) return null;

    // Fetch product names for items
    const itemIds = po.items.map(item => item.productId);
    const productRecords = await db.products.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    });

    const productNameMap = new Map(productRecords.map(p => [p.id, p.name]));

    const itemsWithProductNames = po.items.map(item => ({
      ...item,
      productName: productNameMap.get(item.productId) || 'Unknown Product',
    }));

    return {
      ...po,
      supplierName: po.supplier.name,
      items: itemsWithProductNames,
    } as PurchaseOrderWithItems;
  }

  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrderWithItems | null> {
    const po = await db.purchase_orders.findUnique({
      where: { orderNumber },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!po) return null;

    // Fetch product names for items
    const itemIds = po.items.map(item => item.productId);
    const productRecords = await db.products.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    });

    const productNameMap = new Map(productRecords.map(p => [p.id, p.name]));

    const itemsWithProductNames = po.items.map(item => ({
      ...item,
      productName: productNameMap.get(item.productId) || 'Unknown Product',
    }));

    return {
      ...po,
      supplierName: po.supplier.name,
      items: itemsWithProductNames,
    } as PurchaseOrderWithItems;
  }

  async findAll(options?: {
    supplierId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PurchaseOrderWithItems[]> {
    const { supplierId, status, startDate, endDate } = options || {};

    let where: any = {};
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      const orderDate: any = {};
      if (startDate) orderDate.gte = startDate;
      if (endDate) orderDate.lte = endDate;
      where.orderDate = orderDate;
    }

    const pos = await db.purchase_orders.findMany({
      where,
      include: {
        supplier: true,
        items: true,
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    // Fetch all product IDs from all PO items
    const allItemIds = pos.flatMap(po => po.items.map(item => item.productId));
    const productRecords = await db.products.findMany({
      where: { id: { in: allItemIds } },
      select: { id: true, name: true },
    });

    const productNameMap = new Map(productRecords.map(p => [p.id, p.name]));

    return pos.map(po => ({
      ...po,
      supplierName: po.supplier.name,
      items: po.items.map(item => ({
        ...item,
        productName: productNameMap.get(item.productId) || 'Unknown Product',
      })),
    })) as PurchaseOrderWithItems[];
  }

  async create(data: PurchaseOrderCreateInput): Promise<PurchaseOrderWithItems> {
    const { items, ...poData } = data;

    // Calculate total amount and quantity
    const totalAmount = items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Generate PO ID
    const poId = `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create purchase order with items in a transaction
    const po = await db.purchase_orders.create({
      data: {
        ...poData,
        id: poId,
        orderNumber,
        totalAmount,
        totalQuantity,
        orderDate: poData.orderDate || new Date(),
        receivedDate: poData.receivedDate || null,
        updatedAt: new Date(),
        items: {
          create: items.map((item, index) => ({
            id: `poi-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.unitCost * item.quantity,
            receivedQty: 0,
          })),
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    // Fetch product names for items
    const itemIds = po.items.map(item => item.productId);
    const productRecords = await db.products.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true },
    });

    const productNameMap = new Map(productRecords.map(p => [p.id, p.name]));

    const itemsWithProductNames = po.items.map(item => ({
      ...item,
      productName: productNameMap.get(item.productId) || 'Unknown Product',
    }));

    return {
      ...po,
      supplierName: po.supplier.name,
      items: itemsWithProductNames,
    } as PurchaseOrderWithItems;
  }

  async update(id: string, data: Partial<Omit<purchase_orders, 'id' | 'createdAt' | 'updatedAt'>>): Promise<purchase_orders | null> {
    return db.purchase_orders.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: string, receivedDate?: Date): Promise<purchase_orders | null> {
    const updateData: any = { status };
    if (receivedDate) {
      updateData.receivedDate = receivedDate;
    }

    return db.purchase_orders.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<purchase_orders | null> {
    return db.purchase_orders.delete({
      where: { id },
    });
  }

  async receiveOrder(id: string, receivedItems: Array<{ itemId: string; quantity: number }>): Promise<PurchaseOrderWithItems | null> {
    const po = await this.findById(id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status === 'RECEIVED') {
      throw new Error('Order has already been received');
    }

    // Update items with received quantities
    await Promise.all(
      receivedItems.map((item) =>
        db.purchase_order_items.update({
          where: { id: item.itemId },
          data: { receivedQty: item.quantity },
        })
      )
    );

    // Update inventory for each item
    for (const item of po.items) {
      const receivedItem = receivedItems.find((ri) => ri.itemId === item.id);
      if (!receivedItem) continue;

      const quantity = receivedItem.quantity;

      // Update product/variant stock and cost
      if (item.variantId) {
        // Update variant
        const variant = await db.product_variants.findUnique({
          where: { id: item.variantId },
        });

        if (variant) {
          const newTotalPurchased = variant.totalPurchased + quantity;
          const oldTotalCost = variant.totalCost || 0;
          const newCost = item.unitCost * quantity;
          const newTotalCost = oldTotalCost + newCost;
          const newAverageCost = newTotalCost / newTotalPurchased;

          await db.product_variants.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: quantity },
              totalPurchased: newTotalPurchased,
              totalCost: newTotalCost,
              averageCost: newAverageCost,
              costPrice: newAverageCost,
            },
          });
        }
      } else {
        // Update product (no variant)
        const product = await db.products.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const newTotalPurchased = product.totalPurchased + quantity;
          const oldTotalCost = product.totalCost || 0;
          const newCost = item.unitCost * quantity;
          const newTotalCost = oldTotalCost + newCost;
          const newAverageCost = newTotalCost / newTotalPurchased;

          await db.products.update({
            where: { id: item.productId },
            data: {
              stock: { increment: quantity },
              totalPurchased: newTotalPurchased,
              totalCost: newTotalCost,
              averageCost: newAverageCost,
              costPrice: newAverageCost,
              lastPurchaseAt: new Date(),
              lastPurchaseCost: item.unitCost,
            },
          });
        }
      }

      // Create inventory movement
      await db.inventory_movements.create({
        data: {
          id: `im-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: item.productId,
          variantId: item.variantId,
          movementType: 'PURCHASE',
          quantity: quantity,
          unitCost: item.unitCost,
          totalCost: item.unitCost * quantity,
          referenceId: id,
          referenceType: 'PURCHASE_ORDER',
          supplierId: po.supplierId,
          approved: 1,
          approvedAt: new Date(),
        },
      });
    }

    // Update PO status to RECEIVED
    await this.updateStatus(id, 'RECEIVED', new Date());

    return this.findById(id);
  }

  async count(options?: { supplierId?: string; status?: string }): Promise<number> {
    const { supplierId, status } = options || {};

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    return db.purchase_orders.count({ where });
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Find the last PO for this month
    const lastPO = await db.purchase_orders.findFirst({
      where: {
        orderNumber: {
          startsWith: `PO-${year}${month}`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastPO) {
      const lastSequence = parseInt(lastPO.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `PO-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
