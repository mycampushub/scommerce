/**
 * Simple API Error Logger
 * 
 * Logs API errors to KV storage for debugging
 * This doesn't require modifying every API route
 */

export interface ApiErrorLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  message: string;
  stack?: string;
  userId?: string;
  ip?: string;
}

const KV_ERROR_LOG_KEY = 'api_error_logs';

/**
 * Log an API error to KV
 */
export async function logApiError(
  env: any,
  method: string,
  path: string,
  status: number,
  error: Error | string,
  request?: Request
): Promise<void> {
  try {
    if (!env?.KV) {
      console.warn('[ApiLogger] KV not available, logging to console only');
      return;
    }

    // Get existing logs
    const existing = await env.KV.get(KV_ERROR_LOG_KEY, 'json') as ApiErrorLog[] || [];
    
    // Create new log entry
    const newLog: ApiErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      method,
      path,
      status,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    // Add request metadata
    if (request) {
      const url = new URL(request.url);
      newLog.ip = request.headers.get('cf-connecting-ip') || 
                 request.headers.get('x-forwarded-for') || 
                 'unknown';
      
      const sessionCookie = request.headers.get('cookie');
      if (sessionCookie?.includes('session=')) {
        // Extract user ID from session (basic parsing)
        const match = sessionCookie.match(/session=([^;]+)/);
        if (match) {
          try {
            const decoded = JSON.parse(atob(match[1].split('.')[0]));
            newLog.userId = decoded.userId;
          } catch (e) {
            // Ignore decode errors
          }
        }
      }
    }

    // Add to logs (keep last 100)
    const updatedLogs = [...existing, newLog].slice(-100);

    // Save to KV
    await env.KV.put(KV_ERROR_LOG_KEY, JSON.stringify(updatedLogs));
    
    console.log(`[ApiLogger] Logged error: ${method} ${path} - ${status} - ${newLog.message}`);
  } catch (e) {
    console.error('[ApiLogger] Failed to log error:', e);
  }
}

/**
 * Get all error logs from KV
 */
export async function getApiErrorLogs(env: any): Promise<ApiErrorLog[]> {
  try {
    if (!env?.KV) {
      console.warn('[ApiLogger] KV not available');
      return [];
    }

    const logs = await env.KV.get(KV_ERROR_LOG_KEY, 'json') as ApiErrorLog[] || [];
    return logs;
  } catch (e) {
    console.error('[ApiLogger] Failed to get logs:', e);
    return [];
  }
}

/**
 * Clear all error logs from KV
 */
export async function clearApiErrorLogs(env: any): Promise<void> {
  try {
    if (!env?.KV) {
      console.warn('[ApiLogger] KV not available');
      return;
    }

    await env.KV.delete(KV_ERROR_LOG_KEY);
    console.log('[ApiLogger] Cleared all error logs');
  } catch (e) {
    console.error('[ApiLogger] Failed to clear logs:', e);
  }
}

/**
 * Get error summary
 */
export async function getErrorSummary(env: any): Promise<{
  total: number;
  byStatus: Record<number, number>;
  byPath: Record<string, number>;
  recent: ApiErrorLog[];
}> {
  const logs = await getApiErrorLogs(env);
  
  const byStatus: Record<number, number> = {};
  const byPath: Record<string, number> = {};

  logs.forEach(log => {
    byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    byPath[log.path] = (byPath[log.path] || 0) + 1;
  });

  return {
    total: logs.length,
    byStatus,
    byPath,
    recent: logs.slice(-20),
  };
}
