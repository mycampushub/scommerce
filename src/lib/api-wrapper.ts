/**
 * API Route Wrapper
 * 
 * This wrapper provides automatic debugging, error handling, and logging
 * for all API routes in the application.
 * 
 * Usage:
 * export async function GET(request: Request) {
 *   return withApiDebug(request, 'GET', async (req, env) => {
 *     // Your API logic here
 *     return NextResponse.json({ data });
 *   });
 * }
 */

import { NextResponse } from 'next/server';
import {
  createDebugLogEntry,
  addResponseData,
  addErrorData,
} from './api-debugger';
import { getEnv } from './cloudflare';

export interface ApiHandlerOptions {
  skipDebug?: boolean;
  errorHandler?: (error: Error, request: Request) => Response;
  transformRequest?: (request: Request) => any;
}

/**
 * Wrap an API handler with automatic debugging and error handling
 */
export async function withApiDebug(
  request: Request,
  method: string,
  handler: (request: Request, env: any) => Promise<Response> | Response,
  options: ApiHandlerOptions = {}
): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip debugging for health checks
  if (path === '/api/health' || options.skipDebug) {
    return handler(request, getEnv(request));
  }

  // Create debug log entry
  const debugEntry = createDebugLogEntry(method, path, request);

  // Try to get environment and update debug entry
  try {
    const env = getEnv(request);
    if (env) {
      debugEntry.environment.bindingsFound = true;
      debugEntry.environment.hasDB = !!env.DB || !!env.prisma;
      debugEntry.environment.hasKV = !!env.KV;
      debugEntry.environment.hasBUCKET = !!env.BUCKET;
    }
  } catch (e) {
    // Environment check failed
  }

  try {
    // Transform request if needed
    const transformedRequest = options.transformRequest 
      ? options.transformRequest(request) 
      : request;

    // Get environment
    const env = getEnv(transformedRequest);

    // Call the actual handler
    const response = await handler(transformedRequest, env);

    // Add response data to debug log
    addResponseData(debugEntry, response, startTime);

    return response;
  } catch (error) {
    // Add error data to debug log
    addErrorData(debugEntry, error, startTime);

    // Use custom error handler if provided
    if (options.errorHandler && error instanceof Error) {
      return options.errorHandler(error, request);
    }

    // Default error handling
    console.error(`[API Error] ${method} ${path}:`, error);

    // Determine appropriate status code
    let status = 500;
    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      message = error.message;

      // Check for common error types
      if (error.name === 'ValidationError') {
        status = 400;
      } else if (error.name === 'UnauthorizedError') {
        status = 401;
      } else if (error.name === 'ForbiddenError') {
        status = 403;
      } else if (error.name === 'NotFoundError') {
        status = 404;
      } else if (error.name === 'ConflictError') {
        status = 409;
      } else if (error.name === 'RateLimitError') {
        status = 429;
      }
    }

    // Return error response
    return NextResponse.json(
      {
        error: true,
        message,
        status,
        timestamp: new Date().toISOString(),
        debugId: debugEntry.id,
      },
      { status }
    );
  }
}

/**
 * Create a standard error with proper name
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}
