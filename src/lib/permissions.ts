/**
 * Permission Types
 * Define all available permissions in the system
 */

export type Permission =
  // Dashboard
  | 'dashboard:view'

  // Products
  | 'products:view'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'products:manage-variants'

  // Categories
  | 'categories:view'
  | 'categories:create'
  | 'categories:update'
  | 'categories:delete'

  // Orders
  | 'orders:view'
  | 'orders:create'
  | 'orders:update'
  | 'orders:delete'
  | 'orders:cancel'
  | 'orders:refund'
  | 'orders:export'

  // Customers
  | 'customers:view'
  | 'customers:create'
  | 'customers:update'
  | 'customers:delete'
  | 'customers:ban'
  | 'customers:unban'

  // Reviews
  | 'reviews:view'
  | 'reviews:approve'
  | 'reviews:reject'
  | 'reviews:delete'

  // Banners, Stories, Reels
  | 'content:view'
  | 'content:create'
  | 'content:update'
  | 'content:delete'
  | 'content:reorder'

  // Settings
  | 'settings:view'
  | 'settings:update'
  | 'settings:general'
  | 'settings:homepage'

  // Analytics
  | 'analytics:view'

  // Audit Logs
  | 'audit:view'
  | 'audit:export'

  // Staff Management
  | 'staff:view'
  | 'staff:create'
  | 'staff:update'
  | 'staff:delete'
  | 'staff:permissions';

/**
 * Role Permissions Configuration
 * Define which permissions each role has
 */

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Admin has ALL permissions
    'dashboard:view',
    'products:view',
    'products:create',
    'products:update',
    'products:delete',
    'products:manage-variants',
    'categories:view',
    'categories:create',
    'categories:update',
    'categories:delete',
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:delete',
    'orders:cancel',
    'orders:refund',
    'orders:export',
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'customers:ban',
    'customers:unban',
    'reviews:view',
    'reviews:approve',
    'reviews:reject',
    'reviews:delete',
    'content:view',
    'content:create',
    'content:update',
    'content:delete',
    'content:reorder',
    'settings:view',
    'settings:update',
    'settings:general',
    'settings:homepage',
    'analytics:view',
    'audit:view',
    'audit:export',
    'staff:view',
    'staff:create',
    'staff:update',
    'staff:delete',
    'staff:permissions',
  ],

  staff: [
    // Staff has limited permissions
    'dashboard:view',
    'products:view',
    'products:update',
    'products:manage-variants',
    'categories:view',
    'categories:update',
    'orders:view',
    'orders:update',
    'orders:cancel',
    'customers:view',
    'customers:update',
    'reviews:view',
    'reviews:approve',
    'reviews:reject',
    'content:view',
    'content:update',
    'settings:view',
    'analytics:view',
    'audit:view',
  ],

  user: [], // Regular users have no admin permissions
};

/**
 * Permission Groups
 * Group permissions for UI organization
 */
export const PERMISSION_GROUPS = {
  dashboard: ['dashboard:view'] as Permission[],
  products: [
    'products:view',
    'products:create',
    'products:update',
    'products:delete',
    'products:manage-variants',
  ] as Permission[],
  categories: [
    'categories:view',
    'categories:create',
    'categories:update',
    'categories:delete',
  ] as Permission[],
  orders: [
    'orders:view',
    'orders:create',
    'orders:update',
    'orders:delete',
    'orders:cancel',
    'orders:refund',
    'orders:export',
  ] as Permission[],
  customers: [
    'customers:view',
    'customers:create',
    'customers:update',
    'customers:delete',
    'customers:ban',
    'customers:unban',
  ] as Permission[],
  reviews: [
    'reviews:view',
    'reviews:approve',
    'reviews:reject',
    'reviews:delete',
  ] as Permission[],
  content: [
    'content:view',
    'content:create',
    'content:update',
    'content:delete',
    'content:reorder',
  ] as Permission[],
  settings: [
    'settings:view',
    'settings:update',
    'settings:general',
    'settings:homepage',
  ] as Permission[],
  analytics: ['analytics:view'] as Permission[],
  audit: ['audit:view', 'audit:export'] as Permission[],
  staff: [
    'staff:view',
    'staff:create',
    'staff:update',
    'staff:delete',
    'staff:permissions',
  ] as Permission[],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(
  userRole: string,
  permissions: Permission[]
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some((permission) => rolePermissions.includes(permission));
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(
  userRole: string,
  permissions: Permission[]
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.every((permission) => rolePermissions.includes(permission));
}

/**
 * Get user permissions as an array
 */
export function getUserPermissions(userRole: string): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if user can perform action on entity
 */
export function canPerformAction(
  userRole: string,
  action: 'view' | 'create' | 'update' | 'delete',
  entity: string
): boolean {
  const permission = `${entity}:${action}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Filter items based on user permissions
 */
export function filterByPermission<T extends { permission?: Permission }>(
  items: T[],
  userRole: string
): T[] {
  const userPermissions = getUserPermissions(userRole);
  return items.filter((item) => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'dashboard:view': 'View dashboard',
  'products:view': 'View products',
  'products:create': 'Create new products',
  'products:update': 'Update existing products',
  'products:delete': 'Delete products',
  'products:manage-variants': 'Manage product variants',
  'categories:view': 'View categories',
  'categories:create': 'Create new categories',
  'categories:update': 'Update existing categories',
  'categories:delete': 'Delete categories',
  'orders:view': 'View orders',
  'orders:create': 'Create orders',
  'orders:update': 'Update order status',
  'orders:delete': 'Delete orders',
  'orders:cancel': 'Cancel orders',
  'orders:refund': 'Process refunds',
  'orders:export': 'Export order data',
  'customers:view': 'View customer details',
  'customers:create': 'Create customer accounts',
  'customers:update': 'Update customer information',
  'customers:delete': 'Delete customer accounts',
  'customers:ban': 'Ban customers',
  'customers:unban': 'Unban customers',
  'reviews:view': 'View product reviews',
  'reviews:approve': 'Approve reviews',
  'reviews:reject': 'Reject reviews',
  'reviews:delete': 'Delete reviews',
  'content:view': 'View banners, stories, reels',
  'content:create': 'Create banners, stories, reels',
  'content:update': 'Update banners, stories, reels',
  'content:delete': 'Delete banners, stories, reels',
  'content:reorder': 'Reorder banners, stories, reels',
  'settings:view': 'View system settings',
  'settings:update': 'Update system settings',
  'settings:general': 'Manage general settings',
  'settings:homepage': 'Manage homepage configuration',
  'analytics:view': 'View analytics and reports',
  'audit:view': 'View audit logs',
  'audit:export': 'Export audit logs',
  'staff:view': 'View staff members',
  'staff:create': 'Add new staff members',
  'staff:update': 'Update staff information',
  'staff:delete': 'Remove staff members',
  'staff:permissions': 'Manage staff permissions',
};
