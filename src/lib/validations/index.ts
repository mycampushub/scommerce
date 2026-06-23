import { z } from 'zod';

// Password complexity validation
const passwordComplexity = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// User & Authentication Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: passwordComplexity,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Product Schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(), // Optional - will be auto-generated from name if not provided
  description: z.string().optional().nullable(), // Optional description
  basePrice: z.number().positive('Price must be positive').or(z.string().transform(val => parseFloat(val)).refine(val => val > 0, 'Price must be positive')),
  comparePrice: z.union([z.literal(null), z.number().positive('Compare price must be positive'), z.number().nonnegative()]).optional().nullable(),
  costPrice: z.union([z.literal(null), z.number().min(0, 'Cost price must be non-negative'), z.number().nonnegative()]).optional().nullable(),
  categoryId: z.string().min(1, 'Category ID is required'), // Required - must be non-empty string
  images: z.union([z.array(z.string()), z.literal(null)]).optional(), // Made nullable - products can be created without images initially
  stock: z.number().int().min(0, 'Stock must be a non-negative integer').or(z.string().transform(val => parseInt(val))),
  lowStockAlert: z.number().int().min(0).optional().nullable(),
  reorderLevel: z.number().int().min(0).optional().nullable(),
  reorderQty: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  hasVariants: z.boolean().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  // Brand fields
  brandId: z.union([z.literal(null), z.string()]).optional().nullable(),
  brandName: z.union([z.literal(null), z.string()]).optional().nullable(),
  brandLogo: z.union([z.literal(null), z.string()]).optional().nullable(),
  // Size system fields
  sizeType: z.enum(['unit', 'label']).nullable().optional(),
  sizeValue: z.union([z.literal(null), z.number()]).optional().nullable(),
  sizeUnit: z.union([z.literal(null), z.string()]).optional().nullable(),
  sizeLabel: z.union([z.literal(null), z.string()]).optional().nullable(),
  // Material and color for single products
  material: z.union([z.literal(null), z.string()]).optional().nullable(),
  color: z.union([z.literal(null), z.string()]).optional().nullable(),
  // Country of origin
  countryOfOrigin: z.union([z.literal(null), z.string()]).optional().nullable(),
  // Multi-select variant system
  availableSizes: z.union([z.array(z.string()), z.literal(null)]).optional().nullable(),
  availableColors: z.union([z.array(z.string()), z.literal(null)]).optional().nullable(),
});

export const updateProductSchema = productSchema.partial();

// Category Schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = categorySchema.partial();

// Order Schemas
export const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  district: z.string().optional(),
  division: z.string().min(1, 'Division is required'),
  postalCode: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

// Address can be either an object or a string (for backward compatibility)
// Support two address formats:
// 1. Standard format with fullName, addressLine1, etc.
// 2. Checkout format with address, city, postalCode, etc.
export const addressSchemaFlexible = z.union([
  addressSchema,
  z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().trim().optional(),
    division: z.string().min(1, 'Please select a division'),
    postalCode: z.string().optional(),
    country: z.string().trim().optional(),
  }),
]);

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
  price: z.number().positive('Price must be positive'),
  productName: z.string().min(1, 'Product name is required'),
  productImage: z.string().optional(), // Made optional to handle missing images
  variantId: z.string().optional(),
  variantSku: z.string().optional(),
  variantSize: z.string().optional(),
  variantColor: z.string().optional(),
  variantMaterial: z.string().optional(),
});

export const createOrderSchema = z.object({
  userId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 digits').nullable().optional(),
  shippingAddress: addressSchemaFlexible,
  billingAddress: addressSchemaFlexible.optional(),
  orderItems: z.array(orderItemSchema)
    .min(1, 'At least one order item is required')
    .refine((items) => items.reduce((sum, item) => sum + item.quantity, 0) <= 500, {
      message: 'Total order quantity cannot exceed 500 items',
      path: ['orderItems'],
    }),
  subtotal: z.number().positive('Subtotal must be positive'),
  shipping: z.number().min(0, 'Shipping must be non-negative'),
  tax: z.number().min(0, 'Tax must be non-negative'),
  discount: z.number().min(0, 'Discount must be non-negative').optional(),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'ONLINE_PAYMENT', 'CARD', 'UPI', 'BANK_TRANSFER']),
  promoCode: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
});

// Tracking Number Schema
export const updateTrackingSchema = z.object({
  trackingNumber: z.string()
    .min(5, 'Tracking number must be at least 5 characters')
    .max(50, 'Tracking number must be less than 50 characters')
    .regex(/^[A-Za-z0-9\s-]+$/, 'Tracking number can only contain letters, numbers, spaces, and hyphens')
    .trim(),
  trackingStatus: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']),
});

// Cart Schemas
export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
  size: z.string().optional(),
  color: z.string().optional(),
});

export const updateCartItemSchema = cartItemSchema.partial();

// Search & Filter Schemas
export const searchProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  type: z.enum(['featured', 'new', 'sale', 'trending']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(200).optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'stock']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Admin Schemas
export const adminLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entity: z.string().min(1, 'Entity is required'),
  entityId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// Brand Schema
export const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  slug: z.string().min(1, 'Slug is required'),
  logo: z.string().nullable().optional(),
  website: z.string().nullable().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, 'Please enter a valid URL (e.g., "https://example.com")'),
  description: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateBrandSchema = brandSchema.partial();

// Helper to validate URLs that can be absolute or relative (starting with /)
const urlOrRelativeSchema = z.string().refine((val) => {
  if (!val || typeof val !== 'string') return false;
  // Allow relative URLs starting with /
  if (val.startsWith('/')) return true;
  // Validate absolute URLs
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
}, 'Must be a valid URL or start with /');

// Helper to validate URLs that can be absolute, relative, or empty string
const urlOrRelativeOrEmptySchema = z.union([
  urlOrRelativeSchema,
  z.literal(''),
  z.literal(null).transform(() => ''),
]);

// Homepage Schemas
export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image: urlOrRelativeSchema,
  mobileImage: urlOrRelativeOrEmptySchema,
  buttonText: z.string().optional(),
  buttonLink: urlOrRelativeOrEmptySchema,
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional(),
});

export const storySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  thumbnail: urlOrRelativeSchema,
  images: z.array(urlOrRelativeSchema).min(1, 'At least one image is required'),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional(),
});

export const reelSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  thumbnail: urlOrRelativeOrEmptySchema.optional(),
  videoUrl: z.string().min(1, 'Video URL is required'),
  productIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional(),
});

// Settings Schemas
export const settingsSchema = z.object({
  siteName: z.string().optional(),
  siteLogo: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  currency: z.string().min(1).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  socialMedia: z.record(z.string(), z.string()).optional(),
})

// Promotion Schemas
export const promotionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image: z.string().nullable().optional(), // Made optional - not all promotions need images
  type: z.string().optional().default('banner'),
  promoCode: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  discountValue: z.number().min(0, 'Discount value must be non-negative').optional().default(0),
  minOrderAmount: z.number().min(0, 'Minimum order amount must be non-negative').optional(),
  maxDiscountAmount: z.number().min(0, 'Maximum discount amount must be non-negative').optional(),
  discountRules: z.record(z.string(), z.unknown()).optional(),
  applicableProducts: z.array(z.string()).optional().default([]),
  applicableCategories: z.array(z.string()).optional().default([]),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  ctaText: z.string().nullable().optional(),
  ctaLink: z.string().nullable().optional(),
  usageLimit: z.number().int().min(0, 'Usage limit must be non-negative').optional(),
  userLimit: z.number().int().min(0, 'User limit must be non-negative').optional(),
  conditions: z.string().nullable().optional(), // Changed to string to match frontend input
  isActive: z.boolean().optional(),
})

export const updatePromotionSchema = promotionSchema.partial();

// Review Schemas
export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(1, 'Review title is required'),
  content: z.string().min(10, 'Review content must be at least 10 characters'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

// Contact Form Schema
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Password Reset Schemas
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordComplexity,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Account Settings Schemas
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordComplexity,
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const changeEmailSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  newEmail: z.string().email('Invalid email address'),
  confirmEmail: z.string().email('Invalid email address'),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ['confirmEmail'],
});

// Order Cancellation & Refund Schemas
export const cancelOrderSchema = z.object({
  userId: z.string().optional(),
  cancelledBy: z.enum(['user', 'admin']).default('user'),
  reason: z.string().min(5, 'Cancellation reason must be at least 5 characters').optional(),
});

export const requestRefundSchema = z.object({
  userId: z.string().optional(),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters'),
  refundMethod: z.string().min(1, 'Refund method is required'),
  initiatedBy: z.enum(['user', 'admin']).default('user'),
});

// Purchase Order Schemas
export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  expectedDate: z.string().min(1, 'Expected date is required'),
  notes: z.string().optional(),
  status: z.enum(['pending', 'ordered', 'received', 'cancelled']).optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    unitCost: z.number().positive('Unit cost must be a positive number'),
  })).min(1, 'At least one item is required'),
});

// Export all schemas
export const schemas = {
  register: registerSchema,
  login: loginSchema,
  product: productSchema,
  updateProduct: updateProductSchema,
  category: categorySchema,
  updateCategory: updateCategorySchema,
  brand: brandSchema,
  updateBrand: updateBrandSchema,
  address: addressSchema,
  orderItem: orderItemSchema,
  createOrder: createOrderSchema,
  updateOrderStatus: updateOrderStatusSchema,
  updateTracking: updateTrackingSchema,
  cartItem: cartItemSchema,
  updateCartItem: updateCartItemSchema,
  searchProducts: searchProductsSchema,
  adminLog: adminLogSchema,
  banner: bannerSchema,
  story: storySchema,
  reel: reelSchema,
  promotion: promotionSchema,
  updatePromotion: updatePromotionSchema,
  settings: settingsSchema,
  review: reviewSchema,
  contactForm: contactFormSchema,
};
