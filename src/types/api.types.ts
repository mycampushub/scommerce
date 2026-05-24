/**
 * Shared API Types
 * Centralized type definitions for API responses and requests
 */

// Generic API Response Types
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: Record<string, unknown>
  statusCode?: number
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// API Error Types
export interface ApiError extends Error {
  statusCode?: number
  details?: Record<string, unknown>
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    'statusCode' in error
  )
}

export function isApiSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

// Common Request Types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  category?: string
  brand?: string
  priceRange?: [number, number]
  inStock?: boolean
  [key: string]: string | boolean | [number, number] | undefined
}

// Product Types
export interface ProductImage {
  url: string
  alt?: string
  isPrimary?: boolean
}

export interface ProductAttributes {
  material?: string | null
  color?: string | null
  size?: string | null
  sizeType?: 'unit' | 'label' | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
}

export interface ProductMetadata {
  brandId?: string | null
  brandName?: string | null
  brandLogo?: string | null
  countryOfOrigin?: string | null
}

// Variant Types
export interface VariantAttributes {
  size?: string | null
  color?: string | null
  material?: string | null
}

export interface VariantStockInfo {
  stock: number
  lowStockAlert: number
  reorderLevel: number
  reorderQty: number
}

// Order Types
export interface Address {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderItem {
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  image: string
  variantSku?: string
  variantDetails?: {
    size?: string
    color?: string
    material?: string
  }
}

// Inventory Types
export interface InventoryMovement {
  id: string
  productId: string
  variantId?: string | null
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return'
  quantity: number
  previousStock: number
  newStock: number
  reason?: string | null
  referenceId?: string | null
  createdAt: string
}

export interface InventoryAlert {
  id: string
  productId: string | null
  variantId: string | null
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_NEEDED'
  quantity: number
  isRead: boolean
  isResolved: boolean
  createdAt: string
}
