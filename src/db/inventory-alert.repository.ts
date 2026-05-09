import { Env, InventoryAlert, AlertType } from '@/db/types';
import {
  generateId,
  boolToNumber,
  now,
  queryFirst,
  queryAll,
  execute,
  buildPaginationClause,
  count,
  numberToBool,
} from '@/db/db';
import prisma from '@/lib/database';

export class InventoryAlertRepository {
  /**
   * Find inventory alert by ID
   */
  static async findById(env: Env | null, id: string): Promise<InventoryAlert | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const alert = await prisma.inventoryAlert.findUnique({
        where: { id }
      });
      return alert as InventoryAlert | null;
    }

    const alert = await queryFirst<InventoryAlert>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      id
    );
    return alert;
  }

  /**
   * Create new inventory alert
   */
  static async create(env: Env | null, data: {
    variantId?: string;
    productId?: string;
    alertType: AlertType;
    quantity: number;
  }): Promise<InventoryAlert> {
    const id = generateId();
    const currentTime = now();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const alert = await prisma.inventoryAlert.create({
        data: {
          id,
          variantId: data.variantId || null,
          productId: data.productId || null,
          alertType: data.alertType,
          quantity: data.quantity,
          isRead: 0,
          isResolved: 0,
          createdAt: currentTime
        }
      });
      return alert as unknown as InventoryAlert;
    }

    await execute(
      env,
      `INSERT INTO inventory_alerts (id, variantId, productId, alertType, quantity, isRead, isResolved, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.variantId || null,
      data.productId || null,
      data.alertType,
      data.quantity,
      0,
      0,
      currentTime
    );

    return (await this.findById(env, id))!;
  }

  /**
   * Update inventory alert
   */
  static async update(env: Env | null, id: string, data: Partial<InventoryAlert>): Promise<InventoryAlert | null> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const updateData: any = {};
      if (data.isRead !== undefined) updateData.isRead = data.isRead;
      if (data.isResolved !== undefined) {
        updateData.isResolved = data.isResolved;
        if (data.isResolved) updateData.resolvedAt = now();
      }

      await prisma.inventoryAlert.update({
        where: { id },
        data: updateData
      });
      return this.findById(env, id);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.isRead !== undefined) {
      updates.push('isRead = ?');
      values.push(typeof data.isRead === 'boolean' ? boolToNumber(data.isRead) : data.isRead);
    }
    if (data.isResolved !== undefined) {
      updates.push('isResolved = ?');
      values.push(typeof data.isResolved === 'boolean' ? boolToNumber(data.isResolved) : data.isResolved);
    }
    if (data.isResolved !== undefined && (typeof data.isResolved === 'boolean' ? data.isResolved : data.isResolved !== 0)) {
      updates.push('resolvedAt = ?');
      values.push(now());
    }

    if (updates.length === 0) return this.findById(env, id);

    values.push(id);

    await execute(
      env,
      `UPDATE inventory_alerts SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    );

    return this.findById(env, id);
  }

  /**
   * Mark alert as read
   */
  static async markAsRead(env: Env | null, id: string): Promise<void> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.inventoryAlert.update({
        where: { id },
        data: { isRead: 1 }
      });
      return;
    }

    await execute(
      env,
      'UPDATE inventory_alerts SET isRead = 1 WHERE id = ?',
      id
    );
  }

  /**
   * Mark alert as resolved
   */
  static async markAsResolved(env: Env | null, id: string): Promise<void> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.inventoryAlert.update({
        where: { id },
        data: { isResolved: 1, resolvedAt: now() }
      });
      return;
    }

    await execute(
      env,
      'UPDATE inventory_alerts SET isResolved = 1, resolvedAt = ? WHERE id = ?',
      now(),
      id
    );
  }

  /**
   * Delete inventory alert
   */
  static async delete(env: Env | null, id: string): Promise<void> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.inventoryAlert.delete({
        where: { id }
      });
      return;
    }

    await execute(env, 'DELETE FROM inventory_alerts WHERE id = ?', id);
  }

  /**
   * Get all unread alerts
   */
  static async findUnread(env : Env | null): Promise<InventoryAlert[]> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const alerts = await prisma.inventoryAlert.findMany({
        where: { isRead: 0 },
        orderBy: { createdAt: 'desc' }
      });
      return alerts as unknown as InventoryAlert[];
    }

    const alerts = await queryAll<InventoryAlert>(
      env,
      'SELECT * FROM inventory_alerts WHERE isRead = 0 ORDER BY createdAt DESC'
    );
    return alerts;
  }

  /**
   * Get all unresolved alerts
   */
  static async findUnresolved(env : Env | null): Promise<InventoryAlert[]> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const alerts = await prisma.inventoryAlert.findMany({
        where: { isResolved: 0 },
        orderBy: { createdAt: 'desc' }
      });
      return alerts as unknown as InventoryAlert[];
    }

    const alerts = await queryAll<InventoryAlert>(
      env,
      'SELECT * FROM inventory_alerts WHERE isResolved = 0 ORDER BY createdAt DESC'
    );
    return alerts;
  }

  /**
   * Get all alerts (with pagination)
   */
  static async findAll(
    env: Env | null,
    options: {
      limit?: number;
      offset?: number;
      alertType?: AlertType;
      isRead?: boolean;
      isResolved?: boolean;
      variantId?: string;
      productId?: string;
    } = {}
  ): Promise<InventoryAlert[]> {
    const { limit = 50, offset = 0, alertType, isRead, isResolved, variantId, productId } = options;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const where: any = {};
      if (alertType) where.alertType = alertType;
      if (isRead !== undefined) where.isRead = isRead ? 1 : 0;
      if (isResolved !== undefined) where.isResolved = isResolved ? 1 : 0;
      if (variantId) where.variantId = variantId;
      if (productId) where.productId = productId;

      const alerts = await prisma.inventoryAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      return alerts as unknown as InventoryAlert[];
    }

    const whereClause: string[] = [];
    const params: unknown[] = [];

    if (alertType) {
      whereClause.push('alertType = ?');
      params.push(alertType);
    }
    if (isRead !== undefined) {
      whereClause.push('isRead = ?');
      params.push(boolToNumber(isRead));
    }
    if (isResolved !== undefined) {
      whereClause.push('isResolved = ?');
      params.push(boolToNumber(isResolved));
    }
    if (variantId) {
      whereClause.push('variantId = ?');
      params.push(variantId);
    }
    if (productId) {
      whereClause.push('productId = ?');
      params.push(productId);
    }

    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const alerts = await queryAll<InventoryAlert>(
      env,
      `SELECT * FROM inventory_alerts ${whereSQL} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    return alerts;
  }

  /**
   * Count alerts
   */
  static async count(env: Env | null, options: {
    alertType?: AlertType;
    isRead?: boolean;
    isResolved?: boolean;
  } = {}): Promise<number> {
    const { alertType, isRead, isResolved } = options;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const where: any = {};
      if (alertType) where.alertType = alertType;
      if (isRead !== undefined) where.isRead = isRead ? 1 : 0;
      if (isResolved !== undefined) where.isResolved = isResolved ? 1 : 0;

      return await prisma.inventoryAlert.count({ where });
    }

    const whereClause: string[] = [];
    const params: unknown[] = [];

    if (alertType) {
      whereClause.push('alertType = ?');
      params.push(alertType);
    }
    if (isRead !== undefined) {
      whereClause.push('isRead = ?');
      params.push(boolToNumber(isRead));
    }
    if (isResolved !== undefined) {
      whereClause.push('isResolved = ?');
      params.push(boolToNumber(isResolved));
    }

    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    return count(env, 'inventory_alerts', whereSQL, ...params);
  }

  /**
   * Mark all alerts as read
   */
  static async markAllAsRead(env : Env | null): Promise<void> {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.inventoryAlert.updateMany({
        where: { isRead: 0 },
        data: { isRead: 1 }
      });
      return;
    }

    await execute(env, 'UPDATE inventory_alerts SET isRead = 1 WHERE isRead = 0');
  }

  /**
   * Resolve multiple alerts
   */
  static async resolveMany(env: Env | null, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.inventoryAlert.updateMany({
        where: { id: { in: ids } },
        data: { isResolved: 1, resolvedAt: now() }
      });
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await execute(
      env,
      `UPDATE inventory_alerts SET isResolved = 1, resolvedAt = ? WHERE id IN (${placeholders})`,
      now(),
      ...ids
    );
  }

  /**
   * Delete multiple alerts
   */
  static async deleteMany(env: Env | null, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await prisma.inventoryAlert.deleteMany({
        where: { id: { in: ids } }
      });
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await execute(
      env,
      `DELETE FROM inventory_alerts WHERE id IN (${placeholders})`,
      ...ids
    );
  }

  /**
   * Delete resolved alerts older than specified days
   */
  static async deleteOldResolved(env: Env | null, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      const result = await prisma.inventoryAlert.deleteMany({
        where: {
          isResolved: 1,
          AND: [
            { resolvedAt: { lt: cutoffISO } },
            { resolvedAt: { not: null } }
          ]
        }
      });
      return result.count;
    }

    const result = await execute(
      env,
      `DELETE FROM inventory_alerts WHERE isResolved = 1 AND resolvedAt < ? AND resolvedAt IS NOT NULL`,
      cutoffISO
    );

    // Execute returns D1Result, but we can't easily get affected rows count
    // For now, return 0 as we don't have direct access to affected rows
    return 0;
  }
}
