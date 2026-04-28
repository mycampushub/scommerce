-- ============================================
-- E-Commerce Database Seed Data
-- ============================================

-- Clear existing data (in reverse order of dependencies)
DELETE FROM homepage_settings;
DELETE FROM inventory_alerts;
DELETE FROM admin_logs;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM wishlist_items;
DELETE FROM product_reviews;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM addresses;
DELETE FROM users;
DELETE FROM promotions;
DELETE FROM reels;
DELETE FROM stories;
DELETE FROM banners;

-- ============================================
-- Users
-- ============================================
INSERT INTO users (id, email, name, phone, role, emailVerified, createdAt, updatedAt) VALUES
('user-1', 'admin@modern.com', 'Admin User', '+8801700000000', 'admin', 1, datetime('now'), datetime('now')),
('user-2', 'customer@example.com', 'John Doe', '+8801800000000', 'user', 1, datetime('now'), datetime('now'));

-- ============================================
-- Categories
-- ============================================
INSERT INTO categories (id, name, slug, description, image, isActive, createdAt, updatedAt) VALUES
('cat-1', 'Sarees', 'saree', 'Beautiful collection of traditional and modern sarees', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', 1, datetime('now'), datetime('now')),
('cat-2', 'Salwar Suits', 'salwar', 'Elegant salwar suits for every occasion', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400', 1, datetime('now'), datetime('now')),
('cat-3', 'Lehengas', 'lehengas', 'Stunning lehengas for weddings and festivals', 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', 1, datetime('now'), datetime('now')),
('cat-4', 'Kurtas', 'kurtas', 'Comfortable and stylish kurtas', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', 1, datetime('now'), datetime('now')),
('cat-5', 'Menswear', 'menswear', 'Traditional and modern menswear', 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=400', 1, datetime('now'), datetime('now')),
('cat-6', 'Accessories', 'accessories', 'Matching accessories', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400', 1, datetime('now'), datetime('now')),
('cat-7', 'Wedding Collection', 'wedding', 'Complete wedding collection', 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400', 1, datetime('now'), datetime('now')),
('cat-8', 'Kids Wear', 'kids', 'Traditional wear for kids', 'https://images.unsplash.com/photo-1519458399047-17d2b4c8a583?w=400', 1, datetime('now'), datetime('now'));

-- ============================================
-- Products
-- ============================================
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, discount, discountType, images, stock, lowStockAlert, reorderLevel, reorderQty, isActive, isFeatured, hasVariants, createdAt, updatedAt) VALUES
-- Sarees
('prod-1', 'Silk Banarasi Saree', 'silk-banarasi-saree', 'Luxurious Banarasi silk saree with intricate golden zari work', 'cat-1', 8500.00, 8500.00, 12000.00, 29.17, 'percentage', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"]', 50, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-2', 'Georgette Chiffon Saree', 'georgette-chiffon-saree', 'Lightweight georgette chiffon saree perfect for parties', 'cat-1', 3500.00, 3500.00, 5000.00, 30.00, 'percentage', '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"]', 45, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-3', 'Cotton Handloom Saree', 'cotton-handloom-saree', 'Comfortable cotton handloom saree for daily wear', 'cat-1', 1800.00, 1800.00, 2500.00, 28.00, 'percentage', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"]', 80, 10, 5, 20, 1, 0, 0, datetime('now'), datetime('now')),

-- Salwar Suits
('prod-4', 'Anarkali Designer Suit', 'anarkali-designer-suit', 'Elegant Anarkali suit with heavy embroidery', 'cat-2', 4500.00, 4500.00, 6500.00, 30.77, 'percentage', '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"]', 30, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-5', 'Cotton Palazzo Suit', 'cotton-palazzo-suit', 'Comfortable cotton suit with palazzo pants', 'cat-2', 2200.00, 2200.00, 3000.00, 26.67, 'percentage', '["https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800"]', 60, 10, 5, 20, 1, 0, 0, datetime('now'), datetime('now')),

-- Lehengas
('prod-6', 'Bridal Red Lehenga', 'bridal-red-lehenga', 'Stunning red bridal lehenga with golden embroidery', 'cat-3', 25000.00, 25000.00, 35000.00, 28.57, 'percentage', '["https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800"]', 15, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-7', 'Pink Sequin Lehenga', 'pink-sequin-lehenga', 'Gorgeous pink lehenga with sequin work', 'cat-3', 12000.00, 12000.00, 16000.00, 25.00, 'percentage', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"]', 25, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),

-- Kurtas
('prod-8', 'White Cotton Kurta', 'white-cotton-kurta', 'Classic white cotton kurta for men', 'cat-4', 1200.00, 1200.00, 1500.00, 20.00, 'percentage', '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"]', 100, 10, 5, 20, 1, 1, 1, datetime('now'), datetime('now')),
('prod-9', 'Embroidered Kurta Set', 'embroidered-kurta-set', 'Beautiful embroidered kurta with pajama', 'cat-4', 2500.00, 2500.00, 3200.00, 21.88, 'percentage', '["https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800"]', 50, 10, 5, 20, 1, 1, 1, datetime('now'), datetime('now')),

-- Menswear
('prod-10', 'Sherwani Groom', 'sherwani-groom', 'Premium sherwani for grooms', 'cat-5', 18000.00, 18000.00, 24000.00, 25.00, 'percentage', '["https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800"]', 20, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-11', 'Formal Kurta Pajama', 'formal-kurta-pajama', 'Elegant formal kurta pajama set', 'cat-5', 2800.00, 2800.00, 3600.00, 22.22, 'percentage', '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"]', 70, 10, 5, 20, 1, 0, 0, datetime('now'), datetime('now')),

-- Accessories
('prod-12', 'Gold Earrings Set', 'gold-earrings-set', 'Traditional gold earrings set', 'cat-6', 3500.00, 3500.00, 4500.00, 22.22, 'percentage', '["https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800"]', 40, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-13', 'Designer Clutch', 'designer-clutch', 'Elegant designer clutch bag', 'cat-6', 1500.00, 1500.00, 2000.00, 25.00, 'percentage', '["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"]', 55, 10, 5, 20, 1, 0, 0, datetime('now'), datetime('now')),

-- Wedding Collection
('prod-14', 'Wedding Ensemble', 'wedding-ensemble', 'Complete wedding ensemble set', 'cat-7', 45000.00, 45000.00, 60000.00, 25.00, 'percentage', '["https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=800"]', 10, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-15', 'Groom Sherwani Set', 'groom-sherwani-set', 'Premium groom sherwani with accessories', 'cat-7', 35000.00, 35000.00, 45000.00, 22.22, 'percentage', '["https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800"]', 12, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),

-- Kids Wear
('prod-16', 'Kids Lehenga Choli', 'kids-lehenga-choli', 'Beautiful lehenga choli for kids', 'cat-8', 1800.00, 1800.00, 2400.00, 25.00, 'percentage', '["https://images.unsplash.com/photo-1519458399047-17d2b4c8a583?w=800"]', 35, 10, 5, 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-17', 'Kids Kurta Pyjama', 'kids-kurta-pyjama', 'Traditional kurta pyjama for boys', 'cat-8', 1200.00, 1200.00, 1600.00, 25.00, 'percentage', '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"]', 45, 10, 5, 20, 1, 0, 0, datetime('now'), datetime('now'));

-- ============================================
-- Product Variants (for products with sizes)
-- ============================================
INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, color, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt) VALUES
-- White Cotton Kurta variants
('var-1', 'prod-8', 'WCK-S-001', 'White Cotton Kurta - Small', 1200.00, 1500.00, 25, 'S', 'White', 1, 1, 10, 5, 20, datetime('now'), datetime('now')),
('var-2', 'prod-8', 'WCK-M-001', 'White Cotton Kurta - Medium', 1200.00, 1500.00, 30, 'M', 'White', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),
('var-3', 'prod-8', 'WCK-L-001', 'White Cotton Kurta - Large', 1200.00, 1500.00, 25, 'L', 'White', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),
('var-4', 'prod-8', 'WCK-XL-001', 'White Cotton Kurta - XL', 1200.00, 1500.00, 20, 'XL', 'White', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),

-- Embroidered Kurta Set variants
('var-5', 'prod-9', 'EKS-S-002', 'Embroidered Kurta Set - Small', 2500.00, 3200.00, 15, 'S', 'Beige', 1, 1, 10, 5, 20, datetime('now'), datetime('now')),
('var-6', 'prod-9', 'EKS-M-002', 'Embroidered Kurta Set - Medium', 2500.00, 3200.00, 20, 'M', 'Beige', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),
('var-7', 'prod-9', 'EKS-L-002', 'Embroidered Kurta Set - Large', 2500.00, 3200.00, 15, 'L', 'Beige', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),

-- Formal Kurta Pajama variants
('var-8', 'prod-11', 'FKP-S-003', 'Formal Kurta Pajama - Small', 2800.00, 3600.00, 18, 'S', 'Navy Blue', 1, 1, 10, 5, 20, datetime('now'), datetime('now')),
('var-9', 'prod-11', 'FKP-M-003', 'Formal Kurta Pajama - Medium', 2800.00, 3600.00, 25, 'M', 'Navy Blue', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),
('var-10', 'prod-11', 'FKP-L-003', 'Formal Kurta Pajama - Large', 2800.00, 3600.00, 20, 'L', 'Navy Blue', 1, 0, 10, 5, 20, datetime('now'), datetime('now')),
('var-11', 'prod-11', 'FKP-XL-003', 'Formal Kurta Pajama - XL', 2800.00, 3600.00, 15, 'XL', 'Navy Blue', 1, 0, 10, 5, 20, datetime('now'), datetime('now'));

-- ============================================
-- Banners
-- ============================================
INSERT INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, "order", createdAt, updatedAt) VALUES
('banner-1', 'New Summer Collection', 'Discover our beautiful summer collection', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=580&h=700&fit=crop', 'Shop Now', '/collections/saree', 1, 1, datetime('now'), datetime('now')),
('banner-2', 'Wedding Season Special', 'Complete your wedding look with us', 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=580&h=700&fit=crop', 'Explore', '/collections/wedding', 1, 2, datetime('now'), datetime('now')),
('banner-3', 'Festive Sale', 'Up to 50% off on selected items', 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=580&h=700&fit=crop', 'View Offers', '/sale', 1, 3, datetime('now'), datetime('now'));

-- ============================================
-- Stories
-- ============================================
INSERT INTO stories (id, title, thumbnail, images, isActive, "order", createdAt, updatedAt) VALUES
('story-1', 'Summer Fashion', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800","https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800","https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800"]', 1, 1, datetime('now'), datetime('now')),
('story-2', 'Wedding Collection', 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400', '["https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=800","https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800"]', 1, 2, datetime('now'), datetime('now')),
('story-3', 'Traditional Wear', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800","https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800","https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800"]', 1, 3, datetime('now'), datetime('now')),
('story-4', 'Designer Collections', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400', '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800","https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"]', 1, 4, datetime('now'), datetime('now')),
('story-5', 'Festival Special', 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', '["https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800","https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800","https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=800"]', 1, 5, datetime('now'), datetime('now'));

-- ============================================
-- Reels
-- ============================================
INSERT INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, "order", createdAt, updatedAt) VALUES
('reel-1', 'Stunning Saree Collection', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', 'https://www.youtube.com/embed/Gk-s0icT2CI', '["prod-1","prod-2","prod-3"]', 1, 1, datetime('now'), datetime('now')),
('reel-2', 'Wedding Lehenga Showcase', 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400', 'https://www.youtube.com/embed/Gk-s0icT2CI', '["prod-6","prod-7"]', 1, 2, datetime('now'), datetime('now')),
('reel-3', 'Mens Kurta Collection', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', 'https://www.youtube.com/embed/Gk-s0icT2CI', '["prod-8","prod-9","prod-11"]', 1, 3, datetime('now'), datetime('now')),
('reel-4', 'Traditional Jewelry', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400', 'https://www.youtube.com/embed/Gk-s0icT2CI', '["prod-12"]', 1, 4, datetime('now'), datetime('now'));

-- ============================================
-- Promotions
-- ============================================
INSERT INTO promotions (id, title, description, image, ctaText, ctaLink, type, isActive, "order", createdAt, updatedAt) VALUES
('promo-1', 'Ramadan Special', 'Special collection for the holy month', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', 'Shop Now', '/collections/all', 'banner', 1, 1, datetime('now'), datetime('now')),
('promo-2', 'Eid Collection 2024', 'Latest Eid collection available', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', 'Explore', '/collections/new', 'banner', 1, 2, datetime('now'), datetime('now')),
('promo-3', 'Clearance Sale', 'Up to 70% off', 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800', 'Shop Sale', '/sale', 'banner', 1, 3, datetime('now'), datetime('now'));

-- ============================================
-- Homepage Settings
-- ============================================
INSERT INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, updatedAt) VALUES
('hs-1', 'hero_carousel', 1, 5000, NULL, NULL, datetime('now')),
('hs-2', 'section_marquee', 1, NULL, NULL, NULL, datetime('now')),
('hs-3', 'stories', 1, 4000, 10, NULL, datetime('now')),
('hs-4', 'categories', 1, NULL, 8, NULL, datetime('now')),
('hs-5', 'video_reels', 1, NULL, 8, NULL, datetime('now')),
('hs-6', 'fullscreen_video', 1, NULL, NULL, NULL, datetime('now')),
('hs-7', 'featured_collection', 1, NULL, 8, NULL, datetime('now')),
('hs-8', 'promotions', 1, NULL, 4, NULL, datetime('now'));
