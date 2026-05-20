/**
 * Granular permission system for admin/staff roles
 *
 * This system allows fine-grained control over what actions users can perform
 * based on their role and individual permissions.
 */

import { UserRole } from '@/db/types';

/**
 * Permission categories and actions
 */
export enum Permission {
  // Product Management
  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_EDIT = 'products:edit',
  PRODUCTS_DELETE = 'products:delete',

  // Category Management
  CATEGORIES_VIEW = 'categories:view',
  CATEGORIES_CREATE = 'categories:create',
  CATEGORIES_EDIT = 'categories:edit',
  CATEGORIES_DELETE = 'categories:delete',

  // Order Management
  ORDERS_VIEW = 'orders:view',
  ORDERS_UPDATE_STATUS = 'orders:update_status',
  ORDERS_CANCEL = 'orders:cancel',
  ORDERS_REFUND = 'orders:refund',
  ORDERS_DELETE = 'orders:delete',

  // User Management
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_BAN = 'users:ban',

  // Staff Management
  STAFF_VIEW = 'staff:view',
  STAFF_CREATE = 'staff:create',
  STAFF_EDIT = 'staff:edit',
  STAFF_DELETE = 'staff:delete',

  // Inventory Management
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_EDIT = 'inventory:edit',
  INVENTORY_ALERTS_MANAGE = 'inventory:alerts_manage',

  // Content Management
  BANNERS_VIEW = 'banners:view',
  BANNERS_CREATE = 'banners:create',
  BANNERS_EDIT = 'banners:edit',
  BANNERS_DELETE = 'banners:delete',

  PROMOTIONS_VIEW = 'promotions:view',
  PROMOTIONS_CREATE = 'promotions:create',
  PROMOTIONS_EDIT = 'promotions:edit',
  PROMOTIONS_DELETE = 'promotions:delete',

  STORIES_VIEW = 'stories:view',
  STORIES_CREATE = 'stories:create',
  STORIES_EDIT = 'stories:edit',
  STORIES_DELETE = 'stories:delete',

  REELS_VIEW = 'reels:view',
  REELS_CREATE = 'reels:create',
  REELS_EDIT = 'reels:edit',
  REELS_DELETE = 'reels:delete',

  // Analytics & Reports
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',

  // Settings Management
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  SETTINGS_SHIPPING = 'settings:shipping',
  SETTINGS_PAYMENT = 'settings:payment',

  // System Operations
  SYSTEM_LOGS_VIEW = 'system:logs_view',
  SYSTEM_LOGS_EXPORT = 'system:logs_export',
  SYSTEM_ARCHIVE_ORDERS = 'system:archive_orders',
  SYSTEM_BACKUP = 'system:backup',
}

/**
 * Default permissions by role
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],
  staff: [
    // Staff has limited permissions - can view and edit but not delete
    // Products
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_EDIT,

    // Categories
    Permission.CATEGORIES_VIEW,
    Permission.CATEGORIES_CREATE,
    Permission.CATEGORIES_EDIT,

    // Orders
    Permission.ORDERS_VIEW,
    Permission.ORDERS_UPDATE_STATUS,

    // Users
    Permission.USERS_VIEW,

    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_EDIT,
    Permission.INVENTORY_ALERTS_MANAGE,

    // Content
    Permission.BANNERS_VIEW,
    Permission.BANNERS_CREATE,
    Permission.BANNERS_EDIT,
    Permission.PROMOTIONS_VIEW,
    Permission.PROMOTIONS_CREATE,
    Permission.PROMOTIONS_EDIT,
    Permission.STORIES_VIEW,
    Permission.STORIES_CREATE,
    Permission.STORIES_EDIT,
    Permission.REELS_VIEW,
    Permission.REELS_CREATE,
    Permission.REELS_EDIT,

    // Analytics
    Permission.ANALYTICS_VIEW,

    // Settings
    Permission.SETTINGS_VIEW,
  ],
  user: [],
  vip: [],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Permission middleware for API routes
 * Returns true if authorized, false if not
 */
export function requirePermission(role: UserRole, permission: Permission): boolean {
  return hasPermission(role, permission);
}

/**
 * Permission middleware requiring admin or staff role
 */
export function requireAdminOrStaff(role: UserRole): boolean {
  return role === 'admin' || role === 'staff';
}

/**
 * Permission middleware requiring admin role only
 */
export function requireAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Permission groups for easier checking
 */
export const PermissionGroups = {
  // Can manage products
  products: [
    Permission.PRODUCTS_VIEW,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_EDIT,
    Permission.PRODUCTS_DELETE,
  ],

  // Can manage categories
  categories: [
    Permission.CATEGORIES_VIEW,
    Permission.CATEGORIES_CREATE,
    Permission.CATEGORIES_EDIT,
    Permission.CATEGORIES_DELETE,
  ],

  // Can manage orders
  orders: [
    Permission.ORDERS_VIEW,
    Permission.ORDERS_UPDATE_STATUS,
    Permission.ORDERS_CANCEL,
    Permission.ORDERS_REFUND,
    Permission.ORDERS_DELETE,
  ],

  // Can manage users
  users: [
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_BAN,
  ],

  // Can manage staff
  staff: [
    Permission.STAFF_VIEW,
    Permission.STAFF_CREATE,
    Permission.STAFF_EDIT,
    Permission.STAFF_DELETE,
  ],

  // Can manage inventory
  inventory: [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_EDIT,
    Permission.INVENTORY_ALERTS_MANAGE,
  ],

  // Can manage content (banners, promotions, stories, reels)
  content: [
    Permission.BANNERS_VIEW,
    Permission.BANNERS_CREATE,
    Permission.BANNERS_EDIT,
    Permission.BANNERS_DELETE,
    Permission.PROMOTIONS_VIEW,
    Permission.PROMOTIONS_CREATE,
    Permission.PROMOTIONS_EDIT,
    Permission.PROMOTIONS_DELETE,
    Permission.STORIES_VIEW,
    Permission.STORIES_CREATE,
    Permission.STORIES_EDIT,
    Permission.STORIES_DELETE,
    Permission.REELS_VIEW,
    Permission.REELS_CREATE,
    Permission.REELS_EDIT,
    Permission.REELS_DELETE,
  ],

  // Can access analytics
  analytics: [
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
  ],

  // Can manage settings
  settings: [
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.SETTINGS_SHIPPING,
    Permission.SETTINGS_PAYMENT,
  ],

  // Can perform system operations
  system: [
    Permission.SYSTEM_LOGS_VIEW,
    Permission.SYSTEM_LOGS_EXPORT,
    Permission.SYSTEM_ARCHIVE_ORDERS,
    Permission.SYSTEM_BACKUP,
  ],
};

/**
 * Check if role has permission for a group
 */
export function hasPermissionGroup(role: UserRole, group: keyof typeof PermissionGroups): boolean {
  const permissions = PermissionGroups[group];
  return hasAllPermissions(role, permissions);
}

/**
 * Check if role has at least one permission from a group
 */
export function hasAnyPermissionInGroup(role: UserRole, group: keyof typeof PermissionGroups): boolean {
  const permissions = PermissionGroups[group];
  return hasAnyPermission(role, permissions);
}
