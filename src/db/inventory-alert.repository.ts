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

export class InventoryAlertRepository {
  /**
   * Find inventory alert by ID
   */
  static async findById(env: Env, id: string): Promise<InventoryAlert | null> {
    const alert = await queryFirst<InventoryAlert>(
      env,
      'SELECT * FROM inventory_alerts WHERE id = ? LIMIT 1',
      id
    );
    if (alert) {
      alert.isRead = boolToNumber(alert.isRead) as unknown as number;
      alert.isResolved = boolToNumber(alert.isResolved) as unknown as number;
    }
    return alert;
  }

  /**
   * Create new inventory alert
   */
  static async create(env: Env, data: {
    variantId?: string;
    productId?: string;
    alertType: AlertType;
    quantity: number;
  }): Promise<InventoryAlert> {
    const id = generateId();
    const currentTime = now();

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
  static async update(env: Env, id: string, data: Partial<InventoryAlert>): Promise<InventoryAlert | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.isRead !== undefined) {
      updates.push('isRead = ?');
      values.push(boolToNumber(data.isRead));
    }
    if (data.isResolved !== undefined) {
      updates.push('isResolved = ?');
      values.push(boolToNumber(data.isResolved));
    }
    if (data.isResolved !== undefined && data.isResolved) {
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
  static async markAsRead(env: Env, id: string): Promise<void> {
    await execute(
      env,
      'UPDATE inventory_alerts SET isRead = 1 WHERE id = ?',
      id
    );
  }

  /**
   * Mark alert as resolved
   */
  static async markAsResolved(env: Env, id: string): Promise<void> {
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
  static async delete(env: Env, id: string): Promise<void> {
    await execute(env, 'DELETE FROM inventory_alerts WHERE id = ?', id);
  }

  /**
   * Get all unread alerts
   */
  static async findUnread(env: Env): Promise<InventoryAlert[]> {
    const alerts = await queryAll<InventoryAlert>(
      env,
      'SELECT * FROM inventory_alerts WHERE isRead = 0 ORDER BY createdAt DESC'
    );
    return alerts.map(a => ({
      ...a,
      isRead: numberToBool(a.isRead),
      isResolved: numberToBool(a.isResolved)
    }));
  }

  /**
   * Get all unresolved alerts
   */
  static async findUnresolved(env: Env): Promise<InventoryAlert[]> {
    const alerts = await queryAll<InventoryAlert>(
      env,
      'SELECT * FROM inventory_alerts WHERE isResolved = 0 ORDER BY createdAt DESC'
    );
    return alerts.map(a => ({
      ...a,
      isRead: numberToBool(a.isRead),
      isResolved: numberToBool(a.isResolved)
    }));
  }

  /**
   * Get all alerts (with pagination)
   */
  static async findAll(
    env: Env,
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

    return alerts.map(a => ({
      ...a,
      isRead: numberToBool(a.isRead),
      isResolved: numberToBool(a.isResolved)
    }));
  }

  /**
   * Count alerts
   */
  static async count(env: Env, options: {
    alertType?: AlertType;
    isRead?: boolean;
    isResolved?: boolean;
  } = {}): Promise<number> {
    const { alertType, isRead, isResolved } = options;
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
  static async markAllAsRead(env: Env): Promise<void> {
    await execute(env, 'UPDATE inventory_alerts SET isRead = 1 WHERE isRead = 0');
  }

  /**
   * Resolve multiple alerts
   */
  static async resolveMany(env: Env, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

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
  static async deleteMany(env: Env, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

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
  static async deleteOldResolved(env: Env, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

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
