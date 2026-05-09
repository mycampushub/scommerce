@echo off
echo Running D1 migrations - errors for existing columns are safe to ignore
echo.

echo --- Orders ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN deletedAt TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN deletedBy TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN deletedReason TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN trackingNumber TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN trackingStatus TEXT DEFAULT 'PENDING';"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN estimatedDeliveryDate TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN cancelledAt TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN cancelledBy TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN cancellationReason TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN refundedAt TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN refundedAmount REAL;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN refundMethod TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE orders ADD COLUMN refundReason TEXT;"

echo --- Users ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN phone TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN address TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN emailToken TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN newEmail TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN resetToken TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN resetTokenExpiry TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN avatar TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN isBanned INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN bannedAt TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE users ADD COLUMN lastLoginAt TEXT;"

echo --- Addresses ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE addresses ADD COLUMN district TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE addresses ADD COLUMN division TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE addresses ADD COLUMN postalCode TEXT;"

echo --- Products ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN basePrice REAL DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN comparePrice REAL;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN discount REAL DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN discountType TEXT DEFAULT 'percentage';"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN lowStockAlert INTEGER DEFAULT 10;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN reorderLevel INTEGER DEFAULT 5;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN reorderQty INTEGER DEFAULT 20;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN isFeatured INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN hasVariants INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN weight REAL;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE products ADD COLUMN dimensions TEXT;"

echo --- Product Variants ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_variants ADD COLUMN comparePrice REAL;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_variants ADD COLUMN lowStockAlert INTEGER DEFAULT 10;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_variants ADD COLUMN reorderLevel INTEGER DEFAULT 5;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_variants ADD COLUMN reorderQty INTEGER DEFAULT 20;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_variants ADD COLUMN isDefault INTEGER DEFAULT 0;"

echo --- Product Reviews ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_reviews ADD COLUMN userName TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_reviews ADD COLUMN title TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE product_reviews ADD COLUMN isVerified INTEGER DEFAULT 0;"

echo --- Cart Items ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE cart_items ADD COLUMN variantId TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE cart_items ADD COLUMN updatedAt TEXT;"

echo --- Inventory Alerts ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE inventory_alerts ADD COLUMN isRead INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE inventory_alerts ADD COLUMN isResolved INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE inventory_alerts ADD COLUMN resolvedAt TEXT;"

echo --- Posts ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE posts ADD COLUMN content TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE posts ADD COLUMN published INTEGER DEFAULT 0;"

echo --- Stories ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE stories ADD COLUMN "order" INTEGER DEFAULT 0;"

echo --- Reels ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE reels ADD COLUMN "order" INTEGER DEFAULT 0;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE reels ADD COLUMN productIds TEXT;"

echo --- Banners ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE banners ADD COLUMN mobileImage TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE banners ADD COLUMN buttonText TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE banners ADD COLUMN buttonLink TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE banners ADD COLUMN "order" INTEGER DEFAULT 0;"

echo --- Promotions ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE promotions ADD COLUMN description TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE promotions ADD COLUMN ctaText TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE promotions ADD COLUMN ctaLink TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE promotions ADD COLUMN "order" INTEGER DEFAULT 0;"

echo --- Admin Logs ---
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE admin_logs ADD COLUMN ipAddress TEXT;"
wrangler d1 execute scommerce-db --remote --command="ALTER TABLE admin_logs ADD COLUMN userAgent TEXT;"

echo.
echo All migrations executed. Now re-applying schema to add indexes...
wrangler d1 execute scommerce-db --remote --file=db/schema.sql

echo.
echo Done!
