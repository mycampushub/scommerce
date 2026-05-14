import { NextResponse } from 'next/server';

/**
 * Standard API response format
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Common error codes
 */
export enum ErrorCode {
  // Validation errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PHONE = 'INVALID_PHONE',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  PASSWORD_WEAK = 'PASSWORD_WEAK',

  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_PHONE = 'DUPLICATE_PHONE',
  DUPLICATE_SLUG = 'DUPLICATE_SLUG',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // File upload errors
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
}

/**
 * Create a success response
 */
export function successResponse<T = any>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: ErrorCode | string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T = any>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
  },
  status: number = 200
): NextResponse<{ success: true; data: T[] } & PaginatedResponse<T>> {
  const { page, limit, totalCount } = pagination;
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return NextResponse.json(
    {
      success: true,
      data,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  error: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 400, ErrorCode.VALIDATION_ERROR, details);
}

/**
 * Create a 401 unauthorized response
 */
export function unauthorizedResponse(
  error: string = 'Unauthorized',
  code: ErrorCode = ErrorCode.UNAUTHORIZED
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 401, code);
}

/**
 * Create a 403 forbidden response
 */
export function forbiddenResponse(
  error: string = 'Forbidden',
  code: ErrorCode = ErrorCode.FORBIDDEN
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403, code);
}

/**
 * Create a 404 not found response
 */
export function notFoundResponse(
  error: string = 'Resource not found',
  code: ErrorCode = ErrorCode.NOT_FOUND
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 404, code);
}

/**
 * Create a 429 rate limit response
 */
export function rateLimitResponse(
  error: string = 'Rate limit exceeded',
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const headers: HeadersInit = {};

  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter);
  }

  return NextResponse.json(
    {
      success: false,
      error,
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
    },
    { status: 429, headers }
  );
}

/**
 * Create a conflict error response (409)
 */
export function conflictResponse(
  error: string,
  code: ErrorCode = ErrorCode.CONFLICT,
  details?: any
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 409, code, details);
}
