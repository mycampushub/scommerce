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

// Database context type
export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket; // Cloudflare R2 for file storage
  KV?: KVNamespace; // Cloudflare KV for rate limiting and caching
}

export interface D1Database {
  prepare: (sql: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => D1Result[];
  exec: (sql: string) => void;
}

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: () => Record<string, unknown> | null;
  all: () => Record<string, unknown>[];
  run: () => D1Result;
}

export interface D1Result {
  meta: {
    duration: number;
    last_row_id: number | null;
    rows_read: number;
    rows_written: number;
    changed_db: boolean;
    size_after: number;
  };
  success: boolean;
}

export interface R2Bucket {
  put: (key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions) => Promise<R2Object>;
  get: (key: string) => Promise<R2Object | null>;
  delete: (key: string) => Promise<void>;
  list: (options?: R2ListOptions) => Promise<R2Objects>;
}

export interface R2PutOptions {
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2Object {
  key: string;
  size: number;
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
  write?: (options: { signal: AbortSignal }) => Promise<Response>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
}

export interface KVNamespace {
  get: (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => Promise<string | null | Record<string, unknown> | ArrayBuffer | ReadableStream | null>;
  put: (key: string, value: string, options?: KVNamespacePutOptions) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface KVNamespacePutOptions {
  expirationTtl?: number;
  expiration?: Date | number;
}
