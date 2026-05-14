'use client';

import { useAuth } from '@/hooks/use-auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/db/types';

interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 *
 * Examples:
 * <PermissionGate permission="products:delete">
 *   <Button>Delete</Button>
 * </PermissionGate>
 *
 * <PermissionGate permissions={['products:update', 'products:delete']} requireAll={false}>
 *   <Button>Edit or Delete</Button>
 * </PermissionGate>
 *
 * <PermissionGate fallback={<div>Access Denied</div>}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = true,
  fallback = null,
  children,
  className,
}: PermissionGateProps) {
  const { user } = useAuth();
  const userRole = (user?.role || 'user') as UserRole;

  // Check single permission
  if (permission && !hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasRequired = requireAll
      ? permissions.every((p) => hasPermission(userRole, p))
      : permissions.some((p) => hasPermission(userRole, p));

    if (!hasRequired) {
      return <>{fallback}</>;
    }
  }

  return <div className={className}>{children}</div>;
}

/**
 * usePermission Hook
 * Check permissions programmatically
 *
 * Example:
 * const { hasPermission: canDelete } = usePermission('products:delete');
 */
export function usePermission(permission: Permission) {
  const { user } = useAuth();
  const userRole = (user?.role || 'user') as UserRole;
  return {
    hasPermission: hasPermission(userRole, permission),
  };
}

/**
 * usePermissions Hook
 * Check multiple permissions
 *
 * Example:
 * const { hasAll, hasAny } = usePermissions(['products:view', 'products:update']);
 */
export function usePermissions(permissions: Permission[]) {
  const { user } = useAuth();
  const userRole = (user?.role || 'user') as UserRole;

  return {
    hasAll: permissions.every((p) => hasPermission(userRole, p)),
    hasAny: permissions.some((p) => hasPermission(userRole, p)),
  };
}
