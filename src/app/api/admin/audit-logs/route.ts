import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { getAllAuditLogs } from '@/lib/audit-logger';
import type { AuditEntity, AuditAction } from '@/types/audit';

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Extract filters from query params
    const adminId = searchParams.get('adminId') || undefined;
    const entity = searchParams.get('entity') as AuditEntity | undefined;
    const action = searchParams.get('action') as AuditAction | undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate limit
    const validLimit = Math.min(Math.max(limit, 1), 100); // Max 100 records

    // Get audit logs
    const result = await getAllAuditLogs({
      adminId,
      entity,
      action,
      limit: validLimit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit: validLimit,
        offset,
        hasMore: offset + result.logs.length < result.total,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audit logs',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
