-- ================================================
-- SCommerce - Comprehensive Seed Data
-- ================================================

-- Clear existing data (in correct order respecting foreign keys)
DELETE FROM inventory_reservations;
DELETE FROM email_services;
DELETE FROM analytics_integrations;
DELETE FROM shipping_carriers;
DELETE FROM payment_gateways;
DELETE FROM site_settings;
DELETE FROM homepage_settings;
DELETE FROM promotions;
DELETE FROM image_gallery;
DELETE FROM reels;
DELETE FROM stories;
DELETE FROM banners;
DELETE FROM posts;
DELETE FROM admin_logs;
DELETE FROM inventory_alerts;
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

-- ================================================
-- USERS
-- ================================================
INSERT INTO users (id, email, name, phone, address, password, emailVerified, role, avatar, isBanned, lastLoginAt, createdAt, updatedAt) VALUES
('admin-001', 'admin@scommerce.com', 'Admin User', '+8801700000001', 'Dhaka, Bangladesh', '$2b$10$X7...hashed_password...', 1, 'admin', '/uploads/avatars/admin.jpg', 0, '2025-01-11T10:00:00.000Z', '2024-01-01T00:00:00.000Z', '2025-01-11T10:00:00.000Z'),
('user-001', 'rahul@example.com', 'Rahul Sharma', '+8801700000002', 'Gulshan, Dhaka', '$2b$10$X7...hashed_password...', 1, 'user', '/uploads/avatars/rahul.jpg', 0, '2025-01-10T15:30:00.000Z', '2024-01-05T00:00:00.000Z', '2025-01-10T15:30:00.000Z'),
('user-002', 'priya@example.com', 'Priya Das', '+8801800000001', 'Banani, Dhaka', '$2b$10$X7...hashed_password...', 1, 'user', '/uploads/avatars/priya.jpg', 0, '2025-01-09T09:00:00.000Z', '2024-01-10T00:00:00.000Z', '2025-01-09T09:00:00.000Z'),
('user-003', 'arif@example.com', 'Arif Rahman', '+8801900000001', 'Dhanmondi, Dhaka', '$2b$10$X7...hashed_password...', 1, 'user', '/uploads/avatars/arif.jpg', 0, '2025-01-08T18:20:00.000Z', '2024-01-15T00:00:00.000Z', '2025-01-08T18:20:00.000Z'),
('user-004', 'fatima@example.com', 'Fatima Ali', '+8801600000001', 'Uttara, Dhaka', '$2b$10$X7...hashed_password...', 1, 'user', '/uploads/avatars/fatima.jpg', 0, '2025-01-07T11:45:00.000Z', '2024-01-20T00:00:00.000Z', '2025-01-07T11:45:00.000Z'),
('user-005', 'kamal@example.com', 'Kamal Hassan', '+8801500000001', 'Mirpur, Dhaka', '$2b$10$X7...hashed_password...', 1, 'user', '/uploads/avatars/kamal.jpg', 0, '2025-01-06T14:15:00.000Z', '2024-01-25T00:00:00.000Z', '2025-01-06T14:15:00.000Z');

-- ================================================
-- ADDRESSES
-- ================================================
INSERT INTO addresses (id, userId, fullName, phone, addressLine1, addressLine2, city, district, division, postalCode, isDefault, createdAt, updatedAt) VALUES
('addr-001', 'user-001', 'Rahul Sharma', '+8801700000002', 'House 12, Road 5', 'Sector 10', 'Gulshan', 'Gulshan', 'Dhaka', '1212', 1, '2024-01-05T00:00:00.000Z', '2024-01-05T00:00:00.000Z'),
('addr-002', 'user-001', 'Rahul Sharma', '+8801700000002', 'Flat 4B, Building 9', 'Block B', 'Banani', 'Banani', 'Dhaka', '1213', 0, '2024-01-10T00:00:00.000Z', '2024-01-10T00:00:00.000Z'),
('addr-003', 'user-002', 'Priya Das', '+8801800000001', 'House 45, Road 11', 'Sector 6', 'Banani', 'Banani', 'Dhaka', '1213', 1, '2024-01-10T00:00:00.000Z', '2024-01-10T00:00:00.000Z'),
('addr-004', 'user-003', 'Arif Rahman', '+8801900000001', 'Flat A/2, Building 3', 'Road 27', 'Dhanmondi', 'Dhanmondi', 'Dhaka', '1205', 1, '2024-01-15T00:00:00.000Z', '2024-01-15T00:00:00.000Z'),
('addr-005', 'user-004', 'Fatima Ali', '+8801600000001', 'House 8, Road 2', 'Sector 7', 'Uttara', 'Uttara', 'Dhaka', '1230', 1, '2024-01-20T00:00:00.000Z', '2024-01-20T00:00:00.000Z');

-- ================================================
-- CATEGORIES
-- ================================================
INSERT INTO categories (id, name, slug, description, image, isActive, createdAt, updatedAt) VALUES
('cat-001', 'Men''s Fashion', 'mens-fashion', 'Latest collection for men', '/uploads/categories/men.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-002', 'Women''s Fashion', 'womens-fashion', 'Trendy styles for women', '/uploads/categories/women.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-003', 'Electronics', 'electronics', 'Smart devices and accessories', '/uploads/categories/electronics.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-004', 'Home & Living', 'home-living', 'Decor and essentials for your home', '/uploads/categories/home.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-005', 'Sports & Fitness', 'sports-fitness', 'Equipment and activewear', '/uploads/categories/sports.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-006', 'Accessories', 'accessories', 'Watches, bags, and more', '/uploads/categories/accessories.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-007', 'Beauty & Personal Care', 'beauty-care', 'Skincare and cosmetics', '/uploads/categories/beauty.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('cat-008', 'Kids & Baby', 'kids-baby', 'Clothing and toys for kids', '/uploads/categories/kids.jpg', 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- PRODUCTS
-- ================================================
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, discount, discountType, images, stock, lowStockAlert, reorderLevel, reorderQty, isActive, isFeatured, hasVariants, weight, dimensions, tags, createdAt, updatedAt) VALUES
-- Men's Fashion
('prod-001', 'Premium Cotton T-Shirt', 'premium-cotton-tshirt', 'Soft, breathable 100% organic cotton t-shirt', 'cat-001', 1200, 1500, 1800, 20, 'percentage', '["/uploads/products/tshirt-1.jpg","/uploads/products/tshirt-2.jpg"]', 50, 10, 5, 20, 1, 1, 0, 0.2, 'M,L,XL', 'cotton,basic,essential', '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z'),
('prod-002', 'Slim Fit Jeans', 'slim-fit-jeans', 'Classic slim fit jeans with stretch comfort', 'cat-001', 2500, 2500, 3000, 17, 'percentage', '["/uploads/products/jeans-1.jpg","/uploads/products/jeans-2.jpg"]', 35, 10, 5, 20, 1, 1, 0, 0.6, '30,32,34,36', 'jeans,denim,casual', '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z'),
('prod-003', 'Classic Polo Shirt', 'classic-polo-shirt', 'Timeless polo shirt for any occasion', 'cat-001', 1800, 1800, NULL, 0, 'percentage', '["/uploads/products/polo-1.jpg","/uploads/products/polo-2.jpg"]', 45, 10, 5, 20, 1, 0, 0, 0.25, 'S,M,L,XL,XXL', 'polo,casual,formal', '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z'),

-- Women's Fashion
('prod-004', 'Floral Summer Dress', 'floral-summer-dress', 'Light and comfortable summer dress with beautiful floral print', 'cat-002', 3200, 4000, 4500, 20, 'percentage', '["/uploads/products/dress-1.jpg","/uploads/products/dress-2.jpg"]', 30, 10, 5, 20, 1, 1, 0, 0.3, 'S,M,L', 'dress,summer,floral', '2024-01-03T00:00:00.000Z', '2024-01-03T00:00:00.000Z'),
('prod-005', 'Elegant Blouse', 'elegant-blouse', 'Sophisticated blouse perfect for office or casual wear', 'cat-002', 2100, 2100, NULL, 0, 'percentage', '["/uploads/products/blouse-1.jpg","/uploads/products/blouse-2.jpg"]', 40, 10, 5, 20, 1, 0, 0, 0.2, 'S,M,L,XL', 'blouse,formal,office', '2024-01-03T00:00:00.000Z', '2024-01-03T00:00:00.000Z'),
('prod-006', 'Designer Handbag', 'designer-handbag', 'Stylish and spacious handbag for everyday use', 'cat-002', 5500, 5500, 7000, 0, 'percentage', '["/uploads/products/handbag-1.jpg","/uploads/products/handbag-2.jpg"]', 20, 10, 5, 15, 1, 1, 0, 0.8, NULL, 'handbag,designer,luxury', '2024-01-03T00:00:00.000Z', '2024-01-03T00:00:00.000Z'),

-- Electronics
('prod-007', 'Wireless Earbuds Pro', 'wireless-earbuds-pro', 'Premium noise-cancelling earbuds with 30h battery', 'cat-003', 4500, 4500, 6000, 0, 'percentage', '["/uploads/products/earbuds-1.jpg","/uploads/products/earbuds-2.jpg"]', 60, 10, 5, 20, 1, 1, 0, 0.05, NULL, 'audio,wireless,tech', '2024-01-04T00:00:00.000Z', '2024-01-04T00:00:00.000Z'),
('prod-008', 'Smart Fitness Watch', 'smart-fitness-watch', 'Track your health and fitness with this smart watch', 'cat-003', 8500, 10000, 12000, 15, 'percentage', '["/uploads/products/watch-1.jpg","/uploads/products/watch-2.jpg"]', 25, 10, 5, 15, 1, 1, 0, 0.1, NULL, 'watch,fitness,smart', '2024-01-04T00:00:00.000Z', '2024-01-04T00:00:00.000Z'),
('prod-009', 'Portable Power Bank', 'portable-power-bank', '20000mAh fast charging power bank', 'cat-003', 1800, 2000, 2500, 10, 'percentage', '["/uploads/products/powerbank-1.jpg","/uploads/products/powerbank-2.jpg"]', 80, 15, 10, 30, 1, 0, 0, 0.4, NULL, 'powerbank,charging,tech', '2024-01-04T00:00:00.000Z', '2024-01-04T00:00:00.000Z'),

-- Home & Living
('prod-010', 'Modern Table Lamp', 'modern-table-lamp', 'Minimalist table lamp with LED lighting', 'cat-004', 2200, 2200, NULL, 0, 'percentage', '["/uploads/products/lamp-1.jpg","/uploads/products/lamp-2.jpg"]', 40, 10, 5, 20, 1, 0, 0, 1.2, NULL, 'lamp,decor,lighting', '2024-01-05T00:00:00.000Z', '2024-01-05T00:00:00.000Z'),
('prod-011', 'Cozy Throw Blanket', 'cozy-throw-blanket', 'Ultra-soft microfiber throw blanket', 'cat-004', 1500, 1500, 2000, 0, 'percentage', '["/uploads/products/blanket-1.jpg","/uploads/products/blanket-2.jpg"]', 55, 10, 5, 20, 1, 0, 0, 0.8, NULL, 'blanket,home,cozy', '2024-01-05T00:00:00.000Z', '2024-01-05T00:00:00.000Z'),
('prod-012', 'Decorative Cushion Set', 'decorative-cushion-set', 'Set of 2 beautiful decorative cushions', 'cat-004', 1800, 2000, 2500, 10, 'percentage', '["/uploads/products/cushion-1.jpg","/uploads/products/cushion-2.jpg"]', 45, 10, 5, 20, 1, 1, 0, 0.5, NULL, 'cushion,decor,home', '2024-01-05T00:00:00.000Z', '2024-01-05T00:00:00.000Z'),

-- Sports & Fitness
('prod-013', 'Yoga Mat Premium', 'yoga-mat-premium', 'Non-slip eco-friendly yoga mat', 'cat-005', 1200, 1200, 1500, 0, 'percentage', '["/uploads/products/yoga-1.jpg","/uploads/products/yoga-2.jpg"]', 70, 10, 5, 20, 1, 0, 0, 1.5, NULL, 'yoga,fitness,sports', '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),
('prod-014', 'Resistance Bands Set', 'resistance-bands-set', 'Set of 5 resistance bands for workout', 'cat-005', 800, 800, 1000, 0, 'percentage', '["/uploads/products/bands-1.jpg","/uploads/products/bands-2.jpg"]', 90, 15, 10, 30, 1, 0, 0, 0.3, NULL, 'fitness,bands,workout', '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),
('prod-015', 'Running Shoes', 'running-shoes', 'Lightweight and comfortable running shoes', 'cat-005', 4500, 5000, 6000, 10, 'percentage', '["/uploads/products/runshoes-1.jpg","/uploads/products/runshoes-2.jpg"]', 35, 10, 5, 20, 1, 1, 1, 0.6, '40,41,42,43,44', 'shoes,running,sports', '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),

-- Accessories
('prod-016', 'Analog Watch Classic', 'analog-watch-classic', 'Elegant analog watch with leather strap', 'cat-006', 3800, 3800, 4500, 0, 'percentage', '["/uploads/products/analog-watch-1.jpg","/uploads/products/analog-watch-2.jpg"]', 25, 10, 5, 15, 1, 1, 0, 0.1, NULL, 'watch,classic,analog', '2024-01-07T00:00:00.000Z', '2024-01-07T00:00:00.000Z'),
('prod-017', 'Leather Wallet', 'leather-wallet', 'Premium genuine leather wallet', 'cat-006', 1500, 1500, 2000, 0, 'percentage', '["/uploads/products/wallet-1.jpg","/uploads/products/wallet-2.jpg"]', 50, 10, 5, 20, 1, 0, 0, 0.15, NULL, 'wallet,leather,men', '2024-01-07T00:00:00.000Z', '2024-01-07T00:00:00.000Z'),
('prod-018', 'Designer Sunglasses', 'designer-sunglasses', 'UV protection designer sunglasses', 'cat-006', 2800, 3500, 4000, 20, 'percentage', '["/uploads/products/sunglasses-1.jpg","/uploads/products/sunglasses-2.jpg"]', 40, 10, 5, 20, 1, 1, 0, 0.05, NULL, 'sunglasses,designer,fashion', '2024-01-07T00:00:00.000Z', '2024-01-07T00:00:00.000Z'),

-- Beauty & Personal Care
('prod-019', 'Natural Face Serum', 'natural-face-serum', 'Vitamin C infused face serum for glowing skin', 'cat-007', 1800, 2000, 2500, 10, 'percentage', '["/uploads/products/serum-1.jpg","/uploads/products/serum-2.jpg"]', 60, 10, 5, 20, 1, 0, 0, 0.1, NULL, 'serum,skincare,beauty', '2024-01-08T00:00:00.000Z', '2024-01-08T00:00:00.000Z'),
('prod-020', 'Luxury Perfume Set', 'luxury-perfume-set', 'Set of 3 premium perfumes', 'cat-007', 6500, 6500, 8500, 0, 'percentage', '["/uploads/products/perfume-1.jpg","/uploads/products/perfume-2.jpg"]', 30, 10, 5, 15, 1, 1, 0, 0.4, NULL, 'perfume,luxury,beauty', '2024-01-08T00:00:00.000Z', '2024-01-08T00:00:00.000Z'),

-- Kids & Baby
('prod-021', 'Kids Cartoon T-Shirt', 'kids-cartoon-tshirt', 'Colorful t-shirt with cartoon print', 'cat-008', 700, 800, 1000, 13, 'percentage', '["/uploads/products/kids-tshirt-1.jpg","/uploads/products/kids-tshirt-2.jpg"]', 80, 15, 10, 30, 1, 0, 0, 0.1, '2-3Y,4-5Y,6-7Y', 'kids,tshirt,cartoon', '2024-01-09T00:00:00.000Z', '2024-01-09T00:00:00.000Z'),
('prod-022', 'Plush Toy Bear', 'plush-toy-bear', 'Soft and cuddly teddy bear', 'cat-008', 1200, 1200, 1500, 0, 'percentage', '["/uploads/products/teddy-1.jpg","/uploads/products/teddy-2.jpg"]', 45, 10, 5, 20, 1, 0, 0, 0.3, NULL, 'toy,bear,kids,baby', '2024-01-09T00:00:00.000Z', '2024-01-09T00:00:00.000Z');

-- ================================================
-- PRODUCT VARIANTS (for products with hasVariants=1)
-- ================================================
INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, images, size, color, material, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt) VALUES
-- Running Shoes variants
('var-001', 'prod-015', 'RS-BLK-40', 'Running Shoes - Black - 40', 4500, 6000, 8, '["/uploads/products/runshoes-1.jpg"]', '40', 'Black', 'Mesh', 1, 1, 10, 5, 20, '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),
('var-002', 'prod-015', 'RS-BLK-41', 'Running Shoes - Black - 41', 4500, 6000, 10, '["/uploads/products/runshoes-1.jpg"]', '41', 'Black', 'Mesh', 1, 0, 10, 5, 20, '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),
('var-003', 'prod-015', 'RS-BLK-42', 'Running Shoes - Black - 42', 4500, 6000, 12, '["/uploads/products/runshoes-1.jpg"]', '42', 'Black', 'Mesh', 1, 0, 10, 5, 20, '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),
('var-004', 'prod-015', 'RS-BLK-43', 'Running Shoes - Black - 43', 4500, 6000, 6, '["/uploads/products/runshoes-1.jpg"]', '43', 'Black', 'Mesh', 1, 0, 10, 5, 20, '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z'),
('var-005', 'prod-015', 'RS-BLK-44', 'Running Shoes - Black - 44', 4500, 6000, 8, '["/uploads/products/runshoes-1.jpg"]', '44', 'Black', 'Mesh', 1, 0, 10, 5, 20, '2024-01-06T00:00:00.000Z', '2024-01-06T00:00:00.000Z');

-- ================================================
-- PRODUCT REVIEWS
-- ================================================
INSERT INTO product_reviews (id, productId, userId, userName, rating, title, comment, isVerified, isApproved, createdAt, updatedAt) VALUES
('rev-001', 'prod-001', 'user-002', 'Priya Das', 5, 'Excellent quality!', 'The cotton is so soft and comfortable. Perfect fit!', 1, 1, '2025-01-05T10:00:00.000Z', '2025-01-05T10:00:00.000Z'),
('rev-002', 'prod-001', 'user-003', 'Arif Rahman', 4, 'Great t-shirt', 'Nice quality, just a bit smaller than expected', 1, 1, '2025-01-06T14:00:00.000Z', '2025-01-06T14:00:00.000Z'),
('rev-003', 'prod-004', 'user-001', 'Rahul Sharma', 5, 'Beautiful dress!', 'My wife loves it. The floral print is gorgeous', 1, 1, '2025-01-07T09:00:00.000Z', '2025-01-07T09:00:00.000Z'),
('rev-004', 'prod-007', 'user-004', 'Fatima Ali', 5, 'Best earbuds!', 'Great sound quality and battery life', 1, 1, '2025-01-08T11:00:00.000Z', '2025-01-08T11:00:00.000Z'),
('rev-005', 'prod-007', 'user-005', 'Kamal Hassan', 4, 'Good value', 'Nice earbuds for the price', 1, 1, '2025-01-09T16:00:00.000Z', '2025-01-09T16:00:00.000Z'),
('rev-006', 'prod-008', 'user-002', 'Priya Das', 5, 'Love my smart watch', 'Tracks everything accurately!', 1, 1, '2025-01-10T13:00:00.000Z', '2025-01-10T13:00:00.000Z'),
('rev-007', 'prod-015', 'user-003', 'Arif Rahman', 5, 'Perfect running shoes', 'Very comfortable for long runs', 1, 1, '2025-01-11T10:00:00.000Z', '2025-01-11T10:00:00.000Z'),
('rev-008', 'prod-016', 'user-001', 'Rahul Sharma', 4, 'Elegant watch', 'Looks great, leather strap is premium quality', 1, 1, '2025-01-11T15:00:00.000Z', '2025-01-11T15:00:00.000Z');

-- ================================================
-- ORDERS
-- ================================================
INSERT INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone, shippingAddress, billingAddress, city, district, division, subtotal, shipping, tax, discount, total, status, paymentStatus, paymentMethod, trackingNumber, trackingStatus, estimatedDeliveryDate, notes, createdAt, updatedAt) VALUES
('ord-001', 'ORD-2025-001', 'user-001', 'Rahul Sharma', 'rahul@example.com', '+8801700000002', 'House 12, Road 5, Sector 10, Gulshan, Dhaka', 'House 12, Road 5, Sector 10, Gulshan, Dhaka', 'Gulshan', 'Gulshan', 'Dhaka', 7200, 150, 1296, 0, 8646, 'DELIVERED', 'PAID', 'COD', 'TRK-2025-001', 'DELIVERED', '2025-01-15T00:00:00.000Z', 'Please call before delivery', '2025-01-05T10:30:00.000Z', '2025-01-15T14:00:00.000Z'),
('ord-002', 'ORD-2025-002', 'user-002', 'Priya Das', 'priya@example.com', '+8801800000001', 'House 45, Road 11, Sector 6, Banani, Dhaka', 'House 45, Road 11, Sector 6, Banani, Dhaka', 'Banani', 'Banani', 'Dhaka', 3200, 150, 576, 320, 3606, 'PROCESSING', 'PENDING', 'COD', NULL, 'PENDING', '2025-01-20T00:00:00.000Z', NULL, '2025-01-10T14:20:00.000Z', '2025-01-10T14:20:00.000Z'),
('ord-003', 'ORD-2025-003', 'user-003', 'Arif Rahman', 'arif@example.com', '+8801900000001', 'Flat A/2, Building 3, Road 27, Dhanmondi, Dhaka', 'Flat A/2, Building 3, Road 27, Dhanmondi, Dhaka', 'Dhanmondi', 'Dhanmondi', 'Dhaka', 13000, 150, 2340, 1300, 14190, 'SHIPPED', 'PAID', 'bKash', 'TRK-2025-003', 'IN_TRANSIT', '2025-01-22T00:00:00.000Z', NULL, '2025-01-08T16:45:00.000Z', '2025-01-11T10:00:00.000Z'),
('ord-004', 'ORD-2025-004', NULL, 'Guest Customer', 'guest@example.com', '+8801500000002', 'House 100, Road 5, Uttara, Dhaka', 'House 100, Road 5, Uttara, Dhaka', 'Uttara', 'Uttara', 'Dhaka', 4500, 150, 810, 0, 5460, 'PENDING', 'PENDING', 'COD', NULL, 'PENDING', '2025-01-25T00:00:00.000Z', NULL, '2025-01-11T09:15:00.000Z', '2025-01-11T09:15:00.000Z'),
('ord-005', 'ORD-2025-005', 'user-004', 'Fatima Ali', 'fatima@example.com', '+8801600000001', 'House 8, Road 2, Sector 7, Uttara, Dhaka', 'House 8, Road 2, Sector 7, Uttara, Dhaka', 'Uttara', 'Uttara', 'Dhaka', 5500, 150, 990, 550, 7090, 'PROCESSING', 'PAID', 'Nagad', NULL, 'PENDING', '2025-01-23T00:00:00.000Z', NULL, '2025-01-09T11:30:00.000Z', '2025-01-09T11:30:00.000Z');

-- ================================================
-- ORDER ITEMS
-- ================================================
INSERT INTO order_items (id, orderId, productId, variantId, quantity, price, productName, productImage, variantSku, variantSize, variantColor, variantMaterial, createdAt) VALUES
-- Order 001 items
('oi-001', 'ord-001', 'prod-001', NULL, 2, 1200, 'Premium Cotton T-Shirt', '/uploads/products/tshirt-1.jpg', NULL, NULL, NULL, NULL, '2025-01-05T10:30:00.000Z'),
('oi-002', 'ord-001', 'prod-002', NULL, 1, 2500, 'Slim Fit Jeans', '/uploads/products/jeans-1.jpg', NULL, NULL, NULL, NULL, '2025-01-05T10:30:00.000Z'),
('oi-003', 'ord-001', 'prod-007', NULL, 1, 4500, 'Wireless Earbuds Pro', '/uploads/products/earbuds-1.jpg', NULL, NULL, NULL, NULL, '2025-01-05T10:30:00.000Z'),

-- Order 002 items
('oi-004', 'ord-002', 'prod-004', NULL, 1, 3200, 'Floral Summer Dress', '/uploads/products/dress-1.jpg', NULL, NULL, NULL, NULL, '2025-01-10T14:20:00.000Z'),

-- Order 003 items
('oi-005', 'ord-003', 'prod-008', NULL, 1, 8500, 'Smart Fitness Watch', '/uploads/products/watch-1.jpg', NULL, NULL, NULL, NULL, '2025-01-08T16:45:00.000Z'),
('oi-006', 'ord-003', 'prod-015', 'var-002', 1, 4500, 'Running Shoes', '/uploads/products/runshoes-1.jpg', 'RS-BLK-41', '41', 'Black', 'Mesh', '2025-01-08T16:45:00.000Z'),

-- Order 004 items
('oi-007', 'ord-004', 'prod-007', NULL, 1, 4500, 'Wireless Earbuds Pro', '/uploads/products/earbuds-1.jpg', NULL, NULL, NULL, NULL, '2025-01-11T09:15:00.000Z'),

-- Order 005 items
('oi-008', 'ord-005', 'prod-006', NULL, 1, 5500, 'Designer Handbag', '/uploads/products/handbag-1.jpg', NULL, NULL, NULL, NULL, '2025-01-09T11:30:00.000Z');

-- ================================================
-- CART ITEMS
-- ================================================
INSERT INTO cart_items (id, userId, productId, variantId, quantity, createdAt, updatedAt) VALUES
('ci-001', 'user-001', 'prod-016', NULL, 1, '2025-01-11T10:00:00.000Z', '2025-01-11T10:00:00.000Z'),
('ci-002', 'user-001', 'prod-018', NULL, 2, '2025-01-11T10:00:00.000Z', '2025-01-11T10:00:00.000Z'),
('ci-003', 'user-002', 'prod-015', 'var-003', 1, '2025-01-10T14:20:00.000Z', '2025-01-10T14:20:00.000Z'),
('ci-004', 'user-003', 'prod-013', NULL, 1, '2025-01-11T09:30:00.000Z', '2025-01-11T09:30:00.000Z'),
('ci-005', 'user-004', 'prod-019', NULL, 1, '2025-01-09T11:30:00.000Z', '2025-01-09T11:30:00.000Z'),
('ci-006', 'user-005', 'prod-009', NULL, 1, '2025-01-08T16:00:00.000Z', '2025-01-08T16:00:00.000Z');

-- ================================================
-- WISHLIST ITEMS
-- ================================================
INSERT INTO wishlist_items (id, userId, productId, createdAt) VALUES
('wi-001', 'user-001', 'prod-004', '2025-01-10T10:00:00.000Z'),
('wi-002', 'user-001', 'prod-008', '2025-01-10T10:00:00.000Z'),
('wi-003', 'user-002', 'prod-006', '2025-01-09T14:00:00.000Z'),
('wi-004', 'user-002', 'prod-016', '2025-01-09T14:00:00.000Z'),
('wi-005', 'user-003', 'prod-015', '2025-01-08T09:00:00.000Z'),
('wi-006', 'user-004', 'prod-020', '2025-01-07T11:00:00.000Z'),
('wi-007', 'user-005', 'prod-001', '2025-01-06T15:00:00.000Z');

-- ================================================
-- BANNERS
-- ================================================
INSERT INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, orderNum, createdAt, updatedAt) VALUES
('ban-001', 'Summer Sale', 'Up to 50% off on summer collection', '/uploads/banners/summer-sale.jpg', '/uploads/banners/summer-sale-mobile.jpg', 'Shop Now', '/shop', 1, 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('ban-002', 'New Arrivals', 'Check out our latest products', '/uploads/banners/new-arrivals.jpg', '/uploads/banners/new-arrivals-mobile.jpg', 'Explore', '/shop/new', 1, 2, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('ban-003', 'Free Shipping', 'Free shipping on orders above 5000', '/uploads/banners/free-shipping.jpg', '/uploads/banners/free-shipping-mobile.jpg', 'Learn More', '/shipping', 1, 3, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- STORIES
-- ================================================
INSERT INTO stories (id, title, thumbnail, images, isActive, orderNum, createdAt, updatedAt) VALUES
('sto-001', 'Fashion Week', '/uploads/stories/fashion-thumb.jpg', '["/uploads/stories/fashion-1.jpg","/uploads/stories/fashion-2.jpg","/uploads/stories/fashion-3.jpg"]', 1, 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('sto-002', 'Tech Gadgets', '/uploads/stories/tech-thumb.jpg', '["/uploads/stories/tech-1.jpg","/uploads/stories/tech-2.jpg"]', 1, 2, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('sto-003', 'Home Decor', '/uploads/stories/home-thumb.jpg', '["/uploads/stories/home-1.jpg","/uploads/stories/home-2.jpg","/uploads/stories/home-3.jpg"]', 1, 3, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- REELS
-- ================================================
INSERT INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, orderNum, createdAt, updatedAt) VALUES
('reel-001', 'Summer Collection Preview', '/uploads/reels/summer-thumb.jpg', '/uploads/reels/summer-video.mp4', '["prod-001","prod-002","prod-003","prod-004","prod-005"]', 1, 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('reel-002', 'Tech Must-Haves', '/uploads/reels/tech-thumb.jpg', '/uploads/reels/tech-video.mp4', '["prod-007","prod-008","prod-009"]', 1, 2, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('reel-003', 'Fitness Goals', '/uploads/reels/fitness-thumb.jpg', '/uploads/reels/fitness-video.mp4', '["prod-013","prod-014","prod-015"]', 1, 3, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- PROMOTIONS
-- ================================================
INSERT INTO promotions (id, title, description, image, ctaText, ctaLink, type, promoCode, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit, usedCount, userLimit, applicableCategories, applicableProducts, conditions, isActive, orderNum, createdAt, updatedAt) VALUES
('promo-001', 'Welcome Discount', 'Get 10% off on your first order', '/uploads/promotions/welcome.jpg', 'Use Code', '/shop', 'banner', 'WELCOME10', 'percentage', 10, NULL, 500, '2024-01-01T00:00:00.000Z', '2025-12-31T23:59:59.000Z', 1000, 45, 1, NULL, NULL, 'New customers only', 1, 1, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('promo-002', 'Flash Sale', '20% off on selected items', '/uploads/promotions/flash-sale.jpg', 'Shop Now', '/shop', 'banner', 'FLASH20', 'percentage', 20, 2000, 1000, '2025-01-01T00:00:00.000Z', '2025-01-31T23:59:59.000Z', 500, 120, NULL, '["cat-001","cat-002"]', NULL, NULL, 1, 2, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'),
('promo-003', 'Free Shipping', 'Free shipping on all orders', '/uploads/promotions/free-shipping.jpg', 'Shop Now', '/shop', 'banner', NULL, NULL, NULL, 5000, NULL, '2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.000Z', NULL, 0, NULL, NULL, NULL, 'No minimum order required', 1, 3, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z');

-- ================================================
-- HOMEPAGE SETTINGS
-- ================================================
INSERT INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, updatedAt) VALUES
('hp-001', 'banners', 1, 5000, 5, NULL, '2024-01-01T00:00:00.000Z'),
('hp-002', 'categories', 1, NULL, 8, NULL, '2024-01-01T00:00:00.000Z'),
('hp-003', 'featured_products', 1, NULL, 8, NULL, '2024-01-01T00:00:00.000Z'),
('hp-004', 'new_arrivals', 1, NULL, 8, NULL, '2024-01-01T00:00:00.000Z'),
('hp-005', 'stories', 1, 3000, 5, NULL, '2024-01-01T00:00:00.000Z'),
('hp-006', 'reels', 1, NULL, 3, NULL, '2024-01-01T00:00:00.000Z'),
('hp-007', 'promotions', 1, 4000, 3, NULL, '2024-01-01T00:00:00.000Z');

-- ================================================
-- SITE SETTINGS
-- ================================================
INSERT INTO site_settings (id, siteName, siteLogo, currency, currencySymbol, taxRate, freeShippingThreshold, baseShippingCost, contactEmail, contactPhone, socialMedia, seo, createdAt, updatedAt) VALUES
('site-001', 'SCommerce', '/uploads/logo.png', 'BDT', '৳', 0.18, 5000, 150, 'support@scommerce.com', '+8801700000000', '{"facebook":"https://facebook.com/scommerce","instagram":"https://instagram.com/scommerce","twitter":"https://twitter.com/scommerce"}', '{"title":"SCommerce - Your One-Stop Shop","description":"Shop the best products at great prices","keywords":"ecommerce,shopping,bangladesh"}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- PAYMENT GATEWAYS
-- ================================================
INSERT INTO payment_gateways (id, name, provider, isActive, isDefault, apiKey, apiSecret, webhookSecret, sandboxMode, supportedCurrencies, settings, createdAt, updatedAt) VALUES
('pg-001', 'Cash on Delivery', 'cod', 1, 1, NULL, NULL, NULL, 0, '["BDT"]', NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('pg-002', 'bKash', 'bkash', 1, 0, 'test_api_key', 'test_api_secret', 'test_webhook_secret', 1, '["BDT"]', '{"merchantAccount":"test123"}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('pg-003', 'Nagad', 'nagad', 1, 0, 'test_api_key', 'test_api_secret', 'test_webhook_secret', 1, '["BDT"]', '{"merchantAccount":"test456"}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- SHIPPING CARRIERS
-- ================================================
INSERT INTO shipping_carriers (id, name, provider, isActive, isDefault, apiKey, apiSecret, accountNumber, sandboxMode, shippingMethods, settings, createdAt, updatedAt) VALUES
('sc-001', 'Standard Delivery', 'custom', 1, 1, NULL, NULL, NULL, 0, '[{"name":"Standard","cost":150,"days":"3-5"}]', NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('sc-002', 'Express Delivery', 'custom', 1, 0, NULL, NULL, NULL, 0, '[{"name":"Express","cost":300,"days":"1-2"}]', NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('sc-003', 'Pathao', 'pathao', 1, 0, 'test_key', 'test_secret', 'test_account', 1, '[{"name":"Pathao Standard","cost":120,"days":"2-3"}]', '{"accessToken":"test_token"}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- ANALYTICS INTEGRATIONS
-- ================================================
INSERT INTO analytics_integrations (id, name, provider, isActive, trackingId, apiKey, measurementId, settings, createdAt, updatedAt) VALUES
('ai-001', 'Google Analytics', 'google', 1, 'GA-123456789', NULL, 'G-ABCDEFGHIJ', NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('ai-002', 'Facebook Pixel', 'facebook', 1, NULL, NULL, '123456789012345', '{"pixelId":"123456789012345"}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- EMAIL SERVICES
-- ================================================
INSERT INTO email_services (id, name, provider, isActive, isDefault, apiKey, apiSecret, fromEmail, fromName, sandboxMode, settings, createdAt, updatedAt) VALUES
('es-001', 'SendGrid', 'sendgrid', 1, 1, 'SG.test_api_key', NULL, 'noreply@scommerce.com', 'SCommerce', 1, NULL, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('es-002', 'SMTP', 'smtp', 0, 0, NULL, NULL, 'info@scommerce.com', 'SCommerce', 0, '{"host":"smtp.example.com","port":587,"username":"test"}', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- IMAGE GALLERY
-- ================================================
INSERT INTO image_gallery (id, filename, url, originalName, mimeType, size, width, height, alt, tags, category, usageCount, isActive, uploadedBy, createdAt, updatedAt) VALUES
('img-001', 'banner-1.jpg', '/uploads/gallery/banner-1.jpg', 'banner-1.jpg', 'image/jpeg', 245000, 1920, 600, 'Summer Sale Banner', 'banner,summer', 'banners', 5, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-002', 'product-1.jpg', '/uploads/gallery/product-1.jpg', 'product-1.jpg', 'image/jpeg', 150000, 800, 800, 'T-shirt product image', 'product,tshirt', 'products', 8, 1, 'admin-001', '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z'),
('img-003', 'product-2.jpg', '/uploads/gallery/product-2.jpg', 'product-2.jpg', 'image/jpeg', 180000, 800, 800, 'Jeans product image', 'product,jeans', 'products', 6, 1, 'admin-001', '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z'),
('img-004', 'category-men.jpg', '/uploads/gallery/category-men.jpg', 'category-men.jpg', 'image/jpeg', 200000, 600, 400, 'Men''s Fashion Category', 'category,men', 'categories', 3, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-005', 'category-women.jpg', '/uploads/gallery/category-women.jpg', 'category-women.jpg', 'image/jpeg', 190000, 600, 400, 'Women''s Fashion Category', 'category,women', 'categories', 3, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-006', 'story-thumb-1.jpg', '/uploads/gallery/story-thumb-1.jpg', 'story-thumb-1.jpg', 'image/jpeg', 120000, 400, 700, 'Fashion week story', 'story,fashion', 'stories', 2, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-007', 'reel-thumb-1.jpg', '/uploads/gallery/reel-thumb-1.jpg', 'reel-thumb-1.jpg', 'image/jpeg', 130000, 400, 700, 'Summer collection reel', 'reel,summer', 'reels', 2, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-008', 'promo-1.jpg', '/uploads/gallery/promo-1.jpg', 'promo-1.jpg', 'image/jpeg', 250000, 800, 400, 'Welcome promotion banner', 'promotion,welcome', 'promotions', 4, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-009', 'logo.png', '/uploads/gallery/logo.png', 'logo.png', 'image/png', 45000, 200, 80, 'SCommerce logo', 'logo,brand', 'general', 1, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'),
('img-010', 'hero-bg.jpg', '/uploads/gallery/hero-bg.jpg', 'hero-bg.jpg', 'image/jpeg', 300000, 1920, 1080, 'Hero section background', 'background,hero', 'general', 2, 1, 'admin-001', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

-- ================================================
-- ADMIN LOGS
-- ================================================
INSERT INTO admin_logs (id, action, entity, entityId, adminId, details, ipAddress, userAgent, createdAt) VALUES
('log-001', 'CREATE', 'product', 'prod-001', 'admin-001', 'Created product: Premium Cotton T-Shirt', '192.168.1.100', 'Mozilla/5.0...', '2024-01-02T10:00:00.000Z'),
('log-002', 'CREATE', 'product', 'prod-002', 'admin-001', 'Created product: Slim Fit Jeans', '192.168.1.100', 'Mozilla/5.0...', '2024-01-02T10:30:00.000Z'),
('log-003', 'UPDATE', 'product', 'prod-001', 'admin-001', 'Updated product price from 1500 to 1200', '192.168.1.100', 'Mozilla/5.0...', '2024-01-02T11:00:00.000Z'),
('log-004', 'CREATE', 'order', 'ord-001', 'admin-001', 'Order placed by user: Rahul Sharma', '192.168.1.100', 'Mozilla/5.0...', '2025-01-05T10:30:00.000Z'),
('log-005', 'UPDATE', 'order', 'ord-001', 'admin-001', 'Order status updated to DELIVERED', '192.168.1.100', 'Mozilla/5.0...', '2025-01-15T14:00:00.000Z'),
('log-006', 'CREATE', 'banner', 'ban-001', 'admin-001', 'Created banner: Summer Sale', '192.168.1.100', 'Mozilla/5.0...', '2024-01-01T09:00:00.000Z'),
('log-007', 'DELETE', 'product', NULL, 'admin-001', 'Attempted to delete product but operation cancelled', '192.168.1.100', 'Mozilla/5.0...', '2025-01-10T16:00:00.000Z'),
('log-008', 'UPDATE', 'user', 'user-002', 'admin-001', 'Updated user role to premium member', '192.168.1.100', 'Mozilla/5.0...', '2025-01-09T14:00:00.000Z');

-- ================================================
-- INVENTORY ALERTS
-- ================================================
INSERT INTO inventory_alerts (id, variantId, productId, alertType, quantity, isRead, isResolved, resolvedAt, createdAt) VALUES
('ia-001', 'var-004', 'prod-015', 'LOW_STOCK', 6, 0, 0, NULL, '2025-01-11T10:00:00.000Z'),
('ia-002', NULL, 'prod-006', 'LOW_STOCK', 20, 1, 0, NULL, '2025-01-10T09:00:00.000Z'),
('ia-003', 'var-001', 'prod-015', 'LOW_STOCK', 8, 0, 0, NULL, '2025-01-11T10:00:00.000Z'),
('ia-004', NULL, 'prod-016', 'LOW_STOCK', 25, 1, 1, '2025-01-09T10:00:00.000Z', '2025-01-08T15:00:00.000Z');

-- ================================================
-- POSTS (Blog)
-- ================================================
INSERT INTO posts (id, title, content, published, authorId, createdAt, updatedAt) VALUES
('post-001', 'Top 10 Fashion Trends for 2025', 'Discover the hottest fashion trends that will dominate 2025. From sustainable fashion to bold colors, we''ve got you covered...', 1, 'admin-001', '2025-01-01T10:00:00.000Z', '2025-01-01T10:00:00.000Z'),
('post-002', 'How to Choose the Perfect Running Shoes', 'A comprehensive guide to finding running shoes that fit perfectly and support your running style...', 1, 'admin-001', '2025-01-05T14:00:00.000Z', '2025-01-05T14:00:00.000Z'),
('post-003', '5 Tips for Skincare in Winter', 'Keep your skin healthy and glowing during the winter months with these expert tips...', 1, 'admin-001', '2025-01-08T11:00:00.000Z', '2025-01-08T11:00:00.000Z'),
('post-004', 'Home Decor Ideas on a Budget', 'Transform your living space without breaking the bank. Check out these affordable decorating tips...', 0, 'admin-001', '2025-01-10T16:00:00.000Z', '2025-01-10T16:00:00.000Z');

-- ================================================
-- INVENTORY RESERVATIONS
-- ================================================
INSERT INTO inventory_reservations (id, variantId, productId, userId, quantity, expiresAt, createdAt) VALUES
('ir-001', 'var-002', 'prod-015', 'user-002', 1, '2025-01-13T14:20:00.000Z', '2025-01-10T14:20:00.000Z'),
('ir-002', NULL, 'prod-013', 'user-003', 1, '2025-01-13T09:30:00.000Z', '2025-01-11T09:30:00.000Z'),
('ir-003', NULL, 'prod-016', 'user-001', 1, '2025-01-14T10:00:00.000Z', '2025-01-11T10:00:00.000Z');

-- ================================================
-- SUMMARY
-- ================================================
-- Total Records Inserted:
-- Users: 6 (1 admin, 5 users)
-- Addresses: 5
-- Categories: 8
-- Products: 22 (across 8 categories, 6 featured)
-- Product Variants: 5 (for running shoes)
-- Product Reviews: 8
-- Orders: 5 (various statuses)
-- Order Items: 8
-- Cart Items: 6
-- Wishlist Items: 7
-- Banners: 3
-- Stories: 3
-- Reels: 3
-- Promotions: 3 (with promo codes)
-- Homepage Settings: 7
-- Site Settings: 1
-- Payment Gateways: 3
-- Shipping Carriers: 3
-- Analytics Integrations: 2
-- Email Services: 2
-- Image Gallery: 10 (various categories)
-- Admin Logs: 8
-- Inventory Alerts: 4
-- Posts: 4 (blog articles)
-- Inventory Reservations: 3
