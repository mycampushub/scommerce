-- Seed Data for SCommerce ecommerce database - REMOTE D1 COMPATIBLE
-- Uses "order" instead of "displayOrder" to match existing remote D1 database schema

-- Disable foreign key constraints for seeding
PRAGMA foreign_keys = OFF;

-- ============================================
-- CATEGORIES
-- ============================================
INSERT OR IGNORE INTO categories (id, name, slug, description, image, isActive, createdAt, updatedAt)
VALUES
('cat-lehengas', 'Lehengas', 'lehengas', 'Traditional and contemporary lehengas for every occasion', '/images/categories/lehengas.svg', 1, datetime('now'), datetime('now')),
('cat-sarees', 'Sarees', 'sarees', 'Beautiful collection of sarees from across India', '/images/categories/sarees.svg', 1, datetime('now'), datetime('now')),
('cat-salwar', 'Salwar Suits', 'salwar', 'Comfortable and elegant salwar suits', '/images/categories/salwar.svg', 1, datetime('now'), datetime('now')),
('cat-kurtas', 'Kurtas', 'kurtas', 'Stylish kurtas for modern women', '/images/categories/kurtas.svg', 1, datetime('now'), datetime('now')),
('cat-tops', 'Tops', 'tops', 'Trendy tops for casual and formal wear', '/images/categories/tops.svg', 1, datetime('now'), datetime('now')),
('cat-gowns', 'Gowns', 'gowns', 'Elegant gowns for special occasions', '/images/categories/gowns.svg', 1, datetime('now'), datetime('now')),
('cat-menswear', 'Menswear', 'menswear', 'Traditional and modern menswear collection', '/images/categories/menswear.svg', 1, datetime('now'), datetime('now'));

-- ============================================
-- PRODUCTS
-- ============================================
INSERT OR IGNORE INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, discount, discountType, images, stock, isActive, isFeatured, hasVariants, createdAt, updatedAt)
VALUES
-- Lehengas
('prod-lh-001', 'Red Bridal Lehenga', 'red-bridal-lehenga', 'Stunning red bridal lehenga with intricate embroidery work', 'cat-lehengas', 15000, 15000, 18000, 16.67, 'percentage', '["/images/products/lehenga-1.svg"]', 10, 1, 1, 1, datetime('now'), datetime('now')),
('prod-lh-002', 'Pink Designer Lehenga', 'pink-designer-lehenga', 'Beautiful pink lehenga with stone work', 'cat-lehengas', 12000, 12000, 15000, 20, 'percentage', '["/images/products/lehenga-1.svg"]', 8, 1, 1, 1, datetime('now'), datetime('now')),
-- Sarees
('prod-sa-001', 'Silk Banarasi Saree', 'silk-banarasi-saree', 'Pure silk Banarasi saree with gold border', 'cat-sarees', 8000, 8000, 10000, 20, 'percentage', '["/images/products/saree-1.jpg"]', 10, 1, 1, 1, datetime('now'), datetime('now')),
('prod-sa-002', 'Chanderi Saree', 'chanderi-saree', 'Lightweight Chanderi saree', 'cat-sarees', 5000, 5000, 6000, 16.67, 'percentage', '["/images/products/saree-2.jpg"]', 15, 1, 1, 0, datetime('now'), datetime('now')),
-- Salwar Suits
('prod-sw-001', 'Anarkali Suit', 'anarkali-suit', 'Beautiful Anarkali salwar suit', 'cat-salwar', 4000, 4000, 5000, 20, 'percentage', '["/images/products/salwar-1.jpg"]', 15, 1, 1, 0, datetime('now'), datetime('now')),
('prod-sw-002', 'Palazzo Suit', 'palazzo-suit', 'Modern palazzo salwar suit', 'cat-salwar', 3500, 3500, NULL, 0, 'percentage', '["/images/products/salwar-2.jpg"]', 20, 1, 0, 0, datetime('now'), datetime('now')),
-- Kurtas
('prod-ku-001', 'Embroidered Kurta', 'embroidered-kurta', 'Beautiful embroidered kurta', 'cat-kurtas', 2000, 2000, 2500, 20, 'percentage', '["/images/products/kurta-1.jpg"]', 25, 1, 1, 0, datetime('now'), datetime('now')),
('prod-ku-002', 'Printed Kurta', 'printed-kurta', 'Trendy printed kurta', 'cat-kurtas', 1500, 1500, NULL, 0, 'percentage', '["/images/products/kurta-2.jpg"]', 30, 1, 0, 0, datetime('now'), datetime('now')),
-- Tops
('prod-to-001', 'Floral Top', 'floral-top', 'Beautiful floral print top', 'cat-tops', 1200, 1200, 1500, 20, 'percentage', '["/images/products/top-1.jpg"]', 30, 1, 1, 0, datetime('now'), datetime('now')),
-- Gowns
('prod-go-001', 'Evening Gown', 'evening-gown', 'Elegant evening gown', 'cat-gowns', 12000, 12000, 15000, 20, 'percentage', '["/images/products/gown-1.jpg"]', 10, 1, 1, 1, datetime('now'), datetime('now')),
-- Menswear
('prod-me-001', 'Men Kurta Pyjama', 'men-kurta-pyjama', 'Traditional kurta pyjama set', 'cat-menswear', 3000, 3000, 3500, 14.29, 'percentage', '["/images/products/men-1.jpg"]', 20, 1, 1, 0, datetime('now'), datetime('now'));

-- ============================================
-- USERS
-- ============================================
-- Admin user
INSERT OR IGNORE INTO users (id, email, name, phone, password, emailVerified, role, createdAt, updatedAt)
VALUES
('user-admin-001', 'admin@scommerce.com', 'Admin User', '+8801700000001', '$2b$10$5y22htgQgUZVPkksz.6V1uY/TLQ9w.rkUX92xR4NWmB0jkiNa845u', 1, 'admin', datetime('now'), datetime('now'));

-- Staff users
INSERT OR IGNORE INTO users (id, email, name, phone, password, emailVerified, role, createdAt, updatedAt)
VALUES
('user-staff-001', 'rahul@scommerce.com', 'Rahul Sharma', '+8801700000002', '$2b$10$eoee6iYh9VMesjluGRY9ROb9ArHRCDolSaHQR6L8yYRuC1LEjYeRC', 1, 'staff', datetime('now'), datetime('now')),
('user-staff-002', 'priya@scommerce.com', 'Priya Singh', '+8801700000003', '$2b$10$a.F/Ul5zAnA24HVQPvmuE.VZUffKX32EXWob0WyEGK2q5TD2NUNQC', 1, 'staff', datetime('now'), datetime('now'));

-- Customer users
INSERT OR IGNORE INTO users (id, email, name, phone, password, emailVerified, role, createdAt, updatedAt)
VALUES
('user-cust-001', 'fatema@example.com', 'Fatema Akhter', '+8801700000101', '$2b$10$EcvgWa939MGFsiYb3Sged.k1cATkYrXj8hb6dGdWyyaGqpkWBQjyK', 1, 'user', datetime('now'), datetime('now')),
('user-cust-002', 'noor@example.com', 'Noor Jahan', '+8801700000102', '$2b$10$bwKw7jbXL1DEmFckWLhM5uCtbVghgRkq61NfL828KkR7wt6PNPqsO', 1, 'user', datetime('now'), datetime('now')),
('user-cust-003', 'sara@example.com', 'Sara Ahmed', '+8801700000103', '$2b$10$VZSrJ6C31npLpsbd0YKpj.4oacbmH0xYC5knPfOSKpsNGSFXvBy3u', 1, 'user', datetime('now'), datetime('now'));

-- ============================================
-- ADDRESSES
-- ============================================
INSERT OR IGNORE INTO addresses (id, userId, fullName, phone, addressLine1, addressLine2, city, district, division, postalCode, isDefault, createdAt, updatedAt)
VALUES
('addr-001', 'user-cust-001', 'Fatema Akhter', '+8801700000101', '123 Mirpur Road', 'Apartment 4B', 'Dhaka', 'Mirpur', 'Dhaka', '1216', 1, datetime('now'), datetime('now'));

-- ============================================
-- ORDERS
-- ============================================
INSERT OR IGNORE INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone, shippingAddress, city, district, division, subtotal, shipping, tax, discount, total, status, paymentStatus, paymentMethod, createdAt, updatedAt)
VALUES
('order-001', 'ORD-001', 'user-cust-001', 'Fatema Akhter', 'fatema@example.com', '+8801700000101', '123 Mirpur Road, Apartment 4B, Mirpur, Dhaka 1216', 'Dhaka', 'Mirpur', 'Dhaka', 15000, 150, 2700, 3000, 18350, 'DELIVERED', 'COMPLETED', 'cod', datetime('now'), datetime('now')),
('order-002', 'ORD-002', 'user-cust-002', 'Noor Jahan', 'noor@example.com', '+8801700000102', '456 Dhanmondi Road, House 12, Dhanmondi, Dhaka 1205', 'Dhaka', 'Dhanmondi', 'Dhaka', 8000, 150, 1440, 1600, 10190, 'PROCESSING', 'PENDING', 'cod', datetime('now'), datetime('now'));

-- ============================================
-- ORDER ITEMS
-- ============================================
INSERT OR IGNORE INTO order_items (id, orderId, productId, variantId, quantity, price, productName, productImage, variantSku, createdAt)
VALUES
('oi-001-1', 'order-001', 'prod-lh-001', NULL, 1, 15000, 'Red Bridal Lehenga', '/images/products/lehenga-1.jpg', NULL, datetime('now')),
('oi-001-2', 'order-001', 'prod-me-001', NULL, 1, 3000, 'Men Kurta Pyjama', '/images/products/men-1.jpg', NULL, datetime('now')),
('oi-002-1', 'order-002', 'prod-sa-002', NULL, 2, 5000, 'Chanderi Saree', '/images/products/saree-2.jpg', NULL, datetime('now'));

-- ============================================
-- WISHLIST ITEMS
-- ============================================
INSERT OR IGNORE INTO wishlist_items (id, userId, productId, createdAt)
VALUES
('wish-001', 'user-cust-001', 'prod-lh-001', datetime('now')),
('wish-002', 'user-cust-002', 'prod-sa-001', datetime('now'));

-- ============================================
-- PRODUCT REVIEWS
-- ============================================
INSERT OR IGNORE INTO product_reviews (id, productId, userId, userName, rating, title, comment, isVerified, isApproved, createdAt, updatedAt)
VALUES
('review-001', 'prod-lh-001', 'user-cust-001', 'Fatema Akhter', 5, 'Amazing lehenga!', 'Absolutely stunning lehenga for my wedding. The embroidery work is incredible!', 1, 1, datetime('now'), datetime('now')),
('review-002', 'prod-sa-001', 'user-cust-002', 'Noor Jahan', 5, 'Authentic Banarasi', 'Pure silk saree with beautiful zari work. Worth the price!', 1, 1, datetime('now'), datetime('now'));

-- ============================================
-- STORIES - Uses "order" column for remote D1 compatibility
-- ============================================
INSERT OR IGNORE INTO stories (id, title, thumbnail, images, isActive, "order", createdAt, updatedAt)
VALUES
('story-001', 'New Arrivals', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=700&fit=crop"]', 1, 1, datetime('now'), datetime('now')),
('story-002', 'Festival Special', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=700&fit=crop"]', 1, 2, datetime('now'), datetime('now'));

-- ============================================
-- REELS - Uses "order" column for remote D1 compatibility
-- ============================================
INSERT OR IGNORE INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, "order", createdAt, updatedAt)
VALUES
('reel-001', 'Lehenga Styling Tips', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-lh-001","prod-lh-002"]', 1, 1, datetime('now'), datetime('now')),
('reel-002', 'Saree Draping Styles', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-sa-001","prod-sa-002"]', 1, 2, datetime('now'), datetime('now'));

-- ============================================
-- PROMOTIONS - Uses "order" column for remote D1 compatibility
-- ============================================
INSERT OR IGNORE INTO promotions (id, title, description, image, ctaText, ctaLink, type, isActive, "order", createdAt, updatedAt)
VALUES
('promo-001', 'Summer Sale', 'Up to 50% off on selected items', '/images/promotions/summer-sale.jpg', 'Shop Now', '/shop?type=sale', 'banner', 1, 1, datetime('now'), datetime('now')),
('promo-002', 'New Collection', 'Discover our latest arrivals', '/images/promotions/new-collection.jpg', 'Explore', '/collections/new', 'banner', 1, 2, datetime('now'), datetime('now'));

-- ============================================
-- BANNERS - Uses "order" column for remote D1 compatibility
-- ============================================
INSERT OR IGNORE INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, "order", createdAt, updatedAt)
VALUES
('banner-1', 'New Collection 2024', 'Discover our latest ethnic wear collection', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=580&h=700&fit=crop', 'Shop Now', '/shop', 1, 1, datetime('now'), datetime('now')),
('banner-2', 'Festival Special', 'Get ready for the festive season', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=580&h=700&fit=crop', 'Explore', '/collections/sarees', 1, 2, datetime('now'), datetime('now'));

-- ============================================
-- HOMEPAGE SETTINGS
-- ============================================
INSERT OR IGNORE INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, updatedAt)
VALUES
('hp-1', 'hero-slider', 1, 5000, 5, NULL, datetime('now')),
('hp-2', 'categories', 1, 5000, 7, NULL, datetime('now')),
('hp-3', 'featured-products', 1, 5000, 8, NULL, datetime('now'));

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
INSERT OR IGNORE INTO product_variants (id, productId, sku, name, price, comparePrice, stock, images, size, color, material, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt)
VALUES
-- Red Bridal Lehenga Variants
('pv-lh-001-1', 'prod-lh-001', 'LH-RED-S', 'Red Bridal Lehenga - Size S', 15000, 18000, 3, '["/images/products/lehenga-1.svg"]', 'S', 'Red', 'Velvet', 1, 1, 5, 2, 5, datetime('now'), datetime('now')),
('pv-lh-001-2', 'prod-lh-001', 'LH-RED-M', 'Red Bridal Lehenga - Size M', 15000, 18000, 4, '["/images/products/lehenga-1.svg"]', 'M', 'Red', 'Velvet', 1, 0, 5, 2, 5, datetime('now'), datetime('now')),
('pv-lh-001-3', 'prod-lh-001', 'LH-RED-L', 'Red Bridal Lehenga - Size L', 15000, 18000, 3, '["/images/products/lehenga-1.svg"]', 'L', 'Red', 'Velvet', 1, 0, 5, 2, 5, datetime('now'), datetime('now')),
-- Silk Banarasi Saree Variants (Color variations)
('pv-sa-001-1', 'prod-sa-001', 'SA-SILK-RED', 'Silk Banarasi Saree - Red', 8000, 10000, 5, '["/images/products/saree-1.jpg"]', 'One Size', 'Red', 'Silk', 1, 1, 5, 2, 5, datetime('now'), datetime('now')),
('pv-sa-001-2', 'prod-sa-001', 'SA-SILK-GRN', 'Silk Banarasi Saree - Green', 8000, 10000, 4, '["/images/products/saree-1.jpg"]', 'One Size', 'Green', 'Silk', 1, 0, 5, 2, 5, datetime('now'), datetime('now')),
('pv-sa-001-3', 'prod-sa-001', 'SA-SILK-BLU', 'Silk Banarasi Saree - Blue', 8000, 10000, 3, '["/images/products/saree-1.jpg"]', 'One Size', 'Blue', 'Silk', 1, 0, 5, 2, 5, datetime('now'), datetime('now')),
-- Anarkali Suit Variants (Size variations)
('pv-sw-001-1', 'prod-sw-001', 'SW-ANA-S', 'Anarkali Suit - Size S', 4000, 5000, 8, '["/images/products/salwar-1.jpg"]', 'S', NULL, 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-sw-001-2', 'prod-sw-001', 'SW-ANA-M', 'Anarkali Suit - Size M', 4000, 5000, 7, '["/images/products/salwar-1.jpg"]', 'M', NULL, 'Cotton', 1, 1, 5, 3, 8, datetime('now'), datetime('now')),
('pv-sw-001-3', 'prod-sw-001', 'SW-ANA-L', 'Anarkali Suit - Size L', 4000, 5000, 6, '["/images/products/salwar-1.jpg"]', 'L', NULL, 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-sw-001-4', 'prod-sw-001', 'SW-ANA-XL', 'Anarkali Suit - Size XL', 4000, 5000, 5, '["/images/products/salwar-1.jpg"]', 'XL', NULL, 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
-- Embroidered Kurta Variants (Size and Color combinations)
('pv-ku-001-1', 'prod-ku-001', 'KU-EMB-BLK-S', 'Embroidered Kurta - Black S', 2000, 2500, 10, '["/images/products/kurta-1.jpg"]', 'S', 'Black', 'Cotton', 1, 1, 5, 3, 8, datetime('now'), datetime('now')),
('pv-ku-001-2', 'prod-ku-001', 'KU-EMB-BLK-M', 'Embroidered Kurta - Black M', 2000, 2500, 10, '["/images/products/kurta-1.jpg"]', 'M', 'Black', 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-ku-001-3', 'prod-ku-001', 'KU-EMB-WHT-S', 'Embroidered Kurta - White S', 2000, 2500, 8, '["/images/products/kurta-1.jpg"]', 'S', 'White', 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-ku-001-4', 'prod-ku-001', 'KU-EMB-WHT-M', 'Embroidered Kurta - White M', 2000, 2500, 9, '["/images/products/kurta-1.jpg"]', 'M', 'White', 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now'));

-- ============================================
-- SUMMARY
-- ============================================
-- Categories: 7
-- Products: 10
-- Product Variants: 15
-- Users: 6 (1 admin + 2 staff + 3 customers)
-- Addresses: 1
-- Orders: 2
-- Order Items: 3
-- Wishlist Items: 2
-- Product Reviews: 2
-- Stories: 2
-- Reels: 2
-- Promotions: 2
-- Banners: 2
-- Homepage Settings: 3

-- Re-enable foreign key constraints after seeding
PRAGMA foreign_keys = ON;
