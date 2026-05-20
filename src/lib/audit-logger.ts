import { generateId, execute, queryAll, queryFirst } from '@/db/db';
import type { AuditAction, AuditEntity } from '@/types/audit';
import type { Env } from '@/db/types';

export interface AuditLogOptions {
  adminId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the AdminLog table
 * Cloudflare D1-only version (no Prisma fallback)
 */
export async function logAuditEvent(
  env: Env | null,
  options: AuditLogOptions
): Promise<void> {
  try {
    // D1 environment only - use raw SQL
    await execute(
      env,
      `INSERT INTO admin_logs (id, adminId, action, entity, entityId, details, ipAddress, userAgent, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      generateId(),
      options.adminId,
      options.action,
      options.entity,
      options.entityId || null,
      options.details || null,
      options.ipAddress || null,
      options.userAgent || null,
      new Date().toISOString()
    );
  } catch (error) {
    // Don't throw errors for audit logging failures to avoid breaking main functionality
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get audit logs for a specific admin
 */
export async function getAdminAuditLogs(
  env: Env | null,
  adminId: string,
  limit: number = 50,
  offset: number = 0
) {
  // Use SQL JOIN to get admin details
  const logs = await queryAll<any>(
    env,
    `SELECT 
      al.*,
      u.name as adminName,
      u.email as adminEmail
     FROM admin_logs al
     LEFT JOIN users u ON al.adminId = u.id
     WHERE al.adminId = ?
     ORDER BY al.createdAt DESC
     LIMIT ? OFFSET ?`,
    adminId,
    limit,
    offset
  );

  const totalResult = await queryFirst<{ count: number }>(
    env,
    'SELECT COUNT(*) as count FROM admin_logs WHERE adminId = ?',
    adminId
  );

  return {
    logs,
    total: totalResult?.count || 0
  };
}

/**
 * Get all audit logs (for admin dashboard)
 */
export async function getAllAuditLogs(
  env: Env | null,
  filters: {
    adminId?: string;
    entity?: string;
    action?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { adminId, entity, action, limit = 50, offset = 0 } = filters;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (adminId) {
    conditions.push('al.adminId = ?');
    params.push(adminId);
  }
  if (entity) {
    conditions.push('al.entity = ?');
    params.push(entity);
  }
  if (action) {
    conditions.push('al.action = ?');
    params.push(action);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get logs with admin details
  const logs = await queryAll<any>(
    env,
    `SELECT 
      al.*,
      u.id as admin_id,
      u.name as adminName,
      u.email as adminEmail
     FROM admin_logs al
     LEFT JOIN users u ON al.adminId = u.id
     ${whereClause}
     ORDER BY al.createdAt DESC
     LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset
  );

  // Get total count
  const totalResult = await queryFirst<{ count: number }>(
    env,
    `SELECT COUNT(*) as count FROM admin_logs al ${whereClause}`,
    ...params
  );

  // Format results to match original structure
  const formattedLogs = logs.map(log => ({
    ...log,
    users: {
      id: log.admin_id,
      name: log.adminName,
      email: log.adminEmail,
    },
  }));

  return { 
    logs: formattedLogs, 
    total: totalResult?.count || 0 
  };
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  env: Env | null,
  entity: string,
  entityId: string,
  limit: number = 20
) {
  const logs = await queryAll<any>(
    env,
    `SELECT 
      al.*,
      u.id as admin_id,
      u.name as adminName,
      u.email as adminEmail
     FROM admin_logs al
     LEFT JOIN users u ON al.adminId = u.id
     WHERE al.entity = ? AND al.entityId = ?
     ORDER BY al.createdAt DESC
     LIMIT ?`,
    entity,
    entityId,
    limit
  );

  // Format results to match original structure
  return logs.map(log => ({
    ...log,
    users: {
      id: log.admin_id,
      name: log.adminName,
      email: log.adminEmail,
    },
  }));
}

/**
 * Helper to extract IP address from request headers
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIp ?? undefined;
}

/**
 * Helper to extract user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') ?? undefined;
}

/**
 * Helper to create audit log options from request context
 */
export function createAuditLogOptions(
  request: Request,
  adminId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId?: string,
  details?: string
): AuditLogOptions {
  return {
    adminId,
    action,
    entity,
    entityId,
    details,
    ipAddress: getIpAddress(request),
    userAgent: getUserAgent(request),
  };
}

/**
 * Log an admin action with request context (convenience function)
 */
export async function logAdminAction(
  env: Env | null,
  request: Request,
  adminId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId?: string,
  details?: string
): Promise<void> {
  const options = createAuditLogOptions(request, adminId, action, entity, entityId, details);
  await logAuditEvent(env, options);
}
