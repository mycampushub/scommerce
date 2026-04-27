/**
 * Input sanitization utilities
 * Protects against XSS attacks by sanitizing user input
 */

import * as DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Untrusted HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  dirty: string,
  options?: DOMPurify.Config
): string {
  // Default configuration for stricter sanitization
  const defaultOptions: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'id', 'style',
      'data-*', 'aria-*'
    ],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    ...options,
  };

  // Handle empty or non-string input
  if (typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, defaultOptions);
}

/**
 * Strip all HTML tags, return plain text
 * @param dirty - String potentially containing HTML
 * @returns Plain text without HTML tags
 */
export function stripHTML(dirty: string): string {
  if (typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No tags allowed
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitize user input for use in database queries
 * Removes HTML tags and escapes special characters
 * @param input - User input string
 * @returns Sanitized string safe for database
 */
export function sanitizeForDB(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Strip HTML and normalize whitespace
  return stripHTML(input).trim();
}

/**
 * Sanitize URL parameter
 * @param url - URL string to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    // Parse URL to validate structure
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize email address
 * @param email - Email string to validate
 * @returns Lowercase, trimmed email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();

  return emailRegex.test(trimmed) ? trimmed : '';
}

/**
 * Sanitize phone number
 * @param phone - Phone number string
 * @returns Sanitized phone number with only digits
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

/**
 * Sanitize numeric input
 * @param value - Value to convert to number
 * @param defaultValue - Default value if conversion fails
 * @returns Validated number or default
 */
export function sanitizeNumber(
  value: unknown,
  defaultValue: number = 0
): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Sanitize integer input
 * @param value - Value to convert to integer
 * @param defaultValue - Default value if conversion fails
 * @returns Validated integer or default
 */
export function sanitizeInt(
  value: unknown,
  defaultValue: number = 0
): number {
  return Math.floor(sanitizeNumber(value, defaultValue));
}

/**
 * Sanitize boolean input
 * @param value - Value to convert to boolean
 * @param defaultValue - Default value if conversion fails
 * @returns Boolean value
 */
export function sanitizeBoolean(
  value: unknown,
  defaultValue: boolean = false
): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
}

/**
 * Sanitize array input
 * @param value - Value to validate as array
 * @param itemType - Expected type of array items
 * @returns Validated array or empty array
 */
export function sanitizeArray<T>(
  value: unknown,
  itemType?: 'string' | 'number' | 'boolean'
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // Filter and transform items based on expected type
  if (itemType === 'string') {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim()) as T[];
  }

  if (itemType === 'number') {
    return value
      .filter((item): item is number => typeof item === 'number' && !isNaN(item)) as T[];
  }

  if (itemType === 'boolean') {
    return value
      .filter((item): item is boolean => typeof item === 'boolean') as T[];
  }

  return value as T[];
}

/**
 * Sanitize object input
 * Removes null/undefined values and optionally validates keys
 * @param obj - Object to sanitize
 * @param allowedKeys - List of allowed property keys
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: unknown,
  allowedKeys?: string[]
): Partial<T> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return {};
  }

  const sanitized: Partial<T> = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      return;
    }

    // Check if key is allowed if whitelist provided
    if (allowedKeys && !allowedKeys.includes(key)) {
      return;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeForDB(value) as T[keyof T];
      return;
    }

    // Keep other types as-is (but could add more validation)
    sanitized[key as keyof T] = value as T[keyof T];
  });

  return sanitized;
}

/**
 * Sanitize product data for database storage
 * @param productData - Raw product data
 * @returns Sanitized product data
 */
export function sanitizeProductData(productData: Record<string, unknown>) {
  return {
    name: sanitizeForDB(String(productData.name || '')),
    description: sanitizeHTML(String(productData.description || '')),
    price: sanitizeNumber(productData.price),
    originalPrice: sanitizeNumber(productData.originalPrice, null),
    stock: sanitizeInt(productData.stock, 0),
    sku: sanitizeForDB(String(productData.sku || '')),
    images: sanitizeArray<string>(productData.images, 'string'),
    categoryId: sanitizeInt(productData.categoryId),
    isActive: sanitizeBoolean(productData.isActive, true),
    weight: sanitizeNumber(productData.weight, 0),
    dimensions: sanitizeForDB(String(productData.dimensions || '')),
  };
}

/**
 * Sanitize user address data
 * @param addressData - Raw address data
 * @returns Sanitized address data
 */
export function sanitizeAddressData(addressData: Record<string, unknown>) {
  return {
    fullName: sanitizeForDB(String(addressData.fullName || '')),
    phone: sanitizePhone(String(addressData.phone || '')),
    addressLine: sanitizeForDB(String(addressData.addressLine || '')),
    city: sanitizeForDB(String(addressData.city || '')),
    state: sanitizeForDB(String(addressData.state || '')),
    postalCode: sanitizeForDB(String(addressData.postalCode || '')),
    country: sanitizeForDB(String(addressData.country || '')),
    isDefault: sanitizeBoolean(addressData.isDefault, false),
  };
}

/**
 * Sanitize review/rating data
 * @param reviewData - Raw review data
 * @returns Sanitized review data
 */
export function sanitizeReviewData(reviewData: Record<string, unknown>) {
  return {
    rating: sanitizeInt(reviewData.rating, 0),
    title: sanitizeForDB(String(reviewData.title || '')),
    comment: sanitizeHTML(String(reviewData.comment || '')),
  };
}

/**
 * Create a sanitizer middleware for API request bodies
 * @param schema - Schema definition with sanitization rules
 * @returns Sanitized data
 */
export function sanitizeRequestBody(
  data: Record<string, unknown>,
  schema: Record<string, (value: unknown) => unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  Object.entries(schema).forEach(([key, sanitizer]) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      sanitized[key] = sanitizer(value);
    }
  });

  return sanitized;
}

/**
 * Sanitize search query
 * Removes potentially dangerous characters
 * @param query - Search query string
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }

  // Remove SQL injection attempts and special chars
  return query
    .replace(/[;'"\\<>]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase()
    .substring(0, 200); // Limit length
}

/**
 * XSS-safe string for display in React
 * Converts newlines to <br> tags after sanitization
 * @param text - Text to sanitize and format
 * @returns Sanitized HTML with line breaks
 */
export function sanitizeTextWithLineBreaks(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  const sanitized = stripHTML(text);
  return sanitized.replace(/\n/g, '<br>');
}
