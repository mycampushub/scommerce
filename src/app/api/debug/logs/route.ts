import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDebugLogs,
  getFilteredLogs,
  getErrorSummary,
  getStatsByStatus,
  clearDebugLogs,
} from '@/lib/api-debugger';

/**
 * GET /api/debug/logs
 * 
 * Query parameters:
 * - method: Filter by HTTP method (GET, POST, etc.)
 * - path: Filter by path (partial match)
 * - status: Filter by HTTP status code
 * - hasError: Filter by errors (true/false)
 * - limit: Limit number of results
 * - summary: Return summary only (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const summary = searchParams.get('summary') === 'true';

    // Return summary if requested
    if (summary) {
      const errorSummary = getErrorSummary();
      const statsByStatus = getStatsByStatus();
      const allLogs = getAllDebugLogs();

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        totalLogs: allLogs.length,
        statsByStatus,
        errorSummary,
        recentLogs: allLogs.slice(-20).map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          method: log.method,
          path: log.path,
          status: log.responseStatus,
          hasError: !!log.error,
          responseTime: log.responseTime,
        })),
      });
    }

    // Build filters
    const filters: any = {};

    if (searchParams.get('method')) {
      filters.method = searchParams.get('method');
    }

    if (searchParams.get('path')) {
      filters.path = searchParams.get('path');
    }

    if (searchParams.get('status')) {
      filters.status = parseInt(searchParams.get('status')!, 10);
    }

    if (searchParams.get('hasError') !== null) {
      filters.hasError = searchParams.get('hasError') === 'true';
    }

    // Get filtered logs
    let logs = Object.keys(filters).length > 0 
      ? getFilteredLogs(filters)
      : getAllDebugLogs();

    // Limit results
    const limit = searchParams.get('limit');
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        logs = logs.slice(-limitNum);
      }
    }

    // Return logs
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total: logs.length,
      filters,
      logs: logs.map(log => sanitizeLog(log)),
    });
  } catch (error) {
    console.error('[Debug Logs] Error:', error);
    return NextResponse.json(
      {
        error: true,
        message: 'Failed to retrieve debug logs',
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/debug/logs
 * 
 * Clear all debug logs
 */
export async function DELETE(request: NextRequest) {
  try {
    clearDebugLogs();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      message: 'All debug logs cleared',
    });
  } catch (error) {
    console.error('[Debug Logs] Error clearing logs:', error);
    return NextResponse.json(
      {
        error: true,
        message: 'Failed to clear debug logs',
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Sanitize log to remove sensitive data
 */
function sanitizeLog(log: any): any {
  const sanitized = { ...log };

  // Remove or mask sensitive headers
  if (sanitized.headers) {
    if (sanitized.headers['authorization']) {
      sanitized.headers['authorization'] = '***REDACTED***';
    }
    if (sanitized.headers['cookie']) {
      sanitized.headers['cookie'] = '***REDACTED***';
    }
    if (sanitized.headers['x-api-key']) {
      sanitized.headers['x-api-key'] = '***REDACTED***';
    }
  }

  // Remove request body (could contain sensitive data)
  if (sanitized.body) {
    sanitized.body = '<body omitted for security>';
  }

  // Trim large response bodies
  if (sanitized.responseBody) {
    const str = JSON.stringify(sanitized.responseBody);
    if (str.length > 5000) {
      sanitized.responseBody = JSON.parse(str.substring(0, 5000)) + '... (truncated)';
    }
  }

  return sanitized;
}
