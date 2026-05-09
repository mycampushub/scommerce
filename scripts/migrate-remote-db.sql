-- Add missing columns to orders table (most likely missing)
ALTER TABLE orders ADD COLUMN deletedAt TEXT;
ALTER TABLE orders ADD COLUMN deletedBy TEXT;
ALTER TABLE orders ADD COLUMN deletedReason TEXT;
ALTER TABLE orders ADD COLUMN trackingNumber TEXT;
ALTER TABLE orders ADD COLUMN trackingStatus TEXT DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN estimatedDeliveryDate TEXT;
ALTER TABLE orders ADD COLUMN cancelledAt TEXT;
ALTER TABLE orders ADD COLUMN cancelledBy TEXT;
ALTER TABLE orders ADD COLUMN cancellationReason TEXT;
ALTER TABLE orders ADD COLUMN refundedAt TEXT;
ALTER TABLE orders ADD COLUMN refundedAmount REAL;
ALTER TABLE orders ADD COLUMN refundMethod TEXT;
ALTER TABLE orders ADD COLUMN refundReason TEXT;

-- Users
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

-- Addresses
ALTER TABLE addresses ADD COLUMN district TEXT;
ALTER TABLE addresses ADD COLUMN division TEXT;
ALTER TABLE addresses ADD COLUMN postalCode TEXT;

-- Products
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

-- Product Variants
ALTER TABLE product_variants ADD COLUMN comparePrice REAL;
ALTER TABLE product_variants ADD COLUMN lowStockAlert INTEGER DEFAULT 10;
ALTER TABLE product_variants ADD COLUMN reorderLevel INTEGER DEFAULT 5;
ALTER TABLE product_variants ADD COLUMN reorderQty INTEGER DEFAULT 20;
ALTER TABLE product_variants ADD COLUMN isDefault INTEGER DEFAULT 0;

-- Product Reviews
ALTER TABLE product_reviews ADD COLUMN userName TEXT;
ALTER TABLE product_reviews ADD COLUMN title TEXT;
ALTER TABLE product_reviews ADD COLUMN isVerified INTEGER DEFAULT 0;

-- Cart Items
ALTER TABLE cart_items ADD COLUMN variantId TEXT;
ALTER TABLE cart_items ADD COLUMN updatedAt TEXT;

-- Inventory Alerts
ALTER TABLE inventory_alerts ADD COLUMN isRead INTEGER DEFAULT 0;
ALTER TABLE inventory_alerts ADD COLUMN isResolved INTEGER DEFAULT 0;
ALTER TABLE inventory_alerts ADD COLUMN resolvedAt TEXT;

-- Posts
ALTER TABLE posts ADD COLUMN content TEXT;
ALTER TABLE posts ADD COLUMN published INTEGER DEFAULT 0;

-- Reels
ALTER TABLE reels ADD COLUMN "order" INTEGER DEFAULT 0;
ALTER TABLE reels ADD COLUMN productIds TEXT;

-- Banners
ALTER TABLE banners ADD COLUMN mobileImage TEXT;
ALTER TABLE banners ADD COLUMN buttonText TEXT;
ALTER TABLE banners ADD COLUMN buttonLink TEXT;
ALTER TABLE banners ADD COLUMN "order" INTEGER DEFAULT 0;

-- Promotions
ALTER TABLE promotions ADD COLUMN description TEXT;
ALTER TABLE promotions ADD COLUMN ctaText TEXT;
ALTER TABLE promotions ADD COLUMN ctaLink TEXT;
ALTER TABLE promotions ADD COLUMN "order" INTEGER DEFAULT 0;

-- Admin Logs
ALTER TABLE admin_logs ADD COLUMN ipAddress TEXT;
ALTER TABLE admin_logs ADD COLUMN userAgent TEXT;
