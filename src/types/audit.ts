/**
 * Audit Action Types
 * Define all possible admin actions that can be logged
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'RESTORE'
  | 'BULK_CREATE'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL'
  | 'REFUND'
  | 'SHIP'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'UPLOAD'
  | 'VIEW'
  | 'BAN_USER'
  | 'UNBAN_USER'
  | 'RESET_PASSWORD'
  | 'CHANGE_PASSWORD'
  | 'UPDATE_SETTINGS'
  | 'UPDATE_PERMISSIONS'
  | 'REORDER';

/**
 * Audit Entity Types
 * Define all entities that can be audited
 */
export type AuditEntity =
  | 'Product'
  | 'ProductVariant'
  | 'ProductColorImage'
  | 'Category'
  | 'User'
  | 'Order'
  | 'OrderItem'
  | 'AdminLog'
  | 'Banner'
  | 'Story'
  | 'Reel'
  | 'Promotion'
  | 'ProductReview'
  | 'InventoryAlert'
  | 'Settings'
  | 'Address'
  | 'WishlistItem'
  | 'CartItem'
  | 'Post'
  | 'HomepageSettings'
  | 'Brand'
  | 'Supplier'
  | 'PurchaseOrder'
  | 'InventoryMovement'
  | 'InventoryAdjustment'
  | 'Coupon';

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  adminId: string;
  adminName?: string;
  adminEmail?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Audit Log Filters
 */
export interface AuditLogFilters {
  adminId?: string;
  entity?: AuditEntity;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit Log Response
 */
export interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
