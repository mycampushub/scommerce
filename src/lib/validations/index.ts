import { z } from 'zod';

// User & Authentication Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Product Schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(), // Optional - will be auto-generated from name if not provided
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  categoryId: z.string().min(1, 'Category ID is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  lowStockAlert: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const updateProductSchema = productSchema.partial();

// Category Schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = categorySchema.partial();

// Order Schemas
export const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  district: z.string().optional(),
  division: z.string().optional(),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

// Address can be either an object or a string (for backward compatibility)
// Support two address formats:
// 1. Standard format with fullName, addressLine1, etc.
// 2. Checkout format with address, city, zipCode, etc.
export const addressSchemaFlexible = z.union([
  addressSchema,
  z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().optional(),
    division: z.string().min(1, 'Division is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().optional(),
  }),
]);

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
  price: z.number().positive('Price must be positive'),
  productName: z.string().min(1, 'Product name is required'),
  productImage: z.string().min(1, 'Product image is required'),
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
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  type: z.enum(['featured', 'new', 'sale', 'trending']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
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

// Homepage Schemas
export const bannerSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  imageDesktop: z.string(),
  imageMobile: z.string(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const storySchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  mediaUrls: z.array(z.string()),
  type: z.enum(['image', 'video']),
  productId: z.string().optional(),
  duration: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const reelSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  videoUrl: z.string(),
  productId: z.string().optional(),
  isActive: z.boolean().optional(),
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
  image: z.string().min(1, 'Image is required'),
  discountType: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  discountValue: z.number().min(0, 'Discount value must be non-negative').optional().default(0),
  discountRules: z.record(z.string(), z.unknown()).optional(),
  applicableProducts: z.array(z.string()).optional().default([]),
  applicableCategories: z.array(z.string()).optional().default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
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
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Account Settings Schemas
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
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

// Export all schemas
export const schemas = {
  register: registerSchema,
  login: loginSchema,
  product: productSchema,
  updateProduct: updateProductSchema,
  category: categorySchema,
  updateCategory: updateCategorySchema,
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
