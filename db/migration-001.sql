-- Migration: Add missing columns to existing tables
-- This handles tables that were created before new columns were added

-- Orders table: Add soft delete columns (may not exist on older schema)
ALTER TABLE orders ADD COLUMN deletedAt TEXT;
ALTER TABLE orders ADD COLUMN deletedBy TEXT;
ALTER TABLE orders ADD COLUMN deletedReason TEXT;

-- Orders table: Add cancellation/refund columns (may not exist on older schema)
ALTER TABLE orders ADD COLUMN cancelledAt TEXT;
ALTER TABLE orders ADD COLUMN cancelledBy TEXT;
ALTER TABLE orders ADD COLUMN cancellationReason TEXT;
ALTER TABLE orders ADD COLUMN refundedAt TEXT;
ALTER TABLE orders ADD COLUMN refundedAmount REAL;
ALTER TABLE orders ADD COLUMN refundMethod TEXT;
ALTER TABLE orders ADD COLUMN refundReason TEXT;

-- Orders table: Add tracking and delivery columns
ALTER TABLE orders ADD COLUMN trackingNumber TEXT;
ALTER TABLE orders ADD COLUMN trackingStatus TEXT DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN estimatedDeliveryDate TEXT;

-- Users table: Add missing columns
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN emailToken TEXT;
ALTER TABLE users ADD COLUMN newEmail TEXT;
ALTER TABLE users ADD COLUMN resetToken TEXT;
ALTER TABLE users ADD COLUMN resetTokenExpiry TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN isBanned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN bannedAt TEXT;
ALTER TABLE users ADD COLUMN lastLoginAt TEXT;

-- Addresses table: Add missing columns
ALTER TABLE addresses ADD COLUMN district TEXT;
ALTER TABLE addresses ADD COLUMN division TEXT;
ALTER TABLE addresses ADD COLUMN postalCode TEXT;

-- Products table: Add missing columns
ALTER TABLE products ADD COLUMN basePrice REAL DEFAULT 0;
ALTER TABLE products ADD COLUMN comparePrice REAL;
ALTER TABLE products ADD COLUMN discount REAL DEFAULT 0;
ALTER TABLE products ADD COLUMN discountType TEXT DEFAULT 'percentage';
ALTER TABLE products ADD COLUMN lowStockAlert INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN reorderLevel INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN reorderQty INTEGER DEFAULT 20;
ALTER TABLE products ADD COLUMN isFeatured INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN hasVariants INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN weight REAL;
ALTER TABLE products ADD COLUMN dimensions TEXT;

-- Product Variants: Add missing columns
ALTER TABLE product_variants ADD COLUMN comparePrice REAL;
ALTER TABLE product_variants ADD COLUMN lowStockAlert INTEGER DEFAULT 10;
ALTER TABLE product_variants ADD COLUMN reorderLevel INTEGER DEFAULT 5;
ALTER TABLE product_variants ADD COLUMN reorderQty INTEGER DEFAULT 20;
ALTER TABLE product_variants ADD COLUMN isDefault INTEGER DEFAULT 0;

-- Product Reviews: Add missing columns
ALTER TABLE product_reviews ADD COLUMN userName TEXT;
ALTER TABLE product_reviews ADD COLUMN title TEXT;
ALTER TABLE product_reviews ADD COLUMN isVerified INTEGER DEFAULT 0;

-- Cart Items: Add missing columns
ALTER TABLE cart_items ADD COLUMN variantId TEXT;
ALTER TABLE cart_items ADD COLUMN updatedAt TEXT DEFAULT (datetime('now'));

-- Inventory Alerts: Add missing columns
ALTER TABLE inventory_alerts ADD COLUMN isRead INTEGER DEFAULT 0;
ALTER TABLE inventory_alerts ADD COLUMN isResolved INTEGER DEFAULT 0;
ALTER TABLE inventory_alerts ADD COLUMN resolvedAt TEXT;

-- Posts: Add missing columns
ALTER TABLE posts ADD COLUMN content TEXT;
ALTER TABLE posts ADD COLUMN published INTEGER DEFAULT 0;

-- Stories: Add missing columns
ALTER TABLE stories ADD COLUMN "order" INTEGER DEFAULT 0;

-- Reels: Add missing columns
ALTER TABLE reels ADD COLUMN "order" INTEGER DEFAULT 0;
ALTER TABLE reels ADD COLUMN productIds TEXT;

-- Banners: Add missing columns
ALTER TABLE banners ADD COLUMN mobileImage TEXT;
ALTER TABLE banners ADD COLUMN buttonText TEXT;
ALTER TABLE banners ADD COLUMN buttonLink TEXT;
ALTER TABLE banners ADD COLUMN "order" INTEGER DEFAULT 0;

-- Promotions: Add missing columns
ALTER TABLE promotions ADD COLUMN description TEXT;
ALTER TABLE promotions ADD COLUMN ctaText TEXT;
ALTER TABLE promotions ADD COLUMN ctaLink TEXT;
ALTER TABLE promotions ADD COLUMN "order" INTEGER DEFAULT 0;

-- Admin Logs: Add missing columns
ALTER TABLE admin_logs ADD COLUMN ipAddress TEXT;
ALTER TABLE admin_logs ADD COLUMN userAgent TEXT;
