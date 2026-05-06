export type UserRole = 'user' | 'admin' | 'staff';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type TrackingStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_NEEDED';

export type DiscountType = 'percentage' | 'fixed';

// ============================================================================
// PRODUCT PRICING TYPES DOCUMENTATION
// ============================================================================
// Products and variants use multiple price fields for different purposes:
//
// basePrice (number): The original/reference price before any discounts.
//   - Baseline for internal calculations and profit margins
//   - Should not change unless base cost changes
//
// price (number): The current selling price displayed to customers.
//   - This is the price shown in the storefront UI
//   - Formula: price = basePrice - discount
//   - Updated when discounts are applied or removed
//
// comparePrice (number | null): Optional "original price" for marketing displays.
//   - Shows crossed-out original price during sales
//   - Used to create "save X%" messaging for customers
//   - Example: Compare Price: ৳1000, Current Price: ৳750 (You save 25%)
//
// discount (number | null): Discount amount to subtract from basePrice.
//   - Works with discountType to calculate final price
//   - If discountType is "percentage": discount is percent (e.g., 25 for 25%)
//   - If discountType is "fixed": discount is absolute amount (e.g., 100 for ৳100 off)
//
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  password: string | null;
  emailVerified: number;
  emailToken: string | null;
  newEmail: string | null;
  resetToken: string | null;
  resetTokenExpiry: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string | null;
  division: string;
  postalCode: string | null;
  isDefault: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  price: number;
  basePrice: number;
  comparePrice: number | null;
  discount: number | null;
  discountType: DiscountType | null;
  images: string | null;
  stock: number;
  lowStockAlert: number;
  reorderLevel: number;
  reorderQty: number;
  isActive: number;
  isFeatured: number;
  hasVariants: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  images: string | null;
  size: string | null;
  color: string | null;
  material: string | null;
  isActive: number;
  isDefault: number;
  lowStockAlert: number;
  reorderLevel: number;
  reorderQty: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: number;
  isApproved: number;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string;
  billingAddress: string | null;
  city: string | null;
  district: string | null;
  division: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  trackingNumber: string | null;
  trackingStatus: TrackingStatus;
  estimatedDeliveryDate: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  refundedAt: string | null;
  refundedAmount: number | null;
  refundMethod: string | null;
  refundReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  productName: string;
  productImage: string | null;
  variantSku: string | null;
  variantSize: string | null;
  variantColor: string | null;
  variantMaterial: string | null;
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  adminId: string;
  details: string | null;
  createdAt: string;
}

export interface InventoryAlert {
  id: string;
  variantId: string | null;
  productId: string | null;
  alertType: AlertType;
  quantity: number;
  isRead: number;
  isResolved: number;
  resolvedAt: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string | null;
  published: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string | null;
  image: string;
  mobileImage: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: number;
  orderNum: number;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  thumbnail: string;
  images: string;
  isActive: number;
  orderNum: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reel {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  productIds: string | null;
  isActive: number;
  orderNum: number;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image: string;
  ctaText: string | null;
  ctaLink: string | null;
  type: string | null;
  isActive: number;
  orderNum: number;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageSettings {
  id: string;
  sectionName: string;
  isEnabled: number;
  autoPlay: number;
  displayLimit: number | null;
  settings: string | null;
  updatedAt: string;
}

/**
 * Cloudflare D1 Result type
 * Used for batch/transaction operations
 */
export interface D1Result {
  success: boolean;
  meta: {
    duration: number;
    last_row_id: number | null;
    rows_read: number;
    rows_written: number;
    changes: number;
    served_by: string;
  };
}

// Database context type - use Cloudflare types from worker-configuration.d.ts
export interface Env {
  DB?: any;
  BUCKET?: any;
  KV?: any;
}
