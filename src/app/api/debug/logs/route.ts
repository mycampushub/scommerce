import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { getApiErrorLogs, clearApiErrorLogs, getErrorSummary } from '@/lib/api-logger';

/**
 * GET /api/debug/logs
 * 
 * Query parameters:
 * - summary: Return summary only (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const summary = searchParams.get('summary') === 'true';

    // Get environment and logs
    const env = getEnv(request);

    if (!env) {
      return NextResponse.json(
        {
          error: true,
          message: 'Environment not available',
        },
        { status: 500 }
      );
    }

    // Return summary if requested
    if (summary) {
      const errorSummary = await getErrorSummary(env);

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        totalLogs: errorSummary.total,
        errorsByStatus: errorSummary.byStatus,
        errorsByPath: errorSummary.byPath,
        recentLogs: errorSummary.recent,
      });
    }

    // Get all logs
    const logs = await getApiErrorLogs(env);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total: logs.length,
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
    const env = getEnv(request);

    if (!env) {
      return NextResponse.json(
        {
          error: true,
          message: 'Environment not available',
        },
        { status: 500 }
      );
    }

    await clearApiErrorLogs(env);

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

  // Remove sensitive data
  if (sanitized.userId) {
    sanitized.userId = sanitized.userId.substring(0, 10) + '...';
  }
  if (sanitized.ip) {
    sanitized.ip = sanitized.ip.split('.')[0] + '.***.***.***';
  }

  return sanitized;
}

