-- Seed Data for SCommerce E-commerce Platform
-- Run this after schema.sql to populate initial data
-- Note: Uses camelCase column names to match database schema

-- Clear existing data in correct order (child tables first, then parent tables)
-- This is needed because INSERT OR REPLACE fails with foreign key constraints
DELETE FROM order_items;
DELETE FROM product_reviews;
DELETE FROM inventory_reservations;
DELETE FROM cart_items;
DELETE FROM wishlist_items;
DELETE FROM inventory_movements;
DELETE FROM inventory_adjustments;
DELETE FROM inventory_alerts;
DELETE FROM product_variants;
DELETE FROM purchase_order_items;
DELETE FROM purchase_orders;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM brands;
DELETE FROM suppliers;
DELETE FROM addresses;
DELETE FROM admin_logs;
DELETE FROM posts;
DELETE FROM banners;
DELETE FROM reels;
DELETE FROM stories;
DELETE FROM promotions;
DELETE FROM page_seo;
DELETE FROM homepage_settings;
DELETE FROM email_services;
DELETE FROM payment_gateways;
DELETE FROM shipping_carriers;
DELETE FROM media;
DELETE FROM analytics_integrations;
DELETE FROM site_settings;
DELETE FROM users;

-- Insert Site Settings
INSERT OR REPLACE INTO site_settings (id, siteName, currency, currencySymbol, taxRate, freeShippingThreshold, baseShippingCost, contactEmail, contactPhone, createdAt, updatedAt)
VALUES (
  'default-settings',
  'SCommerce',
  'BDT',
  '৳',
  0.18,
  5000,
  150,
  'info@scommerce.com',
  '+8801700000000',
  datetime('now'),
  datetime('now')
);

-- Insert Default Admin User (password: admin123)
INSERT OR REPLACE INTO users (id, email, name, password, role, emailVerified, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin@scommerce.com',
  'Admin User',
  'pbkdf2$100000$245cfd1a81687a32a2c548503b960472c1ca4092a3ca9c059b9f6d047fe70884$19674afc0599cdfe8e9fc3e9ce3d498b02cf29133e4c88f266553bd7c7e5ac7d11f993e5dca14ab2207b5d23a491b935f3b24855a7d21e927b9d222c5b479733',
  'admin',
  1,
  datetime('now'),
  datetime('now')
);

-- Insert Demo User (password: user123)
INSERT OR REPLACE INTO users (id, email, name, password, role, emailVerified, phone, createdAt, updatedAt)
VALUES (
  'user-001',
  'user@scommerce.com',
  'Demo User',
  'pbkdf2$100000$3f8b7a2e1c9d4a6f8e2b3c5d7a9e1f4c6b8d0a2e4f6a8b0c2d4e6f8a0b2c4d6$8a7c5d3e1f9b2a4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4',
  'user',
  1,
  '+8801800000000',
  datetime('now'),
  datetime('now')
);

-- Insert Categories
INSERT OR REPLACE INTO categories (id, name, slug, description, isActive, sortOrder, createdAt, updatedAt) VALUES
('cat-saree', 'Sarees', 'saree', 'Beautiful traditional sarees for every occasion', 1, 1, datetime('now'), datetime('now')),
('cat-salwar', 'Salwar Suits', 'salwar', 'Elegant salwar suits for modern women', 1, 2, datetime('now'), datetime('now')),
('cat-lehengas', 'Lehengas', 'lehengas', 'Stunning lehengas for special occasions', 1, 3, datetime('now'), datetime('now')),
('cat-kurtas', 'Kurtas', 'kurtas', 'Comfortable and stylish kurtas', 1, 4, datetime('now'), datetime('now')),
('cat-menswear', 'Menswear', 'menswear', 'Trendy menswear collection', 1, 5, datetime('now'), datetime('now')),
('cat-gowns', 'Gowns', 'gowns', 'Elegant gowns for formal events', 1, 6, datetime('now'), datetime('now')),
('cat-tops', 'Tops', 'tops', 'Casual and formal tops', 1, 7, datetime('now'), datetime('now')),
('cat-accessories', 'Accessories', 'accessories', 'Fashion accessories to complete your look', 1, 8, datetime('now'), datetime('now'));

-- Insert Brands
INSERT OR REPLACE INTO brands (id, name, slug, logo, description, country, isActive, featured, sortOrder, createdAt, updatedAt) VALUES
('brand-001', 'Luxury Sarees', 'luxury-sarees', 'https://example.com/logos/luxury-sarees.png', 'Premium quality silk sarees', 'India', 1, 1, 1, datetime('now'), datetime('now')),
('brand-002', 'Modern Fashion', 'modern-fashion', 'https://example.com/logos/modern-fashion.png', 'Contemporary ethnic wear', 'Bangladesh', 1, 1, 2, datetime('now'), datetime('now')),
('brand-003', 'Elegant Style', 'elegant-style', 'https://example.com/logos/elegant-style.png', 'Traditional with modern touch', 'Pakistan', 1, 0, 3, datetime('now'), datetime('now')),
('brand-004', 'Royal Collection', 'royal-collection', 'https://example.com/logos/royal-collection.png', 'Luxury bridal wear', 'India', 1, 1, 4, datetime('now'), datetime('now')),
('brand-005', 'Trendy Threads', 'trendy-threads', 'https://example.com/logos/trendy-threads.png', 'Modern casual wear', 'Bangladesh', 1, 0, 5, datetime('now'), datetime('now')),
('brand-006', 'Heritage Wear', 'heritage-wear', 'https://example.com/logos/heritage-wear.png', 'Traditional craftsmanship', 'India', 1, 1, 6, datetime('now'), datetime('now')),
('brand-007', 'Urban Chic', 'urban-chic', 'https://example.com/logos/urban-chic.png', 'City fashion collection', 'Pakistan', 1, 0, 7, datetime('now'), datetime('now')),
('brand-008', 'Classic Cut', 'classic-cut', 'https://example.com/logos/classic-cut.png', 'Timeless designs', 'India', 1, 1, 8, datetime('now'), datetime('now'));

-- Insert Comprehensive Products - Sarees
INSERT OR REPLACE INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, images, stock, isActive, isFeatured, hasVariants, brandId, brandName, material, color, availableSizes, availableColors, createdAt, updatedAt) VALUES
-- Sarees
('prod-001', 'Silk Saree - Royal Blue', 'silk-saree-royal-blue', 'Pure silk saree with intricate golden embroidery. Perfect for weddings and special occasions.', 'cat-saree', 3500, 3500, 4500, '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", "https://images.unsplash.com/photo-1610030469668-98e550d6193d?w=800"]', 50, 1, 1, 0, 'brand-001', 'Luxury Sarees', 'Silk', 'Blue', '["6m", "6.5m"]', '["Blue", "Gold"]', datetime('now'), datetime('now')),

('prod-002', 'Banarasi Silk Saree', 'banarasi-silk-saree', 'Authentic Banarasi silk saree with zari work. Handwoven masterpiece.', 'cat-saree', 12000, 12000, 15000, '["https://images.unsplash.com/photo-1610030469669-8e9d4f8f8e9e?w=800"]', 30, 1, 1, 0, 'brand-001', 'Luxury Sarees', 'Silk', 'Red', '["6m"]', '["Red", "Maroon"]', datetime('now'), datetime('now')),

('prod-003', 'Cotton Handloom Saree', 'cotton-handloom-saree', 'Handwoven cotton saree with tribal prints. Comfortable daily wear.', 'cat-saree', 1500, 1500, 2000, '["https://images.unsplash.com/photo-1610030469678-98e550d6193f?w=800"]', 100, 1, 1, 0, 'brand-006', 'Heritage Wear', 'Cotton', 'Multi', '["6m", "6.5m"]', '["Multi", "Blue"]', datetime('now'), datetime('now')),

('prod-004', 'Chiffon Saree', 'chiffon-saree', 'Lightweight chiffon saree with digital prints. Perfect for parties.', 'cat-saree', 2800, 2800, 3500, '["https://images.unsplash.com/photo-1610030469676-98e550d6193f?w=800"]', 45, 1, 1, 0, 'brand-002', 'Modern Fashion', 'Chiffon', 'Pink', '["6m"]', '["Pink", "Purple"]', datetime('now'), datetime('now')),

('prod-005', 'Kanjivaram Silk Saree', 'kanjivaram-silk-saree', 'Traditional Kanjivaram silk with temple border. Bridal collection.', 'cat-saree', 25000, 25000, 30000, '["https://images.unsplash.com/photo-1610030469675-98e550d6193f?w=800"]', 15, 1, 1, 0, 'brand-001', 'Luxury Sarees', 'Silk', 'Maroon', '["6m", "6.5m"]', '["Maroon", "Gold"]', datetime('now'), datetime('now')),

('prod-006', 'Georgette Saree', 'georgette-saree', 'Flowy georgette saree with embroidery. Contemporary design.', 'cat-saree', 3200, 3200, 4000, '["https://images.unsplash.com/photo-1610030469674-98e550d6193f?w=800"]', 40, 1, 0, 0, 'brand-002', 'Modern Fashion', 'Georgette', 'Green', '["6m"]', '["Green", "Teal"]', datetime('now'), datetime('now')),

('prod-007', 'Tussar Silk Saree', 'tussar-silk-saree', 'Natural Tussar silk with minimal work. Elegant simplicity.', 'cat-saree', 5500, 5500, 7000, '["https://images.unsplash.com/photo-1610030469673-98e550d6193f?w=800"]', 25, 1, 1, 0, 'brand-006', 'Heritage Wear', 'Silk', 'Beige', '["6m", "6.5m"]', '["Beige", "Cream"]', datetime('now'), datetime('now')),

('prod-008', 'Patola Silk Saree', 'patola-silk-saree', 'Gujarati Patola silk with double ikat. Handcrafted luxury.', 'cat-saree', 18000, 18000, 22000, '["https://images.unsplash.com/photo-1610030469672-98e550d6193f?w=800"]', 20, 1, 1, 0, 'brand-001', 'Luxury Sarees', 'Silk', 'Multi', '["6m"]', '["Multi", "Red"]', datetime('now'), datetime('now')),

-- Salwar Suits
('prod-009', 'Cotton Salwar Suit', 'cotton-salwar-suit', 'Comfortable cotton salwar suit with embroidery. Daily wear essential.', 'cat-salwar', 1800, 1800, 2200, '["https://images.unsplash.com/photo-1583391733958-3750e0ff4e8b?w=800"]', 30, 1, 1, 0, 'brand-002', 'Modern Fashion', 'Cotton', 'Green', '["S", "M", "L", "XL"]', '["Green", "Pink"]', datetime('now'), datetime('now')),

('prod-010', 'Anarkali Suit', 'anarkali-suit', 'Floor-length Anarkali with heavy embroidery. Festive wear.', 'cat-salwar', 4500, 4500, 5500, '["https://images.unsplash.com/photo-1583391733957-3750e0ff4e8b?w=800"]', 25, 1, 1, 0, 'brand-003', 'Elegant Style', 'Georgette', 'Navy', '["S", "M", "L"]', '["Navy", "Black"]', datetime('now'), datetime('now')),

('prod-011', 'Palazzo Suit', 'palazzo-suit', 'Stylish palazzo suit with digital print. Modern silhouette.', 'cat-salwar', 2500, 2500, 3000, '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800"]', 40, 1, 0, 0, 'brand-002', 'Modern Fashion', 'Rayon', 'Yellow', '["S", "M", "L", "XL", "XXL"]', '["Yellow", "Orange"]', datetime('now'), datetime('now')),

('prod-012', 'Sharara Suit', 'sharara-suit', 'Traditional sharara with mirror work. Wedding wear.', 'cat-salwar', 6000, 6000, 7500, '["https://images.unsplash.com/photo-1583391733955-3750e0ff4e8b?w=800"]', 20, 1, 1, 0, 'brand-003', 'Elegant Style', 'Silk', 'Maroon', '["S", "M", "L"]', '["Maroon", "Gold"]', datetime('now'), datetime('now')),

('prod-013', 'Churidar Suit', 'churidar-suit', 'Classic churidar kurta set. Timeless elegance.', 'cat-salwar', 2200, 2200, 2800, '["https://images.unsplash.com/photo-1583391733954-3750e0ff4e8b?w=800"]', 35, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Cotton', 'White', '["S", "M", "L", "XL"]', '["White", "Blue"]', datetime('now'), datetime('now')),

('prod-014', 'Pant Style Suit', 'pant-style-suit', 'Contemporary pant style suit. Office wear appropriate.', 'cat-salwar', 2800, 2800, 3500, '["https://images.unsplash.com/photo-1583391733953-3750e0ff4e8b?w=800"]', 30, 1, 1, 0, 'brand-002', 'Modern Fashion', 'Cotton Blend', 'Grey', '["S", "M", "L", "XL"]', '["Grey", "Black"]', datetime('now'), datetime('now')),

-- Lehengas
('prod-015', 'Bridal Lehenga', 'bridal-lehenga', 'Heavy work bridal lehenga with dupatta. Perfect for weddings.', 'cat-lehengas', 15000, 15000, 18000, '["https://images.unsplash.com/photo-1610030469679-98e550d6193f?w=800"]', 15, 1, 1, 0, 'brand-004', 'Royal Collection', 'Velvet', 'Red', '["S", "M", "L"]', '["Red", "Maroon"]', datetime('now'), datetime('now')),

('prod-016', 'Designer Lehenga', 'designer-lehenga', 'Contemporary designer lehenga. Fashion-forward design.', 'cat-lehengas', 8500, 8500, 10000, '["https://images.unsplash.com/photo-1610030469678-98e550d6193f?w=800"]', 20, 1, 1, 0, 'brand-007', 'Urban Chic', 'Net', 'Pink', '["S", "M", "L"]', '["Pink", "Peach"]', datetime('now'), datetime('now')),

('prod-017', 'Sharara Lehenga', 'sharara-lehenga', 'Sharara style lehenga with heavy border. Festive wear.', 'cat-lehengas', 7500, 7500, 9000, '["https://images.unsplash.com/photo-1610030469677-98e550d6193f?w=800"]', 25, 1, 0, 0, 'brand-003', 'Elegant Style', 'Silk Blend', 'Teal', '["S", "M", "L"]', '["Teal", "Sea Green"]', datetime('now'), datetime('now')),

('prod-018', 'Ghagra Lehenga', 'ghagra-lehenga', 'Traditional ghagra choli. Classic Indian wear.', 'cat-lehengas', 5500, 5500, 7000, '["https://images.unsplash.com/photo-1610030469676-98e550d6193f?w=800"]', 30, 1, 1, 0, 'brand-006', 'Heritage Wear', 'Cotton', 'Yellow', '["S", "M", "L", "XL"]', '["Yellow", "Orange"]', datetime('now'), datetime('now')),

('prod-019', 'Jacket Lehenga', 'jacket-lehenga', 'Lehenga with long jacket overlay. Modern fusion.', 'cat-lehengas', 12000, 12000, 15000, '["https://images.unsplash.com/photo-1610030469675-98e550d6193f?w=800"]', 18, 1, 1, 0, 'brand-007', 'Urban Chic', 'Velvet', 'Black', '["S", "M", "L"]', '["Black", "Navy"]', datetime('now'), datetime('now')),

-- Kurtas
('prod-020', 'Cotton Kurta', 'cotton-kurta', 'Casual cotton kurta for everyday wear. Comfortable fit.', 'cat-kurtas', 800, 800, 1000, '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"]', 100, 1, 1, 0, 'brand-002', 'Modern Fashion', 'Cotton', 'White', '["S", "M", "L", "XL", "XXL"]', '["White", "Blue", "Grey"]', datetime('now'), datetime('now')),

('prod-021', 'Silk Kurta', 'silk-kurta', 'Elegant silk kurta with minimal work. Party wear.', 'cat-kurtas', 2200, 2200, 2800, '["https://images.unsplash.com/photo-1594938298604-c8148c4dae35?w=800"]', 50, 1, 1, 0, 'brand-008', 'Classic Cut', 'Silk', 'Maroon', '["S", "M", "L", "XL"]', '["Maroon", "Black", "Navy"]', datetime('now'), datetime('now')),

('prod-022', 'Pathani Suit', 'pathani-suit', 'Classic Pathani kurta pajama set. Traditional comfort.', 'cat-kurtas', 1500, 1500, 2000, '["https://images.unsplash.com/photo-1594938298605-c8148c4dae35?w=800"]', 60, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Cotton', 'Black', '["S", "M", "L", "XL", "XXL"]', '["Black", "White", "Grey"]', datetime('now'), datetime('now')),

('prod-023', 'Short Kurta', 'short-kurta', 'Trendy short kurta with print. Modern style.', 'cat-kurtas', 950, 950, 1200, '["https://images.unsplash.com/photo-1594938298606-c8148c4dae35?w=800"]', 80, 1, 0, 0, 'brand-002', 'Modern Fashion', 'Cotton Blend', 'Multi', '["S", "M", "L", "XL"]', '["Multi", "Blue"]', datetime('now'), datetime('now')),

('prod-024', 'Embroidered Kurta', 'embroidered-kurta', 'Kurta with thread embroidery. Festive collection.', 'cat-kurtas', 2800, 2800, 3500, '["https://images.unsplash.com/photo-1594938298607-c8148c4dae35?w=800"]', 45, 1, 1, 0, 'brand-008', 'Classic Cut', 'Cotton Silk', 'Cream', '["S", "M", "L", "XL"]', '["Cream", "White"]', datetime('now'), datetime('now')),

('prod-025', 'Nehru Collar Kurta', 'nehru-collar-kurta', 'Formal kurta with Nehru collar. Perfect for occasions.', 'cat-kurtas', 1800, 1800, 2200, '["https://images.unsplash.com/photo-1594938298608-c8148c4dae35?w=800"]', 55, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Linen', 'Beige', '["S", "M", "L", "XL"]', '["Beige", "White"]', datetime('now'), datetime('now')),

-- Menswear
('prod-026', 'Formal Shirt', 'formal-shirt', 'Premium cotton formal shirt. Office essential.', 'cat-menswear', 1200, 1200, 1500, '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"]', 75, 1, 0, 0, 'brand-003', 'Elegant Style', 'Cotton', 'White', '["S", "M", "L", "XL", "XXL"]', '["White", "Light Blue"]', datetime('now'), datetime('now')),

('prod-027', 'Casual Shirt', 'casual-shirt', 'Relaxed fit casual shirt. Weekend vibes.', 'cat-menswear', 900, 900, 1200, '["https://images.unsplash.com/photo-1596755094515-f87e34085b2c?w=800"]', 80, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Cotton', 'Blue', '["S", "M", "L", "XL", "XXL"]', '["Blue", "Green", "Red"]', datetime('now'), datetime('now')),

('prod-028', 'Polo T-Shirt', 'polo-tshirt', 'Classic polo t-shirt. Versatile style.', 'cat-menswear', 750, 750, 950, '["https://images.unsplash.com/photo-1625910513413-5fc0ec78d0d5?w=800"]', 100, 1, 1, 0, 'brand-002', 'Modern Fashion', 'Cotton Pique', 'Navy', '["S", "M", "L", "XL", "XXL"]', '["Navy", "Black", "White", "Grey"]', datetime('now'), datetime('now')),

('prod-029', 'Blazer', 'blazer', 'Formal blazer for special occasions. Premium quality.', 'cat-menswear', 4500, 4500, 6000, '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"]', 30, 1, 1, 0, 'brand-008', 'Classic Cut', 'Polyester Blend', 'Black', '["S", "M", "L", "XL"]', '["Black", "Navy", "Grey"]', datetime('now'), datetime('now')),

('prod-030', 'Denim Jeans', 'denim-jeans', 'Classic fit denim jeans. Everyday essential.', 'cat-menswear', 1800, 1800, 2200, '["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800"]', 90, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Denim', 'Blue', '["28", "30", "32", "34", "36", "38"]', '["Blue", "Black"]', datetime('now'), datetime('now')),

('prod-031', 'Chinos', 'chinos', 'Comfortable chinos pants. Smart casual wear.', 'cat-menswear', 1500, 1500, 1800, '["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"]', 85, 1, 0, 0, 'brand-007', 'Urban Chic', 'Cotton', 'Beige', '["28", "30", "32", "34", "36"]', '["Beige", "Khaki", "Olive"]', datetime('now'), datetime('now')),

('prod-032', 'Waistcoat', 'waistcoat', 'Formal waistcoat for occasions. Classic style.', 'cat-menswear', 2200, 2200, 2800, '["https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800"]', 40, 1, 1, 0, 'brand-008', 'Classic Cut', 'Silk Blend', 'Maroon', '["S", "M", "L", "XL"]', '["Maroon", "Black", "Gold"]', datetime('now'), datetime('now')),

-- Gowns
('prod-033', 'Evening Gown', 'evening-gown', 'Elegant evening gown for parties. Sophisticated design.', 'cat-gowns', 8000, 8000, 10000, '["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"]', 20, 1, 1, 0, 'brand-004', 'Royal Collection', 'Silk', 'Black', '["S", "M", "L"]', '["Black", "Navy"]', datetime('now'), datetime('now')),

('prod-034', 'Cocktail Dress', 'cocktail-dress', 'Stylish cocktail dress for social events.', 'cat-gowns', 5500, 5500, 7000, '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"]', 25, 1, 1, 0, 'brand-007', 'Urban Chic', 'Georgette', 'Red', '["S", "M", "L", "XL"]', '["Red", "Black", "Emerald"]', datetime('now'), datetime('now')),

('prod-035', 'Maxi Dress', 'maxi-dress', 'Flowy maxi dress for casual outings.', 'cat-gowns', 3200, 3200, 4000, '["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800"]', 35, 1, 0, 0, 'brand-002', 'Modern Fashion', 'Cotton', 'Floral', '["S", "M", "L", "XL"]', '["Floral", "Blue", "Pink"]', datetime('now'), datetime('now')),

('prod-036', 'Party Gown', 'party-gown', 'Glamorous party gown with sequins. Eye-catching design.', 'cat-gowns', 9500, 9500, 12000, '["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"]', 15, 1, 1, 0, 'brand-004', 'Royal Collection', 'Net', 'Gold', '["S", "M", "L"]', '["Gold", "Silver", "Rose Gold"]', datetime('now'), datetime('now')),

('prod-037', 'Summer Dress', 'summer-dress', 'Lightweight summer dress. Beach ready.', 'cat-gowns', 2800, 2800, 3500, '["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800"]', 40, 1, 0, 0, 'brand-002', 'Modern Fashion', 'Rayon', 'Yellow', '["S", "M", "L", "XL", "XXL"]', '["Yellow", "Orange", "White"]', datetime('now'), datetime('now')),

('prod-038', 'Wrap Dress', 'wrap-dress', 'Flattering wrap dress. Versatile style.', 'cat-gowns', 3800, 3800, 4800, '["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"]', 30, 1, 1, 0, 'brand-007', 'Urban Chic', 'Cotton Blend', 'Teal', '["S", "M", "L", "XL"]', '["Teal", "Navy", "Black"]', datetime('now'), datetime('now')),

-- Tops
('prod-039', 'Casual Top', 'casual-top', 'Comfortable casual top. Everyday wear.', 'cat-tops', 600, 600, 800, '["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"]', 80, 1, 0, 0, 'brand-002', 'Modern Fashion', 'Cotton', 'Pink', '["S", "M", "L", "XL"]', '["Pink", "Yellow", "White"]', datetime('now'), datetime('now')),

('prod-040', 'Crop Top', 'crop-top', 'Trendy crop top. Modern fashion.', 'cat-tops', 450, 450, 600, '["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"]', 100, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Cotton', 'Black', '["S", "M", "L", "XL"]', '["Black", "White", "Red"]', datetime('now'), datetime('now')),

('prod-041', 'Peplum Top', 'peplum-top', 'Elegant peplum top. Flattering silhouette.', 'cat-tops', 750, 750, 950, '["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"]', 70, 1, 1, 0, 'brand-007', 'Urban Chic', 'Georgette', 'Navy', '["S", "M", "L", "XL"]', '["Navy", "Maroon", "Green"]', datetime('now'), datetime('now')),

('prod-042', 'Off-Shoulder Top', 'off-shoulder-top', 'Stylish off-shoulder top. Party ready.', 'cat-tops', 850, 850, 1100, '["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"]', 60, 1, 1, 0, 'brand-002', 'Modern Fashion', 'Chiffon', 'Red', '["S", "M", "L", "XL"]', '["Red", "Black", "White"]', datetime('now'), datetime('now')),

('prod-043', 'Tunics Top', 'tunics-top', 'Comfortable tunic top. Versatile style.', 'cat-tops', 650, 650, 850, '["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"]', 90, 1, 0, 0, 'brand-005', 'Trendy Threads', 'Rayon', 'Blue', '["S", "M", "L", "XL", "XXL"]', '["Blue", "Green", "Yellow"]', datetime('now'), datetime('now')),

('prod-044', 'Blouse', 'blouse', 'Classic blouse for formal wear.', 'cat-tops', 950, 950, 1200, '["https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800"]', 65, 1, 1, 0, 'brand-008', 'Classic Cut', 'Cotton', 'White', '["S", "M", "L", "XL"]', '["White", "Light Blue", "Pink"]', datetime('now'), datetime('now')),

-- Accessories
('prod-045', 'Designer Handbag', 'designer-handbag', 'Elegant designer handbag. Premium quality.', 'cat-accessories', 3500, 3500, 4500, '["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"]', 40, 1, 1, 0, 'brand-004', 'Royal Collection', 'Leather', 'Brown', '["One Size"]', '["Brown", "Black", "Tan"]', datetime('now'), datetime('now')),

('prod-046', 'Statement Earrings', 'statement-earrings', 'Eye-catching statement earrings. Party essential.', 'cat-accessories', 850, 850, 1100, '["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800"]', 80, 1, 1, 0, 'brand-007', 'Urban Chic', 'Metal', 'Gold', '["One Size"]', '["Gold", "Silver", "Rose Gold"]', datetime('now'), datetime('now')),

('prod-047', 'Silk Scarf', 'silk-scarf', 'Luxurious silk scarf. Elegant accessory.', 'cat-accessories', 650, 650, 850, '["https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800"]', 100, 1, 0, 0, 'brand-001', 'Luxury Sarees', 'Silk', 'Multi', '["One Size"]', '["Multi", "Solid"]', datetime('now'), datetime('now')),

('prod-048', 'Leather Belt', 'leather-belt', 'Classic leather belt. Essential accessory.', 'cat-accessories', 450, 450, 600, '["https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800"]', 120, 1, 0, 0, 'brand-008', 'Classic Cut', 'Leather', 'Black', '["S", "M", "L"]', '["Black", "Brown"]', datetime('now'), datetime('now')),

('prod-049', 'Clutch Bag', 'clutch-bag', 'Stylish clutch bag for parties.', 'cat-accessories', 1200, 1200, 1500, '["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800"]', 50, 1, 1, 0, 'brand-004', 'Royal Collection', 'Velvet', 'Red', '["One Size"]', '["Red", "Black", "Gold"]', datetime('now'), datetime('now')),

('prod-050', 'Bangles Set', 'bangles-set', 'Traditional bangles set. Complete ethnic look.', 'cat-accessories', 550, 550, 700, '["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800"]', 90, 1, 0, 0, 'brand-006', 'Heritage Wear', 'Metal', 'Gold', '["One Size"]', '["Gold", "Silver"]', datetime('now'), datetime('now')),

('prod-051', 'Necklace', 'necklace', 'Elegant necklace for special occasions.', 'cat-accessories', 1800, 1800, 2200, '["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"]', 55, 1, 1, 0, 'brand-004', 'Royal Collection', 'Gold Plated', 'Gold', '["One Size"]', '["Gold", "Rose Gold"]', datetime('now'), datetime('now')),

('prod-052', 'Sunglasses', 'sunglasses', 'Stylish sunglasses. UV protection.', 'cat-accessories', 950, 950, 1200, '["https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800"]', 70, 1, 0, 0, 'brand-007', 'Urban Chic', 'Plastic', 'Black', '["One Size"]', '["Black", "Brown", "Tortoise"]', datetime('now'), datetime('now'));

-- Insert Sample Product Variants for key products
INSERT OR REPLACE INTO product_variants (id, productId, sku, name, price, stock, size, color, isActive, isDefault, costPrice, createdAt, updatedAt) VALUES
-- Saree Variants
('var-001-1', 'prod-001', 'SAREE-BLUE-6M', 'Silk Saree - 6m', 3500, 25, '6m', 'Blue', 1, 1, 2500, datetime('now'), datetime('now')),
('var-001-2', 'prod-001', 'SAREE-BLUE-6.5M', 'Silk Saree - 6.5m', 3600, 25, '6.5m', 'Blue', 1, 0, 2600, datetime('now'), datetime('now')),
-- Salwar Suit Variants
('var-009-1', 'prod-009', 'SALWAR-GREEN-S', 'Cotton Salwar - Small', 1800, 10, 'S', 'Green', 1, 0, 1200, datetime('now'), datetime('now')),
('var-009-2', 'prod-009', 'SALWAR-GREEN-M', 'Cotton Salwar - Medium', 1800, 10, 'M', 'Green', 1, 1, 1200, datetime('now'), datetime('now')),
('var-009-3', 'prod-009', 'SALWAR-GREEN-L', 'Cotton Salwar - Large', 1800, 10, 'L', 'Green', 1, 0, 1200, datetime('now'), datetime('now')),
('var-009-4', 'prod-009', 'SALWAR-PINK-S', 'Cotton Salwar - Pink Small', 1800, 8, 'S', 'Pink', 1, 0, 1200, datetime('now'), datetime('now')),
('var-009-5', 'prod-009', 'SALWAR-PINK-M', 'Cotton Salwar - Pink Medium', 1800, 8, 'M', 'Pink', 1, 0, 1200, datetime('now'), datetime('now')),
-- Lehenga Variants
('var-015-1', 'prod-015', 'LEHENGA-RED-S', 'Bridal Lehenga - Small', 15000, 5, 'S', 'Red', 1, 0, 10000, datetime('now'), datetime('now')),
('var-015-2', 'prod-015', 'LEHENGA-RED-M', 'Bridal Lehenga - Medium', 15000, 5, 'M', 'Red', 1, 1, 10000, datetime('now'), datetime('now')),
('var-015-3', 'prod-015', 'LEHENGA-RED-L', 'Bridal Lehenga - Large', 15000, 5, 'L', 'Red', 1, 0, 10000, datetime('now'), datetime('now')),
('var-015-4', 'prod-015', 'LEHENGA-MAROON-M', 'Bridal Lehenga - Maroon Medium', 15000, 5, 'M', 'Maroon', 1, 0, 10000, datetime('now'), datetime('now')),
-- Kurta Variants
('var-020-1', 'prod-020', 'KURTA-WHITE-S', 'Cotton Kurta - White Small', 800, 20, 'S', 'White', 1, 0, 500, datetime('now'), datetime('now')),
('var-020-2', 'prod-020', 'KURTA-WHITE-M', 'Cotton Kurta - White Medium', 800, 20, 'M', 'White', 1, 1, 500, datetime('now'), datetime('now')),
('var-020-3', 'prod-020', 'KURTA-WHITE-L', 'Cotton Kurta - White Large', 800, 20, 'L', 'White', 1, 0, 500, datetime('now'), datetime('now')),
('var-020-4', 'prod-020', 'KURTA-BLUE-M', 'Cotton Kurta - Blue Medium', 800, 18, 'M', 'Blue', 1, 0, 500, datetime('now'), datetime('now')),
('var-020-5', 'prod-020', 'KURTA-GREY-L', 'Cotton Kurta - Grey Large', 800, 18, 'L', 'Grey', 1, 0, 500, datetime('now'), datetime('now')),
-- Menswear Variants
('var-026-1', 'prod-026', 'SHIRT-WHITE-S', 'Formal Shirt - White Small', 1200, 15, 'S', 'White', 1, 0, 700, datetime('now'), datetime('now')),
('var-026-2', 'prod-026', 'SHIRT-WHITE-M', 'Formal Shirt - White Medium', 1200, 15, 'M', 'White', 1, 1, 700, datetime('now'), datetime('now')),
('var-026-3', 'prod-026', 'SHIRT-WHITE-L', 'Formal Shirt - White Large', 1200, 15, 'L', 'White', 1, 0, 700, datetime('now'), datetime('now')),
('var-026-4', 'prod-026', 'SHIRT-LBLUE-M', 'Formal Shirt - Light Blue Medium', 1200, 15, 'M', 'Light Blue', 1, 0, 700, datetime('now'), datetime('now')),
('var-026-5', 'prod-026', 'SHIRT-WHITE-XL', 'Formal Shirt - White XL', 1200, 15, 'XL', 'White', 1, 0, 700, datetime('now'), datetime('now')),
-- Jeans Variants
('var-030-1', 'prod-030', 'JEANS-BLUE-30', 'Denim Jeans - 30 inch', 1800, 15, '30', 'Blue', 1, 0, 1000, datetime('now'), datetime('now')),
('var-030-2', 'prod-030', 'JEANS-BLUE-32', 'Denim Jeans - 32 inch', 1800, 15, '32', 'Blue', 1, 1, 1000, datetime('now'), datetime('now')),
('var-030-3', 'prod-030', 'JEANS-BLUE-34', 'Denim Jeans - 34 inch', 1800, 15, '34', 'Blue', 1, 0, 1000, datetime('now'), datetime('now')),
('var-030-4', 'prod-030', 'JEANS-BLUE-36', 'Denim Jeans - 36 inch', 1800, 15, '36', 'Blue', 1, 0, 1000, datetime('now'), datetime('now')),
('var-030-5', 'prod-030', 'JEANS-BLACK-32', 'Denim Jeans - Black 32', 1800, 15, '32', 'Black', 1, 0, 1000, datetime('now'), datetime('now')),
-- Top Variants
('var-039-1', 'prod-039', 'TOP-PINK-S', 'Casual Top - Pink Small', 600, 20, 'S', 'Pink', 1, 0, 350, datetime('now'), datetime('now')),
('var-039-2', 'prod-039', 'TOP-PINK-M', 'Casual Top - Pink Medium', 600, 20, 'M', 'Pink', 1, 1, 350, datetime('now'), datetime('now')),
('var-039-3', 'prod-039', 'TOP-PINK-L', 'Casual Top - Pink Large', 600, 20, 'L', 'Pink', 1, 0, 350, datetime('now'), datetime('now')),
('var-039-4', 'prod-039', 'TOP-YELLOW-M', 'Casual Top - Yellow Medium', 600, 18, 'M', 'Yellow', 1, 0, 350, datetime('now'), datetime('now')),
('var-039-5', 'prod-039', 'TOP-WHITE-L', 'Casual Top - White Large', 600, 18, 'L', 'White', 1, 0, 350, datetime('now'), datetime('now'));

-- Insert Banners
INSERT OR REPLACE INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, `order`, createdAt, updatedAt) VALUES
('banner-001', 'New Collection', 'Explore our latest arrivals', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', 'Shop Now', '/shop', 1, 1, datetime('now'), datetime('now')),
('banner-002', 'Special Offers', 'Up to 50% off on selected items', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'View Deals', '/shop?sale=true', 1, 2, datetime('now'), datetime('now')),
('banner-003', 'Free Shipping', 'Free shipping on orders over ৳5000', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', 'Learn More', '/shipping', 1, 3, datetime('now'), datetime('now'));

-- Insert Reels
INSERT OR REPLACE INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, `order`, createdAt, updatedAt) VALUES
('reel-001', 'Summer Collection', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', 'https://example.com/reel-1.mp4', '["prod-001", "prod-009", "prod-020"]', 1, 1, datetime('now'), datetime('now')),
('reel-002', 'Bridal Special', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', 'https://example.com/reel-2.mp4', '["prod-015", "prod-016", "prod-019"]', 1, 2, datetime('now'), datetime('now')),
('reel-003', 'Casual Wear', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', 'https://example.com/reel-3.mp4', '["prod-020", "prod-026", "prod-030"]', 1, 3, datetime('now'), datetime('now')),
('reel-004', 'Festival Season', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', 'https://example.com/reel-4.mp4', '["prod-002", "prod-010", "prod-012"]', 1, 4, datetime('now'), datetime('now')),
('reel-005', 'Accessories', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', 'https://example.com/reel-5.mp4', '["prod-045", "prod-046", "prod-051"]', 1, 5, datetime('now'), datetime('now'));

-- Insert Stories
INSERT OR REPLACE INTO stories (id, title, thumbnail, images, isActive, `order`, createdAt, updatedAt) VALUES
('story-001', 'New Arrivals', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', '["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"]', 1, 1, datetime('now'), datetime('now')),
('story-002', 'Trending Now', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', '["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"]', 1, 2, datetime('now'), datetime('now')),
('story-003', 'Best Sellers', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', '["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"]', 1, 3, datetime('now'), datetime('now')),
('story-004', 'Saree Collection', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600", "https://images.unsplash.com/photo-1610030469668-98e550d6193d?w=600"]', 1, 4, datetime('now'), datetime('now')),
('story-005', 'Menswear', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600", "https://images.unsplash.com/photo-1625910513413-5fc0ec78d0d5?w=600"]', 1, 5, datetime('now'), datetime('now'));

-- Insert Homepage Settings
INSERT OR REPLACE INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, createdAt, updatedAt) VALUES
('hero-enabled', 'hero', 1, 5000, 5, NULL, datetime('now'), datetime('now')),
('brands-enabled', 'brands', 1, 5000, 10, '{"brandIds": ["brand-001", "brand-002", "brand-003", "brand-004", "brand-005", "brand-006", "brand-007", "brand-008"], "autoScroll": true, "scrollInterval": 4000, "heading": "Featured Brands", "description": "Discover top brands in our collection"}', datetime('now'), datetime('now')),
('featured-products-enabled', 'featured_products', 1, 3000, 10, '{"productIds": [], "heading": "Featured Products", "description": "Discover our handpicked selection of top products"}', datetime('now'), datetime('now')),
('reels-enabled', 'reels', 1, 3000, 10, NULL, datetime('now'), datetime('now')),
('category-carousel-enabled', 'category-carousel', 1, 4000, 8, '{"categoryIds": [], "heading": "Shop by Category", "description": "Explore our wide range of categories"}', datetime('now'), datetime('now')),
('stories-enabled', 'stories', 1, 4000, 5, NULL, datetime('now'), datetime('now')),
('marquee-enabled', 'marquee', 1, 0, 1, '{"text": "", "heading": "Special Offers", "description": "Don''t miss out on our amazing deals"}', datetime('now'), datetime('now')),
('mosaic-grid-enabled', 'mosaic_grid', 1, 0, 6, '{"productIds": [], "heading": "Shop the Look", "description": "Explore our curated collection of trending styles"}', datetime('now'), datetime('now')),
('fullscreen-video-enabled', 'fullscreen-video', 1, 0, NULL, '{"videoUrl": "", "heading": "Featured Video", "description": "Experience our exclusive video content"}', datetime('now'), datetime('now')),
('section-manager-enabled', 'section-manager', 1, 0, NULL, '{"sections": [{"id": "fullscreen-video", "name": "Fullscreen Video", "order": 1, "enabled": true}, {"id": "hero-slider", "name": "Hero Carousel", "order": 2, "enabled": true}, {"id": "marquee", "name": "Marquee Banner", "order": 3, "enabled": true}, {"id": "categories", "name": "Categories", "order": 4, "enabled": true}, {"id": "category-carousel", "name": "Category Carousel", "order": 5, "enabled": true}, {"id": "brands", "name": "Brand Carousel", "order": 6, "enabled": true}, {"id": "featured-products", "name": "Featured Products", "order": 7, "enabled": true}, {"id": "mosaic-grid", "name": "Mosaic Grid", "order": 8, "enabled": true}, {"id": "video-reels", "name": "Video Reels", "order": 9, "enabled": true}, {"id": "promotions", "name": "Promotions", "order": 10, "enabled": true}, {"id": "stories", "name": "Stories", "order": 11, "enabled": true}]}', datetime('now'), datetime('now'));

-- Insert Promotions
INSERT OR REPLACE INTO promotions (id, title, description, image, ctaText, ctaLink, promoCode, discountType, discountValue, minOrderAmount, isActive, `order`, createdAt, updatedAt) VALUES
('promo-001', 'First Order Discount', 'Get 10% off on your first order', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', 'Use Code FIRST10', '/shop', 'FIRST10', 'percentage', 10, 1000, 1, 1, datetime('now'), datetime('now')),
('promo-002', 'Summer Sale', 'Flat ৳500 off on orders above ৳3000', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', 'Use Code SUMMER500', '/shop', 'SUMMER500', 'fixed', 500, 3000, 1, 2, datetime('now'), datetime('now')),
('promo-003', 'Festival Special', 'Extra 15% off on ethnic wear', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', 'Shop Festival Collection', '/shop?category=saree', 'FESTIVAL15', 'percentage', 15, 2000, 1, 3, datetime('now'), datetime('now'));

-- Insert Page SEO
INSERT OR REPLACE INTO page_seo (id, pagePath, pageTitle, metaTitle, metaDescription, keywords, ogTitle, ogDescription, isActive, createdAt, updatedAt) VALUES
('seo-home', '/', 'SCommerce - Your Fashion Destination', 'SCommerce - Best Ethnic Wear Collection', 'Shop the latest collection of sarees, salwar suits, lehengas, kurtas, and more at SCommerce. Free shipping on orders over ৳5000.', 'sarees, salwar suits, lehengas, kurtas, ethnic wear, fashion, online shopping, Bangladesh', 'SCommerce - Premium Ethnic Wear', 'Discover premium ethnic wear at SCommerce. Quality fashion at best prices.', 1, datetime('now'), datetime('now')),
('seo-shop', '/shop', 'Shop - SCommerce', 'Shop All Products - SCommerce', 'Browse our complete collection of ethnic wear and fashion items for men and women.', 'shop, products, online shopping, fashion store', 'Shop Fashion at SCommerce', 'Find your perfect style from our extensive collection.', 1, datetime('now'), datetime('now')),
('seo-about', '/about', 'About Us - SCommerce', 'About SCommerce', 'Learn about SCommerce and our commitment to quality fashion and customer satisfaction.', 'about us, company, fashion, ecommerce', 'About SCommerce', 'Your trusted destination for premium ethnic wear and fashion.', 1, datetime('now'), datetime('now')),
('seo-contact', '/contact', 'Contact Us - SCommerce', 'Contact SCommerce', 'Get in touch with us for any queries, support, or feedback.', 'contact, support, help, customer service', 'Contact SCommerce', 'We are here to help. Reach out to us anytime.', 1, datetime('now'), datetime('now'));

-- Insert Default Suppliers
INSERT OR REPLACE INTO suppliers (id, code, name, email, phone, city, country, isActive, createdAt, updatedAt) VALUES
('sup-001', 'SUP001', 'Fashion Hub Ltd', 'contact@fashionhub.com', '+8801700000001', 'Dhaka', 'Bangladesh', 1, datetime('now'), datetime('now')),
('sup-002', 'SUP002', 'Textile World', 'info@textileworld.com', '+8801700000002', 'Chittagong', 'Bangladesh', 1, datetime('now'), datetime('now')),
('sup-003', 'SUP003', 'Premium Fabrics', 'sales@premiumfabrics.com', '+8801700000003', 'Dhaka', 'Bangladesh', 1, datetime('now'), datetime('now')),
('sup-004', 'SUP004', 'Silk Mills', 'orders@silkmills.com', '+919876543210', 'Varanasi', 'India', 1, datetime('now'), datetime('now')),
('sup-005', 'SUP005', 'Cotton Exports', 'trade@cottonexports.com', '+919876543211', 'Mumbai', 'India', 1, datetime('now'), datetime('now'));

-- Insert Default Email Service
INSERT OR REPLACE INTO email_services (id, name, provider, fromEmail, fromName, isActive, isDefault, createdAt, updatedAt) VALUES
('email-default', 'Default SMTP', 'custom', 'noreply@scommerce.com', 'SCommerce', 1, 1, datetime('now'), datetime('now'));

-- Insert Default Payment Gateway
INSERT OR REPLACE INTO payment_gateways (id, name, provider, isActive, isDefault, createdAt, updatedAt) VALUES
('payment-cod', 'Cash on Delivery', 'custom', 1, 1, datetime('now'), datetime('now'));

-- Insert Default Shipping Carrier
INSERT OR REPLACE INTO shipping_carriers (id, name, provider, isActive, isDefault, createdAt, updatedAt) VALUES
('shipping-default', 'Standard Delivery', 'custom', 1, 1, datetime('now'), datetime('now'));

-- Insert Sample Orders
INSERT OR REPLACE INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone, shippingAddress, billingAddress, city, district, division, subtotal, shipping, tax, discount, total, status, paymentStatus, paymentMethod, createdAt, updatedAt) VALUES
('order-001', 'ORD-2024001', 'user-001', 'Demo User', 'user@scommerce.com', '+8801800000000', 'House 123, Road 5, Dhanmondi', 'House 123, Road 5, Dhanmondi', 'Dhaka', 'Dhaka', 'Dhaka', 4500, 150, 810, 0, 5460, 'DELIVERED', 'PAID', 'COD', datetime('now', '-5 days'), datetime('now')),
('order-002', 'ORD-2024002', 'user-001', 'Demo User', 'user@scommerce.com', '+8801800000000', 'House 123, Road 5, Dhanmondi', 'House 123, Road 5, Dhanmondi', 'Dhaka', 'Dhaka', 'Dhaka', 2800, 150, 504, 280, 3174, 'PROCESSING', 'PENDING', 'COD', datetime('now', '-1 day'), datetime('now'));

-- Insert Sample Order Items
INSERT OR REPLACE INTO order_items (id, orderId, productId, variantId, quantity, price, productName, productImage, variantSku, variantSize, variantColor, createdAt) VALUES
('order-item-001', 'order-001', 'prod-001', 'var-001-1', 1, 3500, 'Silk Saree - Royal Blue', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"]', 'SAREE-BLUE-6M', '6m', 'Blue', datetime('now')),
('order-item-002', 'order-001', 'prod-009', 'var-009-2', 1, 1000, 'Cotton Salwar Suit', '["https://images.unsplash.com/photo-1583391733958-3750e0ff4e8b?w=800"]', 'SALWAR-GREEN-M', 'M', 'Green', datetime('now')),
('order-item-003', 'order-002', 'prod-020', 'var-020-2', 2, 800, 'Cotton Kurta', '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"]', 'KURTA-WHITE-M', 'M', 'White', datetime('now')),
('order-item-004', 'order-002', 'prod-026', 'var-026-2', 1, 1200, 'Formal Shirt', '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"]', 'SHIRT-WHITE-M', 'M', 'White', datetime('now'));

-- Insert Sample Reviews
INSERT OR REPLACE INTO product_reviews (id, productId, userId, userName, rating, title, comment, isVerified, isApproved, createdAt, updatedAt) VALUES
('review-001', 'prod-001', 'user-001', 'Demo User', 5, 'Beautiful saree!', 'The silk saree exceeded my expectations. The quality is amazing and it looks even better in person.', 1, 1, datetime('now', '-3 days'), datetime('now')),
('review-002', 'prod-009', 'user-001', 'Demo User', 4, 'Comfortable and stylish', 'Great salwar suit for daily wear. Comfortable fabric and nice embroidery work.', 1, 1, datetime('now', '-3 days'), datetime('now')),
('review-003', 'prod-020', 'user-001', 'Demo User', 5, 'Perfect fit', 'The kurta fits perfectly and the fabric is very comfortable. Will buy again!', 1, 1, datetime('now', '-2 days'), datetime('now')),
('review-004', 'prod-015', 'user-001', 'Demo User', 5, 'Stunning bridal lehenga', 'Absolutely beautiful lehenga! The embroidery work is intricate and the color is rich.', 1, 1, datetime('now', '-1 day'), datetime('now'));