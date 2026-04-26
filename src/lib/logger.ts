/**
 * Comprehensive Error Logging System
 * Supports different log levels: error, warn, info, debug
 * Outputs structured logs to console (production can be extended to send to external service)
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  stack?: string;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      entry.message,
    ];

    if (entry.userId) parts.push(`[User: ${entry.userId}]`);
    if (entry.requestId) parts.push(`[Request: ${entry.requestId}]`);

    let log = parts.join(' ');

    if (entry.context && Object.keys(entry.context).length > 0) {
      log += '\n' + JSON.stringify(entry.context, null, 2);
    }

    if (entry.stack) {
      log += '\nStack Trace:\n' + entry.stack;
    }

    return log;
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // In production, this could send logs to external services like:
    // - Sentry (error tracking)
    // - Cloudflare Workers KV
    // - Log aggregation services
    if (!this.isDevelopment) {
      // Example: Send to error tracking service
      // await fetch('/api/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    }
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.stack = error.stack;
      if (context) {
        entry.context = {
          ...context,
          errorMessage: error.message,
          errorName: error.name,
        };
      } else {
        entry.context = {
          errorMessage: error.message,
          errorName: error.name,
        };
      }
    }

    return entry;
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const entry = this.createEntry(LogLevel.ERROR, message, context, error);

    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatLog(entry);
      console.error(formatted);
    }

    // Always send errors to external service in production
    if (!this.isDevelopment) {
      this.sendToExternalService(entry).catch((err) => {
        console.error('Failed to send log to external service:', err);
      });
    }
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.WARN, message, context);

    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatLog(entry);
      console.warn(formatted);
    }
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.INFO, message, context);

    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatLog(entry);
      console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, context);

    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatLog(entry);
      console.debug(formatted);
    }
  }

  // Helper method to log API requests
  logApiRequest(
    method: string,
    path: string,
    userId?: string,
    requestId?: string,
    context?: LogContext
  ): void {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      type: 'API_REQUEST',
      method,
      path,
      userId,
      requestId,
    });
  }

  // Helper method to log API responses
  logApiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string,
    context?: LogContext
  ): void {
    this.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, {
      ...context,
      type: 'API_RESPONSE',
      method,
      path,
      statusCode,
      duration,
      userId,
      requestId,
    });
  }

  // Helper method to log API errors
  logApiError(
    method: string,
    path: string,
    error: Error,
    statusCode: number,
    userId?: string,
    requestId?: string,
    context?: LogContext
  ): void {
    this.error(`API Error: ${method} ${path} - ${statusCode}`, {
      ...context,
      type: 'API_ERROR',
      method,
      path,
      statusCode,
      userId,
      requestId,
      errorMessage: error.message,
      errorName: error.name,
    }, error);
  }

  // Helper method to log database operations
  logDatabaseOperation(
    operation: string,
    model: string,
    context?: LogContext
  ): void {
    this.debug(`Database: ${operation} on ${model}`, {
      ...context,
      type: 'DATABASE_OPERATION',
      operation,
      model,
    });
  }

  // Helper method to log business logic events
  logBusinessEvent(
    event: string,
    context?: LogContext
  ): void {
    this.info(`Business Event: ${event}`, {
      ...context,
      type: 'BUSINESS_EVENT',
      event,
    });
  }

  // Helper method to log security events
  logSecurityEvent(
    event: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    context?: LogContext
  ): void {
    const level = severity === 'CRITICAL' || severity === 'HIGH' ? LogLevel.ERROR : LogLevel.WARN;
    this[level.toLowerCase() as 'error' | 'warn'](`Security Event: ${event} [${severity}]`, {
      ...context,
      type: 'SECURITY_EVENT',
      event,
      severity,
    });
  }
}

// Create and export singleton instance
export const logger = new Logger();

// Export types for use in other modules
export type { LogEntry, LogContext };
