export type UserRole = 'user' | 'admin' | 'staff' | 'vip';

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
  avatar: string | null;
  isBanned: number;
  bannedAt: string | null;
  lastLoginAt: string | null;
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

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
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
  costPrice: number | null;
  discount: number | null;
  discountType: DiscountType | null;
  images: string[] | null;
  stock: number;
  lowStockAlert: number;
  reorderLevel: number;
  reorderQty: number;
  isActive: number;
  isFeatured: number;
  hasVariants: number;
  weight: number | null;
  dimensions: string | null;
  tags: string | null;
  // Brand fields
  brandId: string | null;
  brandName: string | null;
  brandLogo: string | null;
  // Size system (two types: unit or label)
  sizeType: string | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  sizeLabel: string | null;
  // Material and color for single products
  material: string | null;
  color: string | null;
  // Country of origin
  countryOfOrigin: string | null;
  // Multi-size/color system
  availableSizes: string[] | null;
  availableColors: string[] | null;
  // Inventory tracking
  totalPurchased: number;
  totalSold: number;
  totalCost: number | null;
  averageCost: number | null;
  lastPurchaseAt: string | null;
  lastPurchaseCost: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColorImage {
  id: string;
  productId: string;
  color: string;
  images: string[] | null;
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
  costPrice: number | null;
  stock: number;
  images: string[] | null;
  size: string | null;
  color: string | null;
  material: string | null;
  isActive: number;
  isDefault: number;
  lowStockAlert: number;
  reorderLevel: number;
  reorderQty: number;
  // Size system (two types: unit or label)
  sizeType: string | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  sizeLabel: string | null;
  // Country of origin
  countryOfOrigin: string | null;
  // Inventory tracking
  totalPurchased: number;
  totalSold: number;
  totalCost: number | null;
  averageCost: number | null;
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
  deletedAt: string | null;
  deletedBy: string | null;
  deletedReason: string | null;
  promoCode: string | null;
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
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  thumbnail: string;
  images: string | string[];
  isActive: number;
  order: number;
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
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  type: string | null;
  promoCode: string | null;
  discountType: string | null;
  discountValue: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  usedCount: number | null;
  userLimit: number | null;
  applicableCategories: string[] | null;
  applicableProducts: string[] | null;
  conditions: string | null;
  discountRules: Record<string, unknown> | null;
  isActive: number;
  order: number | null;
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

// Database context type - use Cloudflare types from worker-configuration.d.ts
export interface Env {
  DB?: any;
  BUCKET?: any;
  KV?: any;
}
