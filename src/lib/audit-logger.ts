import { db } from '@/lib/db';
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
 * This function is called from server-side code (API routes, server actions)
 * Supports both Prisma (local dev) and D1 (Cloudflare)
 */
export async function logAuditEvent(
  env: Env | null,
  options: AuditLogOptions
): Promise<void> {
  try {
    // Use Prisma if env is null or env.DB doesn't exist (local dev)
    if (!env || !env.DB) {
      await db.admin_logs.create({
        data: {
          id: generateId(),
          adminId: options.adminId,
          action: options.action,
          entity: options.entity,
          entityId: options.entityId,
          details: options.details,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        },
      });
    } else {
      // D1 environment
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
    }
  } catch (error) {
    // Don't throw errors for audit logging failures to avoid breaking main functionality
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get audit logs for a specific admin
 */
export async function getAdminAuditLogs(
  adminId: string,
  limit: number = 50,
  offset: number = 0
) {
  return await db.admin_logs.findMany({
    where: { adminId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get all audit logs (for admin dashboard)
 */
export async function getAllAuditLogs(filters: {
  adminId?: string;
  entity?: string;
  action?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { adminId, entity, action, limit = 50, offset = 0 } = filters;

  const where: any = {};
  if (adminId) where.adminId = adminId;
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    db.admin_logs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    db.admin_logs.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entity: string,
  entityId: string,
  limit: number = 20
) {
  return await db.admin_logs.findMany({
    where: {
      entity,
      entityId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
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
