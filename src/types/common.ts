/**
 * Common TypeScript Interfaces
 *
 * This file contains shared type definitions used across the application
 * to reduce reliance on 'any' types and improve type safety.
 */

// ============== API Response Types ==============

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============== User Types ==============

export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  phone?: string
  role: 'customer' | 'admin' | 'staff'
  isActive: boolean
  emailVerified?: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin' | 'staff'
}

// ============== Product Types ==============

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  basePrice: number
  comparePrice: number | null
  costPrice?: number | null
  images: string[]
  stock: number
  categoryId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  sku?: string | null
  size?: string | null
  color?: string | null
  material?: string | null
  price?: number | null
  stock: number
  images?: string[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  originalPrice?: number | null
  image: string
  quantity: number
  variantId?: string
  variantSku?: string
  size?: string | null
  color?: string | null
  material?: string | null
}

// ============== Order Types ==============

export interface Order {
  id: string
  orderNumber: string
  userId?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: Address
  billingAddress: Address
  paymentMethod: 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT' | 'BANK_TRANSFER'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  productImage: string
  variantId?: string | null
  variantSku?: string | null
  variantSize?: string | null
  variantColor?: string | null
  variantMaterial?: string | null
  price: number
  quantity: number
  total: number
}

// ============== Address Types ==============

export interface Address {
  address: string
  city: string
  district: string
  division: string
  zipCode: string
  country: string
}

// ============== Category Types ==============

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  parentId?: string | null
  isActive: boolean
  sortOrder?: number | null
  createdAt: string
  updatedAt: string
}

// ============== Inventory Types ==============

export interface InventoryAlert {
  id: string
  productId: string
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_NEEDED'
  quantity: number
  threshold?: number | null
  isRead: boolean
  isResolved: boolean
  resolvedAt?: string | null
  resolvedBy?: string | null
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

// ============== Settings Types ==============

export interface SiteSettings {
  id: string
  storeName: string
  storeDescription?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  currency: string
  taxRate: number
  freeShippingThreshold: number
  socialLinks?: Record<string, string> | null
  logo?: string | null
  favicon?: string | null
  createdAt: string
  updatedAt: string
}

// ============== Review Types ==============

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title?: string | null
  comment?: string | null
  isVerified: boolean
  isVisible: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

// ============== Promotion Types ==============

export interface Promotion {
  id: string
  code: string
  name: string
  description?: string | null
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'
  value: number
  minPurchase?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  usageCount: number
  startDate: string
  endDate: string
  isActive: boolean
  applicableProducts?: string[] | null
  applicableCategories?: string[] | null
  createdAt: string
  updatedAt: string
}

// ============== Banner Types ==============

export interface Banner {
  id: string
  title: string
  subtitle?: string | null
  imageUrl: string
  linkUrl?: string | null
  buttonText?: string | null
  position: 'HOME_HERO' | 'HOME_BELOW_HERO' | 'SIDEBAR' | 'FOOTER'
  sortOrder: number
  isActive: boolean
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  updatedAt: string
}

// ============== Audit Log Types ==============

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

// ============== Shipping Types ==============

export interface ShippingRate {
  id: string
  name: string
  divisions: string[]
  baseRate: number
  perKgRate: number
  freeThreshold?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============== Request Body Types ==============

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface AddressFormData {
  firstName: string
  lastName: string
  address: string
  city: string
  district: string
  division: string
  zipCode: string
  country?: string
  isDefault?: boolean
}

// ============== Utility Types ==============

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
