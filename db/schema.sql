-- Complete Schema for SCommerce ecommerce database
-- Generated from Prisma schema

-- ============================================
-- USERS AND AUTHENTICATION
-- ============================================

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "password" TEXT,
    "emailVerified" INTEGER NOT NULL DEFAULT 0,
    "emailToken" TEXT,
    "newEmail" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" DATETIME,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- ============================================
-- ADDRESSES
-- ============================================

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "division" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");
CREATE INDEX "addresses_isDefault_idx" ON "addresses"("isDefault");

-- ============================================
-- ADMIN LOGS
-- ============================================

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "adminId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "admin_logs_adminId_createdAt_idx" ON "admin_logs"("adminId", "createdAt" DESC);
CREATE INDEX "admin_logs_entity_createdAt_idx" ON "admin_logs"("entity", "createdAt" DESC);
CREATE INDEX "admin_logs_action_createdAt_idx" ON "admin_logs"("action", "createdAt" DESC);
CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt" DESC);
CREATE INDEX "admin_logs_entity_entityId_idx" ON "admin_logs"("entity", "entityId");

-- ============================================
-- BRANDS
-- ============================================

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "logo" TEXT,
    "website" TEXT,
    "description" TEXT,
    "country" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "featured" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "brands_isActive_sortOrder_idx" ON "brands"("isActive", "sortOrder");
CREATE INDEX "brands_featured_idx" ON "brands"("featured");
CREATE INDEX "brands_slug_idx" ON "brands"("slug");

-- ============================================
-- CATEGORIES
-- ============================================

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_slug_idx" ON "categories"("slug");
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- ============================================
-- PRODUCTS
-- ============================================

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "basePrice" REAL NOT NULL DEFAULT 0,
    "comparePrice" REAL,
    "discount" REAL NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "images" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 10,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "reorderQty" INTEGER NOT NULL DEFAULT 20,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "isFeatured" INTEGER NOT NULL DEFAULT 0,
    "hasVariants" INTEGER NOT NULL DEFAULT 0,
    "weight" REAL,
    "dimensions" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "costPrice" REAL DEFAULT 0,
    "brandId" TEXT,
    "brandName" TEXT,
    "brandLogo" TEXT,
    "sizeType" TEXT,
    "sizeValue" REAL,
    "sizeUnit" TEXT,
    "sizeLabel" TEXT,
    "countryOfOrigin" TEXT,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL DEFAULT 0,
    "averageCost" REAL DEFAULT 0,
    "lastPurchaseAt" DATETIME,
    "lastPurchaseCost" REAL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_brandId_idx" ON "products"("brandId");
CREATE INDEX "products_countryOfOrigin_idx" ON "products"("countryOfOrigin");
CREATE INDEX "products_sizeType_sizeUnit_idx" ON "products"("sizeType", "sizeUnit");
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");
CREATE INDEX "products_slug_idx" ON "products"("slug");
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt" DESC);
CREATE INDEX "products_isActive_isFeatured_idx" ON "products"("isActive", "isFeatured");

-- ============================================
-- PRODUCT VARIANTS
-- ============================================

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "comparePrice" REAL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT,
    "size" TEXT,
    "color" TEXT,
    "material" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "isDefault" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 10,
    "reorderLevel" INTEGER NOT NULL DEFAULT 5,
    "reorderQty" INTEGER NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "costPrice" REAL DEFAULT 0,
    "sizeType" TEXT,
    "sizeValue" REAL,
    "sizeUnit" TEXT,
    "sizeLabel" TEXT,
    "countryOfOrigin" TEXT,
    "totalPurchased" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL DEFAULT 0,
    "averageCost" REAL DEFAULT 0,
    CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");
CREATE INDEX "product_variants_productId_isActive_idx" ON "product_variants"("productId", "isActive");
CREATE INDEX "product_variants_productId_size_color_idx" ON "product_variants"("productId", "size", "color");
CREATE INDEX "product_variants_countryOfOrigin_idx" ON "product_variants"("countryOfOrigin");
CREATE INDEX "product_variants_sizeType_sizeUnit_idx" ON "product_variants"("sizeType", "sizeUnit");

-- ============================================
-- PRODUCT REVIEWS
-- ============================================

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isVerified" INTEGER NOT NULL DEFAULT 0,
    "isApproved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_productId_userId_key" ON "product_reviews"("productId", "userId");
CREATE INDEX "product_reviews_productId_isApproved_idx" ON "product_reviews"("productId", "isApproved");
CREATE INDEX "product_reviews_productId_rating_idx" ON "product_reviews"("productId", "rating" DESC);
CREATE INDEX "product_reviews_userId_idx" ON "product_reviews"("userId");
CREATE INDEX "product_reviews_isApproved_createdAt_idx" ON "product_reviews"("isApproved", "createdAt" DESC);

-- ============================================
-- WISHLIST ITEMS
-- ============================================

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON "wishlist_items"("userId", "productId");

-- ============================================
-- ORDERS
-- ============================================

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "shippingAddress" TEXT NOT NULL,
    "billingAddress" TEXT,
    "city" TEXT,
    "district" TEXT,
    "division" TEXT,
    "subtotal" REAL NOT NULL,
    "shipping" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "trackingNumber" TEXT,
    "trackingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "estimatedDeliveryDate" TEXT,
    "cancelledAt" TEXT,
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "refundedAt" TEXT,
    "refundedAmount" REAL,
    "refundMethod" TEXT,
    "refundReason" TEXT,
    "notes" TEXT,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "deletedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "promoCode" TEXT,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE INDEX "orders_userId_idx" ON "orders"("userId");
CREATE INDEX "orders_customerEmail_idx" ON "orders"("customerEmail");
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt" DESC);
CREATE INDEX "orders_customerEmail_status_idx" ON "orders"("customerEmail", "status");
CREATE INDEX "orders_deletedAt_idx" ON "orders"("deletedAt");

-- ============================================
-- ORDER ITEMS
-- ============================================

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "productName" TEXT NOT NULL,
    "productImage" TEXT,
    "variantSku" TEXT,
    "variantSize" TEXT,
    "variantColor" TEXT,
    "variantMaterial" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");

-- ============================================
-- CART ITEMS
-- ============================================

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "cart_items_userId_idx" ON "cart_items"("userId");
CREATE INDEX "cart_items_userId_variantId_idx" ON "cart_items"("userId", "variantId");
CREATE INDEX "cart_items_variantId_idx" ON "cart_items"("variantId");
CREATE UNIQUE INDEX "cart_items_userId_productId_variantId_key" ON "cart_items"("userId", "productId", "variantId");

-- ============================================
-- INVENTORY ALERTS
-- ============================================

-- CreateTable
CREATE TABLE "inventory_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT,
    "productId" TEXT,
    "alertType" TEXT NOT NULL DEFAULT 'LOW_STOCK',
    "quantity" INTEGER NOT NULL,
    "isRead" INTEGER NOT NULL DEFAULT 0,
    "isResolved" INTEGER NOT NULL DEFAULT 0,
    "resolvedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_alerts_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "unique_product_variant_alert" UNIQUE ("productId", "variantId", "alertType")
);

-- CreateIndex
CREATE INDEX "inventory_alerts_variantId_idx" ON "inventory_alerts"("variantId");
CREATE INDEX "inventory_alerts_productId_idx" ON "inventory_alerts"("productId");
CREATE INDEX "inventory_alerts_isRead_isResolved_idx" ON "inventory_alerts"("isRead", "isResolved");

-- ============================================
-- INVENTORY RESERVATIONS
-- ============================================

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT,
    "productId" TEXT,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_reservations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "inventory_reservations_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "inventory_reservations_variantId_idx" ON "inventory_reservations"("variantId");
CREATE INDEX "inventory_reservations_productId_idx" ON "inventory_reservations"("productId");
CREATE INDEX "inventory_reservations_userId_idx" ON "inventory_reservations"("userId");
CREATE INDEX "inventory_reservations_expiresAt_idx" ON "inventory_reservations"("expiresAt");

-- ============================================
-- POSTS (BLOG)
-- ============================================

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "posts"("authorId");

-- ============================================
-- BANNERS
-- ============================================

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "mobileImage" TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "banners_isActive_idx" ON "banners"("isActive");
CREATE INDEX "banners_order_idx" ON "banners"("order");

-- ============================================
-- STORIES
-- ============================================

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "stories_isActive_idx" ON "stories"("isActive");
CREATE INDEX "stories_order_idx" ON "stories"("order");

-- ============================================
-- REELS
-- ============================================

-- CreateTable
CREATE TABLE "reels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "productIds" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "reels_isActive_idx" ON "reels"("isActive");
CREATE INDEX "reels_order_idx" ON "reels"("order");

-- ============================================
-- PROMOTIONS
-- ============================================

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "type" TEXT NOT NULL DEFAULT 'banner',
    "promoCode" TEXT UNIQUE,
    "discountType" TEXT,
    "discountValue" REAL,
    "minOrderAmount" REAL,
    "maxDiscountAmount" REAL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "userLimit" INTEGER,
    "applicableCategories" TEXT,
    "applicableProducts" TEXT,
    "conditions" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_promoCode_key" ON "promotions"("promoCode");
CREATE INDEX "promotions_isActive_idx" ON "promotions"("isActive");
CREATE INDEX "promotions_type_isActive_idx" ON "promotions"("type", "isActive");
CREATE INDEX "promotions_promoCode_idx" ON "promotions"("promoCode");

-- ============================================
-- HOMEPAGE SETTINGS
-- ============================================

-- CreateTable
CREATE TABLE "homepage_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionName" TEXT NOT NULL UNIQUE,
    "isEnabled" INTEGER NOT NULL DEFAULT 1,
    "autoPlay" INTEGER NOT NULL DEFAULT 5000,
    "displayLimit" INTEGER,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_settings_sectionName_key" ON "homepage_settings"("sectionName");

-- ============================================
-- SITE SETTINGS
-- ============================================

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteName" TEXT NOT NULL DEFAULT 'SCommerce',
    "siteLogo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "currencySymbol" TEXT NOT NULL DEFAULT '৳',
    "taxRate" REAL NOT NULL DEFAULT 0.18,
    "freeShippingThreshold" REAL NOT NULL DEFAULT 5000,
    "baseShippingCost" REAL NOT NULL DEFAULT 150,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "socialMedia" TEXT,
    "enableStore" INTEGER NOT NULL DEFAULT 1,
    "maintenanceMode" INTEGER NOT NULL DEFAULT 0,
    "seo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- ============================================
-- PAYMENT GATEWAYS
-- ============================================

-- CreateTable
CREATE TABLE "payment_gateways" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "sandboxMode" INTEGER NOT NULL DEFAULT 0,
    "supportedCurrencies" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT,
    "lastTested" DATETIME,
    "testStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateways_name_key" ON "payment_gateways"("name");

-- ============================================
-- SHIPPING CARRIERS
-- ============================================

-- CreateTable
CREATE TABLE "shipping_carriers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accountNumber" TEXT,
    "webhookUrl" TEXT,
    "sandboxMode" INTEGER NOT NULL DEFAULT 0,
    "shippingMethods" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT,
    "lastTested" DATETIME,
    "testStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_carriers_name_key" ON "shipping_carriers"("name");

-- ============================================
-- ANALYTICS INTEGRATIONS
-- ============================================

-- CreateTable
CREATE TABLE "analytics_integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "trackingId" TEXT,
    "measurementId" TEXT,
    "apiKey" TEXT,
    "pixelId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "analytics_integrations_name_key" ON "analytics_integrations"("name");

-- ============================================
-- EMAIL SERVICES
-- ============================================

-- CreateTable
CREATE TABLE "email_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "provider" TEXT NOT NULL DEFAULT 'custom',
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "webhookUrl" TEXT,
    "sandboxMode" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT,
    "lastTested" DATETIME,
    "testStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "email_services_name_key" ON "email_services"("name");

-- ============================================
-- MEDIA
-- ============================================

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL UNIQUE,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "media_category_idx" ON "media"("category");
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt" DESC);
CREATE INDEX "media_uploadedBy_idx" ON "media"("uploadedBy");

-- ============================================
-- ADVANCED INVENTORY MANAGEMENT
-- ============================================

-- SUPPLIERS
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");
CREATE INDEX "suppliers_code_idx" ON "suppliers"("code");

-- PURCHASE ORDERS
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalAmount" REAL NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "orderDate" DATETIME NOT NULL,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");
CREATE INDEX "purchase_orders_status_orderDate_idx" ON "purchase_orders"("status", "orderDate");
CREATE INDEX "purchase_orders_orderDate_idx" ON "purchase_orders"("orderDate" DESC);

-- PURCHASE ORDER ITEMS
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");
CREATE INDEX "purchase_order_items_productId_idx" ON "purchase_order_items"("productId");
CREATE INDEX "purchase_order_items_variantId_idx" ON "purchase_order_items"("variantId");

-- INVENTORY MOVEMENTS
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "movementType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL,
    "totalCost" REAL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" DATETIME,
    "supplierId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "inventory_movements_productId_createdAt_idx" ON "inventory_movements"("productId", "createdAt");
CREATE INDEX "inventory_movements_variantId_createdAt_idx" ON "inventory_movements"("variantId", "createdAt");
CREATE INDEX "inventory_movements_movementType_createdAt_idx" ON "inventory_movements"("movementType", "createdAt");
CREATE INDEX "inventory_movements_referenceId_referenceType_idx" ON "inventory_movements"("referenceId", "referenceType");
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt" DESC);
CREATE INDEX "inventory_movements_supplierId_idx" ON "inventory_movements"("supplierId");

-- INVENTORY ADJUSTMENTS
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "adjustmentType" TEXT NOT NULL,
    "quantityBefore" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "quantityDiff" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "inventory_adjustments_productId_createdAt_idx" ON "inventory_adjustments"("productId", "createdAt");
CREATE INDEX "inventory_adjustments_adjustmentType_createdAt_idx" ON "inventory_adjustments"("adjustmentType", "createdAt");
CREATE INDEX "inventory_adjustments_createdAt_idx" ON "inventory_adjustments"("createdAt" DESC);
