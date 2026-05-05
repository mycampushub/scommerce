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
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
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
  status: number = 400
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, status);
}

/**
 * Create a 401 unauthorized response
 */
export function unauthorizedResponse(
  error: string = 'Unauthorized'
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 401);
}

/**
 * Create a 403 forbidden response
 */
export function forbiddenResponse(
  error: string = 'Forbidden'
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403);
}

/**
 * Create a 404 not found response
 */
export function notFoundResponse(
  error: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 404);
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
    },
    { status: 429, headers }
  );
}
