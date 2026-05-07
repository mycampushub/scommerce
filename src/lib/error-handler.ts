/**
 * Enhanced Error Handler with User-Friendly Messages
 * Provides centralized error handling with specific, actionable error messages
 */

import { NextResponse } from 'next/server';

// Error types for better categorization
export enum ErrorType {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Resources
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRODUCT_NOT_AVAILABLE = 'PRODUCT_NOT_AVAILABLE',

  // Payment & Orders
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_CANNOT_CANCEL = 'ORDER_CANNOT_CANCEL',
  ORDER_CANNOT_REFUND = 'ORDER_CANNOT_REFUND',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',

  // Cart & Wishlist
  CART_ITEM_NOT_FOUND = 'CART_ITEM_NOT_FOUND',
  WISHLIST_ITEM_EXISTS = 'WISHLIST_ITEM_EXISTS',
  WISHLIST_ITEM_NOT_FOUND = 'WISHLIST_ITEM_NOT_FOUND',

  // File & Media
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Network & Server
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

// Error codes for client-side handling
export enum ErrorCode {
  // Auth errors (1000-1099)
  INVALID_CREDENTIALS = 1001,
  EMAIL_NOT_VERIFIED_CODE = 1002,
  ACCOUNT_LOCKED_CODE = 1003,
  PASSWORD_RESET_REQUIRED = 1004,
  SESSION_EXPIRED_CODE = 1005,

  // Validation errors (1100-1199)
  INVALID_EMAIL = 1101,
  INVALID_PASSWORD = 1102,
  INVALID_PHONE = 1103,
  INVALID_PRICE = 1104,
  INVALID_QUANTITY = 1105,

  // Product errors (2000-2099)
  PRODUCT_NOT_FOUND_CODE = 2001,
  PRODUCT_OUT_OF_STOCK_CODE = 2002,
  PRODUCT_VARIANT_NOT_FOUND = 2003,
  CATEGORY_NOT_FOUND = 2004,

  // Cart errors (3000-3099)
  CART_ITEM_NOT_FOUND_CODE = 3001,
  CART_LIMIT_EXCEEDED = 3002,

  // Order errors (4000-4099)
  ORDER_NOT_FOUND_CODE = 4001,
  ORDER_INVALID_STATUS = 4002,
  PAYMENT_DECLINED = 4003,

  // Server errors (5000-5099)
  DATABASE_ERROR_CODE = 5001,
  NETWORK_ERROR_CODE = 5002,
  DUPLICATE_RECORD = 5003,
  RECORD_NOT_FOUND = 5004,
  CONSTRAINT_VIOLATION = 5005,
  INTERNAL_ERROR = 5099,
}

// Detailed error messages
const ERROR_MESSAGES: Record<ErrorType, string> = {
  // Authentication & Authorization
  [ErrorType.UNAUTHORIZED]: 'You need to sign in to access this feature',
  [ErrorType.FORBIDDEN]: "You don't have permission to perform this action",
  [ErrorType.INVALID_TOKEN]: 'Your session is invalid. Please sign in again',
  [ErrorType.EXPIRED_TOKEN]: 'Your session has expired. Please sign in again',
  [ErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
  [ErrorType.EMAIL_NOT_VERIFIED]: 'Please verify your email address before continuing',
  [ErrorType.ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support',

  // Validation
  [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorType.INVALID_INPUT]: 'The information provided is invalid',
  [ErrorType.MISSING_REQUIRED_FIELD]: 'Some required information is missing',
  [ErrorType.INVALID_FORMAT]: 'The format of the information is incorrect',

  // Database
  [ErrorType.DATABASE_ERROR]: 'Unable to save your changes. Please try again',
  [ErrorType.RECORD_NOT_FOUND]: 'The requested information was not found',
  [ErrorType.DUPLICATE_RECORD]: 'This information already exists',
  [ErrorType.CONSTRAINT_VIOLATION]: 'This action conflicts with existing data',

  // Rate Limiting
  [ErrorType.RATE_LIMITED]: 'You are making too many requests. Please wait a moment',
  [ErrorType.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later',

  // Resources
  [ErrorType.OUT_OF_STOCK]: 'This item is currently out of stock',
  [ErrorType.INSUFFICIENT_STOCK]: 'Only {quantity} items are available',
  [ErrorType.PRODUCT_NOT_AVAILABLE]: 'This product is not available',

  // Payment & Orders
  [ErrorType.PAYMENT_FAILED]: 'Payment could not be processed. Please try again',
  [ErrorType.ORDER_NOT_FOUND]: 'Order not found',
  [ErrorType.ORDER_CANNOT_CANCEL]: 'This order cannot be cancelled',
  [ErrorType.ORDER_CANNOT_REFUND]: 'This order cannot be refunded',
  [ErrorType.INVALID_ORDER_STATUS]: 'Invalid order status for this action',

  // Cart & Wishlist
  [ErrorType.CART_ITEM_NOT_FOUND]: 'Item not found in your cart',
  [ErrorType.WISHLIST_ITEM_EXISTS]: 'Item is already in your wishlist',
  [ErrorType.WISHLIST_ITEM_NOT_FOUND]: 'Item not found in your wishlist',

  // File & Media
  [ErrorType.FILE_TOO_LARGE]: 'File is too large. Maximum size is {maxSize}MB',
  [ErrorType.INVALID_FILE_TYPE]: 'Invalid file type. Allowed types: {allowedTypes}',
  [ErrorType.UPLOAD_FAILED]: 'Failed to upload file. Please try again',

  // Network & Server
  [ErrorType.NETWORK_ERROR]: 'Connection error. Please check your internet connection',
  [ErrorType.SERVER_ERROR]: 'Something went wrong. Please try again',
  [ErrorType.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
  [ErrorType.MAINTENANCE_MODE]: 'We are currently performing maintenance. Please try again later',
};

// Recovery suggestions for different error types
const RECOVERY_SUGGESTIONS: Record<ErrorType, string[]> = {
  [ErrorType.UNAUTHORIZED]: [
    'Sign in to your account',
    'Check if you have an account',
  ],
  [ErrorType.FORBIDDEN]: [
    'Contact administrator for access',
    'Check your account permissions',
  ],
  [ErrorType.INVALID_TOKEN]: [
    'Sign out and sign in again',
    'Clear your browser cookies',
  ],
  [ErrorType.EXPIRED_TOKEN]: [
    'Sign in again to refresh your session',
  ],
  [ErrorType.SESSION_EXPIRED]: [
    'Sign in again to refresh your session',
  ],
  [ErrorType.EMAIL_NOT_VERIFIED]: [
    'Check your email for verification link',
    'Request a new verification email',
  ],
  [ErrorType.ACCOUNT_LOCKED]: [
    'Contact customer support',
    'Wait for account review',
  ],
  [ErrorType.VALIDATION_ERROR]: [
    'Review the highlighted fields',
    'Check for typos or missing information',
  ],
  [ErrorType.INVALID_INPUT]: [
    'Check your input for errors',
    'Follow the format requirements',
  ],
  [ErrorType.MISSING_REQUIRED_FIELD]: [
    'Complete all required fields',
    'Review the form for highlighted items',
  ],
  [ErrorType.INVALID_FORMAT]: [
    'Check the format requirements',
    'Use the correct date, email, or number format',
  ],
  [ErrorType.DATABASE_ERROR]: [
    'Try again in a few moments',
    'Check your internet connection',
  ],
  [ErrorType.RECORD_NOT_FOUND]: [
    'Refresh the page and try again',
    'Go back and select a different item',
  ],
  [ErrorType.DUPLICATE_RECORD]: [
    'Use a different value',
    'Check if this already exists',
  ],
  [ErrorType.CONSTRAINT_VIOLATION]: [
    'Check for conflicting data',
    'Review related records',
  ],
  [ErrorType.RATE_LIMITED]: [
    'Wait a few minutes before trying again',
    'Reduce the number of requests',
  ],
  [ErrorType.TOO_MANY_REQUESTS]: [
    'Please wait before trying again',
    'Contact support if issue persists',
  ],
  [ErrorType.OUT_OF_STOCK]: [
    'Check back later for availability',
    'Browse similar products',
    'Set up a stock notification',
  ],
  [ErrorType.PAYMENT_FAILED]: [
    'Check your payment method details',
    'Try a different payment method',
    'Contact your bank',
  ],
  [ErrorType.ORDER_NOT_FOUND]: [
    'Check your order history',
    'Verify the order number',
  ],
  [ErrorType.ORDER_CANNOT_CANCEL]: [
    'Check the order status',
    'Contact customer support',
  ],
  [ErrorType.ORDER_CANNOT_REFUND]: [
    'Review the refund policy',
    'Contact customer support',
  ],
  [ErrorType.INVALID_ORDER_STATUS]: [
    'Check the current order status',
    'Contact customer support',
  ],
  [ErrorType.CART_ITEM_NOT_FOUND]: [
    'Refresh the cart',
    'Add the item again',
  ],
  [ErrorType.WISHLIST_ITEM_EXISTS]: [
    'The item is already in your wishlist',
  ],
  [ErrorType.WISHLIST_ITEM_NOT_FOUND]: [
    'Refresh the wishlist',
    'Add the item again',
  ],
  [ErrorType.FILE_TOO_LARGE]: [
    'Compress the file',
    'Use a smaller file',
  ],
  [ErrorType.INVALID_FILE_TYPE]: [
    'Check allowed file types',
    'Convert to the correct format',
  ],
  [ErrorType.UPLOAD_FAILED]: [
    'Try uploading again',
    'Check your internet connection',
  ],
  [ErrorType.PRODUCT_NOT_AVAILABLE]: [
    'Check back later',
    'Browse similar products',
  ],
  [ErrorType.INSUFFICIENT_STOCK]: [
    'Reduce the quantity',
    'Check back later for more stock',
  ],
  [ErrorType.SERVICE_UNAVAILABLE]: [
    'Try again in a few minutes',
    'Check status page for updates',
  ],
  [ErrorType.MAINTENANCE_MODE]: [
    'Check back soon',
    'Follow our social media for updates',
  ],
  [ErrorType.NETWORK_ERROR]: [
    'Check your internet connection',
    'Try again when connection is stable',
    'Refresh the page',
  ],
  [ErrorType.SERVER_ERROR]: [
    'Try again in a few moments',
    'Refresh the page',
    'Contact support if the problem persists',
  ],
};

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public code: ErrorCode,
    message?: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message || ERROR_MESSAGES[type]);
    this.name = 'AppError';
  }
}

/**
 * Format error response with user-friendly message
 */
export function formatErrorResponse(
  type: ErrorType,
  code: ErrorCode,
  statusCode: number = 400,
  details?: Record<string, any>,
  messageOverride?: string
) {
  const message = messageOverride || ERROR_MESSAGES[type];
  const suggestions = RECOVERY_SUGGESTIONS[type];

  return {
    success: false,
    error: message,
    errorCode: code,
    errorType: type,
    suggestions: suggestions || [],
    details: details || {},
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(
  type: ErrorType,
  code: ErrorCode,
  statusCode: number = 400,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    formatErrorResponse(type, code, statusCode, details),
    { status: statusCode }
  );
}

/**
 * Handle common error scenarios with specific responses
 */
export function handleCommonErrors(error: any): {
  shouldHandle: boolean;
  response?: NextResponse;
} {
  // Prisma errors
  if (error?.code) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return {
          shouldHandle: true,
          response: createErrorResponse(
            ErrorType.DUPLICATE_RECORD,
            ErrorCode.DUPLICATE_RECORD,
            409,
            { field: error.meta?.target }
          ),
        };
      case 'P2025':
        // Record not found
        return {
          shouldHandle: true,
          response: createErrorResponse(
            ErrorType.RECORD_NOT_FOUND,
            ErrorCode.RECORD_NOT_FOUND,
            404
          ),
        };
      case 'P2003':
        // Foreign key constraint failed
        return {
          shouldHandle: true,
          response: createErrorResponse(
            ErrorType.CONSTRAINT_VIOLATION,
            ErrorCode.CONSTRAINT_VIOLATION,
            400,
            { field: error.meta?.field_name }
          ),
        };
    }
  }

  // Network errors
  if (error?.name === 'NetworkError' || error?.code === 'ENOTFOUND') {
    return {
      shouldHandle: true,
      response: createErrorResponse(
        ErrorType.NETWORK_ERROR,
        ErrorCode.NETWORK_ERROR_CODE,
        503
      ),
    };
  }

  return { shouldHandle: false };
}

/**
 * Wrap async handlers with error handling
 */
export function withErrorHandler(
  handler: (request: Request, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: Request, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);

      // Handle known error types
      if (error instanceof AppError) {
        return createErrorResponse(error.type, error.code, error.statusCode, error.details);
      }

      // Handle common errors
      const handled = handleCommonErrors(error);
      if (handled.shouldHandle && handled.response) {
        return handled.response;
      }

      // Handle validation errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        const zodError = error as any;
        return NextResponse.json(
          {
            success: false,
            error: 'Please check your input and try again',
            validationErrors: zodError.issues?.map((issue: any) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      // Unknown error
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES[ErrorType.SERVER_ERROR],
          errorCode: ErrorCode.INTERNAL_ERROR,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper functions for common error scenarios
 */

// Authentication errors
export function unauthorizedError(message?: string): AppError {
  return new AppError(ErrorType.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, message, 401);
}

export function forbiddenError(message?: string): AppError {
  return new AppError(ErrorType.FORBIDDEN, ErrorCode.INTERNAL_ERROR, message, 403);
}

export function sessionExpiredError(message?: string): AppError {
  return new AppError(ErrorType.SESSION_EXPIRED, ErrorCode.SESSION_EXPIRED_CODE, message, 401);
}

// Validation errors
export function validationError(message?: string, field?: string): AppError {
  return new AppError(
    ErrorType.VALIDATION_ERROR,
    ErrorCode.INVALID_EMAIL,
    message,
    400,
    { field }
  );
}

// Database errors
export function notFoundError(resource: string = 'Resource'): AppError {
  return new AppError(
    ErrorType.RECORD_NOT_FOUND,
    ErrorCode.RECORD_NOT_FOUND,
    `${resource} not found`,
    404
  );
}

export function duplicateError(field: string): AppError {
  return new AppError(
    ErrorType.DUPLICATE_RECORD,
    ErrorCode.DUPLICATE_RECORD,
    ERROR_MESSAGES[ErrorType.DUPLICATE_RECORD],
    409,
    { field }
  );
}

// Product errors
export function productNotFoundError(): AppError {
  return new AppError(
    ErrorType.RECORD_NOT_FOUND,
    ErrorCode.PRODUCT_NOT_FOUND_CODE,
    'Product not found',
    404
  );
}

export function outOfStockError(quantity?: number): AppError {
  return new AppError(
    ErrorType.OUT_OF_STOCK,
    ErrorCode.PRODUCT_OUT_OF_STOCK_CODE,
    quantity
      ? ERROR_MESSAGES[ErrorType.INSUFFICIENT_STOCK].replace('{quantity}', quantity.toString())
      : ERROR_MESSAGES[ErrorType.OUT_OF_STOCK],
    400,
    { availableQuantity: quantity }
  );
}

// Cart errors
export function cartItemNotFoundError(): AppError {
  return new AppError(
    ErrorType.CART_ITEM_NOT_FOUND,
    ErrorCode.CART_ITEM_NOT_FOUND_CODE,
    ERROR_MESSAGES[ErrorType.CART_ITEM_NOT_FOUND],
    404
  );
}

// Order errors
export function orderNotFoundError(): AppError {
  return new AppError(
    ErrorType.ORDER_NOT_FOUND,
    ErrorCode.ORDER_NOT_FOUND_CODE,
    ERROR_MESSAGES[ErrorType.ORDER_NOT_FOUND],
    404
  );
}

export function orderCannotCancelError(): AppError {
  return new AppError(
    ErrorType.ORDER_CANNOT_CANCEL,
    ErrorCode.ORDER_INVALID_STATUS,
    ERROR_MESSAGES[ErrorType.ORDER_CANNOT_CANCEL],
    400
  );
}

// Server errors
export function serverError(message?: string): AppError {
  return new AppError(
    ErrorType.SERVER_ERROR,
    ErrorCode.INTERNAL_ERROR,
    message,
    500
  );
}

// Named export for convenience
export const errorHandler = {
  ErrorType,
  ErrorCode,
  AppError,
  formatErrorResponse,
  createErrorResponse,
  handleCommonErrors,
  withErrorHandler,
  // Helper functions
  unauthorizedError,
  forbiddenError,
  sessionExpiredError,
  validationError,
  notFoundError,
  duplicateError,
  productNotFoundError,
  outOfStockError,
  cartItemNotFoundError,
  orderNotFoundError,
  orderCannotCancelError,
  serverError,
};
