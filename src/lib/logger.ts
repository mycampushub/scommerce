type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private requestId: string | null = null;

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  clearRequestId() {
    this.requestId = null;
  }

  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const sensitive = [
      'password',
      'token',
      'secret',
      'creditcard',
      'cvv',
      'ssn',
      'apikey',
      'apisecret',
      'api_key',
      'api_secret',
      'jwt',
      'refreshtoken',
      'accesstoken',
      'authorization',
      'bearer'
    ];

    const sanitized: Record<string, any> = {};

    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitive.some(s => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitize(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      context: context ? this.sanitize(context) : undefined,
      timestamp: new Date().toISOString(),
      requestId: this.requestId || undefined
    };

    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}${
      entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    }${entry.requestId ? ` [RequestID: ${entry.requestId}]` : ''}`;

    if (this.isDevelopment) {
      // In development, use colored console output
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m', // green
        warn: '\x1b[33m', // yellow
        error: '\x1b[31m' // red
      };
      const reset = '\x1b[0m';

      console.log(`${colors[level]}${logMessage}${reset}`);
    } else {
      // In production, structured JSON logs
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  // Convenience methods for common scenarios
  apiRequest(method: string, path: string, context?: Record<string, any>) {
    this.info(`${method} ${path}`, { ...context, type: 'api_request' });
  }

  apiResponse(method: string, path: string, statusCode: number, context?: Record<string, any>) {
    this.info(`${method} ${path} - ${statusCode}`, { ...context, type: 'api_response', statusCode });
  }

  dbQuery(query: string, context?: Record<string, any>) {
    this.debug(`DB Query`, { query, ...context, type: 'db_query' });
  }

  authAction(action: string, userId?: string, context?: Record<string, any>) {
    this.info(`Auth: ${action}`, { ...context, type: 'auth', userId });
  }

  adminAction(action: string, adminId: string, context?: Record<string, any>) {
    this.info(`Admin: ${action}`, { ...context, type: 'admin_action', adminId });
  }
}

export const logger = new Logger();

// Middleware to track request IDs
export function withRequestId<T>(requestId: string, fn: () => T): T {
  logger.setRequestId(requestId);
  try {
    return fn();
  } finally {
    logger.clearRequestId();
  }
}
