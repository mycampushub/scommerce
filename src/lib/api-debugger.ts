/**
 * API Debugger System
 * 
 * This system captures and logs all API requests, responses, and errors
 * across the entire application for debugging purposes.
 */

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: any;

  // Response data
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  responseTime?: number;

  // Error data
  error?: {
    message: string;
    stack?: string;
    name: string;
  };

  // Environment info
  environment: {
    nodeEnv: string;
    bindingsFound: boolean;
    hasDB: boolean;
    hasKV: boolean;
    hasBUCKET: boolean;
  };

  // Metadata
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

// Store logs in memory (in production, use KV for persistence)
let debugLogs: DebugLogEntry[] = [];
const MAX_LOGS = 500; // Keep only last 500 logs

/**
 * Create a debug log entry
 */
export function createDebugLogEntry(
  method: string,
  path: string,
  request: Request
): DebugLogEntry {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const entry: DebugLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    method,
    path,
    query: Object.fromEntries(url.searchParams.entries()),
    headers,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      bindingsFound: false,
      hasDB: false,
      hasKV: false,
      hasBUCKET: false,
    },
    userAgent: headers['user-agent'],
    ip: headers['cf-connecting-ip'] || headers['x-forwarded-for'] || 'unknown',
  };

  // Try to extract body for non-GET requests
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const contentType = headers['content-type'];
      if (contentType?.includes('application/json')) {
        entry.body = request.clone().json();
      }
    } catch (e) {
      entry.body = '<unable to parse>';
    }
  }

  return entry;
}

/**
 * Add response data to debug log
 */
export function addResponseData(
  entry: DebugLogEntry,
  response: Response,
  startTime: number
): void {
  entry.responseStatus = response.status;
  entry.responseTime = Date.now() - startTime;

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  entry.responseHeaders = responseHeaders;

  // Try to clone and read response body
  try {
    const clonedResponse = response.clone();
    clonedResponse.json().then((data) => {
      entry.responseBody = data;
      saveLog(entry);
    }).catch(() => {
      entry.responseBody = '<unable to parse response>';
      saveLog(entry);
    });
  } catch (e) {
    saveLog(entry);
  }
}

/**
 * Add error data to debug log
 */
export function addErrorData(
  entry: DebugLogEntry,
  error: Error | unknown,
  startTime: number
): void {
  entry.responseTime = Date.now() - startTime;

  if (error instanceof Error) {
    entry.error = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
    entry.responseStatus = 500;
  } else {
    entry.error = {
      message: String(error),
      name: 'UnknownError',
    };
    entry.responseStatus = 500;
  }

  saveLog(entry);
}

/**
 * Save log to storage
 */
function saveLog(entry: DebugLogEntry): void {
  debugLogs.push(entry);

  // Keep only the last MAX_LOGS entries
  if (debugLogs.length > MAX_LOGS) {
    debugLogs = debugLogs.slice(-MAX_LOGS);
  }
}

/**
 * Get all debug logs
 */
export function getAllDebugLogs(): DebugLogEntry[] {
  return [...debugLogs];
}

/**
 * Get logs filtered by criteria
 */
export function getFilteredLogs(filters: {
  method?: string;
  path?: string;
  status?: number;
  hasError?: boolean;
  since?: Date;
}): DebugLogEntry[] {
  let filtered = [...debugLogs];

  if (filters.method) {
    filtered = filtered.filter(log => log.method === filters.method);
  }

  if (filters.path) {
    filtered = filtered.filter(log => log.path.includes(filters.path!));
  }

  if (filters.status) {
    filtered = filtered.filter(log => log.responseStatus === filters.status);
  }

  if (filters.hasError !== undefined) {
    filtered = filtered.filter(log => !!log.error === filters.hasError);
  }

  if (filters.since) {
    filtered = filtered.filter(log => 
      new Date(log.timestamp) >= filters.since!
    );
  }

  return filtered;
}

/**
 * Get error summary
 */
export function getErrorSummary(): {
  totalErrors: number;
  errorsByStatus: Record<number, number>;
  errorsByPath: Record<string, number>;
  recentErrors: DebugLogEntry[];
} {
  const errors = debugLogs.filter(log => log.error || (log.responseStatus && log.responseStatus >= 400));

  const errorsByStatus: Record<number, number> = {};
  const errorsByPath: Record<string, number> = {};

  errors.forEach(log => {
    const status = log.responseStatus || 500;
    errorsByStatus[status] = (errorsByStatus[status] || 0) + 1;
    errorsByPath[log.path] = (errorsByPath[log.path] || 0) + 1;
  });

  return {
    totalErrors: errors.length,
    errorsByStatus,
    errorsByPath,
    recentErrors: errors.slice(-10),
  };
}

/**
 * Clear all logs
 */
export function clearDebugLogs(): void {
  debugLogs = [];
}

/**
 * Get logs count by status
 */
export function getStatsByStatus(): {
  success: number; // 2xx
  redirect: number; // 3xx
  clientError: number; // 4xx
  serverError: number; // 5xx
  unknown: number;
} {
  const stats = {
    success: 0,
    redirect: 0,
    clientError: 0,
    serverError: 0,
    unknown: 0,
  };

  debugLogs.forEach(log => {
    const status = log.responseStatus;
    if (!status) {
      stats.unknown++;
    } else if (status >= 200 && status < 300) {
      stats.success++;
    } else if (status >= 300 && status < 400) {
      stats.redirect++;
    } else if (status >= 400 && status < 500) {
      stats.clientError++;
    } else if (status >= 500) {
      stats.serverError++;
    }
  });

  return stats;
}
