-- Complete Seed Data for SCommerce ecommerce database
-- Includes all sections: users, products, orders, stories, reels, reviews, etc.

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
('prod-lh-001', 'Red Bridal Lehenga', 'red-bridal-lehenga', 'Stunning red bridal lehenga with intricate embroidery work', 'cat-lehengas', 15000, 15000, 18000, 16.67, 'percentage', '["/images/products/lehenga-1.svg","/images/products/lehenga-1.svg"]', 10, 1, 1, 1, datetime('now'), datetime('now')),
('prod-lh-002', 'Pink Designer Lehenga', 'pink-designer-lehenga', 'Beautiful pink lehenga with stone work', 'cat-lehengas', 12000, 12000, 15000, 20, 'percentage', '["/images/products/lehenga-1.svg","/images/products/lehenga-1.svg"]', 8, 1, 1, 1, datetime('now'), datetime('now')),
('prod-lh-003', 'Green Festive Lehenga', 'green-festive-lehenga', 'Elegant green lehenga perfect for festivals', 'cat-lehengas', 8000, 8000, 10000, 20, 'percentage', '["/images/products/lehenga-1.svg"]', 15, 1, 0, 0, datetime('now'), datetime('now')),
('prod-lh-004', 'Royal Blue Lehenga', 'royal-blue-lehenga', 'Royal blue lehenga with zari work', 'cat-lehengas', 10000, 10000, 12000, 16.67, 'percentage', '["/images/products/lehenga-1.svg"]', 12, 1, 1, 0, datetime('now'), datetime('now')),
('prod-lh-005', 'Maroon Party Lehenga', 'maroon-party-lehenga', 'Gorgeous maroon lehenga for parties', 'cat-lehengas', 9500, 9500, null, 0, 'percentage', '["/images/products/lehenga-1.svg"]', 20, 1, 0, 0, datetime('now'), datetime('now')),

-- Sarees
('prod-sa-001', 'Silk Banarasi Saree', 'silk-banarasi-saree', 'Pure silk Banarasi saree with gold border', 'cat-sarees', 8000, 8000, 10000, 20, 'percentage', '["/images/products/saree-1.jpg"]', 10, 1, 1, 1, datetime('now'), datetime('now')),
('prod-sa-002', 'Chanderi Saree', 'chanderi-saree', 'Lightweight Chanderi saree', 'cat-sarees', 5000, 5000, 6000, 16.67, 'percentage', '["/images/products/saree-2.jpg"]', 15, 1, 1, 0, datetime('now'), datetime('now')),
('prod-sa-003', 'Georgette Saree', 'georgette-saree', 'Elegant georgette saree with sequin work', 'cat-sarees', 3500, 3500, null, 0, 'percentage', '["/images/products/saree-3.jpg"]', 25, 1, 0, 0, datetime('now'), datetime('now')),
('prod-sa-004', 'Cotton Printed Saree', 'cotton-printed-saree', 'Comfortable cotton saree with traditional prints', 'cat-sarees', 2000, 2000, 2500, 20, 'percentage', '["/images/products/saree-4.jpg"]', 30, 1, 0, 0, datetime('now'), datetime('now')),
('prod-sa-005', 'Kanjeevaram Saree', 'kanjeevaram-saree', 'Traditional Kanjeevaram silk saree', 'cat-sarees', 15000, 15000, 18000, 16.67, 'percentage', '["/images/products/saree-5.jpg"]', 8, 1, 1, 0, datetime('now'), datetime('now')),

-- Salwar Suits
('prod-sw-001', 'Anarkali Suit', 'anarkali-suit', 'Beautiful Anarkali salwar suit', 'cat-salwar', 4000, 4000, 5000, 20, 'percentage', '["/images/products/salwar-1.jpg"]', 15, 1, 1, 0, datetime('now'), datetime('now')),
('prod-sw-002', 'Palazzo Suit', 'palazzo-suit', 'Modern palazzo salwar suit', 'cat-salwar', 3500, 3500, null, 0, 'percentage', '["/images/products/salwar-2.jpg"]', 20, 1, 0, 0, datetime('now'), datetime('now')),
('prod-sw-003', 'Straight Cut Suit', 'straight-cut-suit', 'Elegant straight cut salwar suit', 'cat-salwar', 3000, 3000, 3500, 14.29, 'percentage', '["/images/products/salwar-3.jpg"]', 18, 1, 1, 0, datetime('now'), datetime('now')),
('prod-sw-004', 'Churidar Suit', 'churidar-suit', 'Classic churidar salwar suit', 'cat-salwar', 3500, 3500, 4000, 12.5, 'percentage', '["/images/products/salwar-4.jpg"]', 22, 1, 0, 0, datetime('now'), datetime('now')),
('prod-sw-005', 'Patiala Suit', 'patiala-suit', 'Traditional Patiala salwar suit', 'cat-salwar', 3800, 3800, null, 0, 'percentage', '["/images/products/salwar-5.jpg"]', 16, 1, 1, 0, datetime('now'), datetime('now')),

-- Kurtas
('prod-ku-001', 'Embroidered Kurta', 'embroidered-kurta', 'Beautiful embroidered kurta', 'cat-kurtas', 2000, 2000, 2500, 20, 'percentage', '["/images/products/kurta-1.jpg"]', 25, 1, 1, 0, datetime('now'), datetime('now')),
('prod-ku-002', 'Printed Kurta', 'printed-kurta', 'Trendy printed kurta', 'cat-kurtas', 1500, 1500, null, 0, 'percentage', '["/images/products/kurta-2.jpg"]', 30, 1, 0, 0, datetime('now'), datetime('now')),
('prod-ku-003', 'Solid Kurta', 'solid-kurta', 'Elegant solid color kurta', 'cat-kurtas', 1800, 1800, 2000, 10, 'percentage', '["/images/products/kurta-3.jpg"]', 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-ku-004', 'Long Straight Kurta', 'long-straight-kurta', 'Modern long straight kurta', 'cat-kurtas', 2200, 2200, null, 0, 'percentage', '["/images/products/kurta-4.jpg"]', 18, 1, 0, 0, datetime('now'), datetime('now')),
('prod-ku-005', 'A-Line Kurta', 'a-line-kurta', 'Flattering A-line kurta', 'cat-kurtas', 2000, 2000, 2400, 16.67, 'percentage', '["/images/products/kurta-5.jpg"]', 22, 1, 1, 0, datetime('now'), datetime('now')),

-- Tops
('prod-to-001', 'Floral Top', 'floral-top', 'Beautiful floral print top', 'cat-tops', 1200, 1200, 1500, 20, 'percentage', '["/images/products/top-1.jpg"]', 30, 1, 1, 0, datetime('now'), datetime('now')),
('prod-to-002', 'Striped Top', 'striped-top', 'Classic striped top', 'cat-tops', 1000, 1000, null, 0, 'percentage', '["/images/products/top-2.jpg"]', 35, 1, 0, 0, datetime('now'), datetime('now')),
('prod-to-003', 'Solid Color Top', 'solid-color-top', 'Versatile solid color top', 'cat-tops', 900, 900, 1100, 18.18, 'percentage', '["/images/products/top-3.jpg"]', 40, 1, 1, 0, datetime('now'), datetime('now')),
('prod-to-004', 'Peplum Top', 'peplum-top', 'Stylish peplum top', 'cat-tops', 1500, 1500, 1800, 16.67, 'percentage', '["/images/products/top-4.jpg"]', 25, 1, 0, 0, datetime('now'), datetime('now')),
('prod-to-005', 'Off-Shoulder Top', 'off-shoulder-top', 'Trendy off-shoulder top', 'cat-tops', 1800, 1800, null, 0, 'percentage', '["/images/products/top-5.jpg"]', 20, 1, 1, 0, datetime('now'), datetime('now')),

-- Gowns
('prod-go-001', 'Evening Gown', 'evening-gown', 'Elegant evening gown', 'cat-gowns', 12000, 12000, 15000, 20, 'percentage', '["/images/products/gown-1.jpg"]', 10, 1, 1, 1, datetime('now'), datetime('now')),
('prod-go-002', 'Wedding Gown', 'wedding-gown', 'Beautiful wedding gown', 'cat-gowns', 25000, 25000, 30000, 16.67, 'percentage', '["/images/products/gown-2.jpg"]', 5, 1, 1, 1, datetime('now'), datetime('now')),
('prod-go-003', 'Party Gown', 'party-gown', 'Stylish party gown', 'cat-gowns', 8000, 8000, 10000, 20, 'percentage', '["/images/products/gown-3.jpg"]', 12, 1, 1, 0, datetime('now'), datetime('now')),
('prod-go-004', 'Cocktail Gown', 'cocktail-gown', 'Chic cocktail gown', 'cat-gowns', 10000, 10000, null, 0, 'percentage', '["/images/products/gown-4.jpg"]', 8, 1, 0, 0, datetime('now'), datetime('now')),
('prod-go-005', 'Maxi Gown', 'maxi-gown', 'Flowing maxi gown', 'cat-gowns', 9000, 9000, 11000, 18.18, 'percentage', '["/images/products/gown-5.jpg"]', 10, 1, 1, 0, datetime('now'), datetime('now')),

-- Menswear
('prod-me-001', 'Men Kurta Pyjama', 'men-kurta-pyjama', 'Traditional kurta pyjama set', 'cat-menswear', 3000, 3000, 3500, 14.29, 'percentage', '["/images/products/men-1.jpg"]', 20, 1, 1, 0, datetime('now'), datetime('now')),
('prod-me-002', 'Nehru Jacket Set', 'nehru-jacket-set', 'Elegant Nehru jacket with kurta', 'cat-menswear', 5000, 5000, 6000, 16.67, 'percentage', '["/images/products/men-2.jpg"]', 15, 1, 1, 0, datetime('now'), datetime('now')),
('prod-me-003', 'Sherwani', 'sherwani', 'Traditional sherwani for special occasions', 'cat-menswear', 15000, 15000, 18000, 16.67, 'percentage', '["/images/products/men-3.jpg"]', 8, 1, 1, 1, datetime('now'), datetime('now')),
('prod-me-004', 'Waistcoat Set', 'waistcoat-set', 'Stylish waistcoat with kurta', 'cat-menswear', 6000, 6000, null, 0, 'percentage', '["/images/products/men-4.jpg"]', 12, 1, 0, 0, datetime('now'), datetime('now')),
('prod-me-005', 'Pathani Suit', 'pathani-suit', 'Classic Pathani suit', 'cat-menswear', 3500, 3500, 4000, 12.5, 'percentage', '["/images/products/men-5.jpg"]', 18, 1, 1, 0, datetime('now'), datetime('now'));

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
('user-staff-002', 'priya@scommerce.com', 'Priya Singh', '+8801700000003', '$2b$10$a.F/Ul5zAnA24HVQPvmuE.VZUffKX32EXWob0WyEGK2q5TD2NUNQC', 1, 'staff', datetime('now'), datetime('now')),
('user-staff-003', 'amit@scommerce.com', 'Amit Kumar', '+8801700000004', '$2b$10$0q3CVc8GTq8O5ILjZzHvm.IF9QNuWjLmMRkOdNo8RZfkMoWbsrjUW', 1, 'staff', datetime('now'), datetime('now'));

-- Customer users
INSERT OR IGNORE INTO users (id, email, name, phone, password, emailVerified, role, createdAt, updatedAt)
VALUES
('user-cust-001', 'fatema@example.com', 'Fatema Akhter', '+8801700000101', '$2b$10$EcvgWa939MGFsiYb3Sged.k1cATkYrXj8hb6dGdWyyaGqpkWBQjyK', 1, 'user', datetime('now'), datetime('now')),
('user-cust-002', 'noor@example.com', 'Noor Jahan', '+8801700000102', '$2b$10$bwKw7jbXL1DEmFckWLhM5uCtbVghgRkq61NfL828KkR7wt6PNPqsO', 1, 'user', datetime('now'), datetime('now')),
('user-cust-003', 'sara@example.com', 'Sara Ahmed', '+8801700000103', '$2b$10$VZSrJ6C31npLpsbd0YKpj.4oacbmH0xYC5knPfOSKpsNGSFXvBy3u', 1, 'user', datetime('now'), datetime('now')),
('user-cust-004', 'zara@example.com', 'Zara Khan', '+8801700000104', '$2b$10$DTVovRdSzYGCI00JHg4/FOAdbGoPMYQCT7U39N1V0hY1v1IjFc.ha', 1, 'user', datetime('now'), datetime('now')),
('user-cust-005', 'hana@example.com', 'Hana Begum', '+8801700000105', '$2b$10$SjKZJpQhzyY.HWStJ9jThOffxwqcyf4b34X2/Jg4swVXz5AnQQxxK', 1, 'user', datetime('now'), datetime('now'));

-- ============================================
-- ADDRESSES
-- ============================================
INSERT OR IGNORE INTO addresses (id, userId, fullName, phone, addressLine1, addressLine2, city, district, division, postalCode, isDefault, createdAt, updatedAt)
VALUES
('addr-001', 'user-cust-001', 'Fatema Akhter', '+8801700000101', '123 Mirpur Road', 'Apartment 4B', 'Dhaka', 'Mirpur', 'Dhaka', '1216', 1, datetime('now'), datetime('now')),
('addr-002', 'user-cust-002', 'Noor Jahan', '+8801700000102', '456 Dhanmondi Road', 'House 12', 'Dhaka', 'Dhanmondi', 'Dhaka', '1205', 1, datetime('now'), datetime('now')),
('addr-003', 'user-cust-003', 'Sara Ahmed', '+8801700000103', '789 Gulshan Avenue', 'Flat 5A', 'Dhaka', 'Gulshan', 'Dhaka', '1212', 1, datetime('now'), datetime('now'));

-- ============================================
-- ORDERS
-- ============================================
INSERT OR IGNORE INTO orders (id, orderNumber, userId, customerName, customerEmail, customerPhone, shippingAddress, city, district, division, subtotal, shipping, tax, discount, total, status, paymentStatus, paymentMethod, createdAt, updatedAt)
VALUES
('order-001', 'ORD-001', 'user-cust-001', 'Fatema Akhter', 'fatema@example.com', '+8801700000101', '123 Mirpur Road, Apartment 4B, Mirpur, Dhaka 1216', 'Dhaka', 'Mirpur', 'Dhaka', 15000, 150, 2700, 3000, 18350, 'DELIVERED', 'COMPLETED', 'cod', datetime('now'), datetime('now')),
('order-002', 'ORD-002', 'user-cust-002', 'Noor Jahan', 'noor@example.com', '+8801700000102', '456 Dhanmondi Road, House 12, Dhanmondi, Dhaka 1205', 'Dhaka', 'Dhanmondi', 'Dhaka', 8000, 150, 1440, 1600, 10190, 'PROCESSING', 'PENDING', 'cod', datetime('now'), datetime('now')),
('order-003', 'ORD-003', 'user-cust-001', 'Fatema Akhter', 'fatema@example.com', '+8801700000101', '123 Mirpur Road, Apartment 4B, Mirpur, Dhaka 1216', 'Dhaka', 'Mirpur', 'Dhaka', 12000, 150, 2160, 2400, 14710, 'PENDING', 'PENDING', 'cod', datetime('now'), datetime('now')),
('order-004', 'ORD-004', 'user-cust-003', 'Sara Ahmed', 'sara@example.com', '+8801700000103', '789 Gulshan Avenue, Flat 5A, Gulshan, Dhaka 1212', 'Dhaka', 'Gulshan', 'Dhaka', 35000, 200, 6300, 7000, 42500, 'SHIPPED', 'COMPLETED', 'online', datetime('now'), datetime('now'));

-- ============================================
-- ORDER ITEMS
-- ============================================
INSERT OR IGNORE INTO order_items (id, orderId, productId, variantId, quantity, price, productName, productImage, variantSku, createdAt)
VALUES
-- Order 001 items
('oi-001-1', 'order-001', 'prod-lh-001', null, 1, 15000, 'Red Bridal Lehenga', '/images/products/lehenga-1.jpg', null, datetime('now')),
('oi-001-2', 'order-001', 'prod-me-003', null, 1, 15000, 'Sherwani', '/images/products/men-3.jpg', null, datetime('now')),
-- Order 002 items
('oi-002-1', 'order-002', 'prod-sa-002', null, 2, 5000, 'Chanderi Saree', '/images/products/saree-2.jpg', null, datetime('now')),
-- Order 003 items
('oi-003-1', 'order-003', 'prod-lh-002', null, 1, 12000, 'Pink Designer Lehenga', '/images/products/lehenga-2.jpg', null, datetime('now')),
-- Order 004 items
('oi-004-1', 'order-004', 'prod-go-002', null, 1, 25000, 'Wedding Gown', '/images/products/gown-2.jpg', null, datetime('now')),
('oi-004-2', 'order-004', 'prod-me-002', null, 1, 10000, 'Nehru Jacket Set', '/images/products/men-2.jpg', null, datetime('now'));

-- ============================================
-- CART ITEMS
-- ============================================
INSERT OR IGNORE INTO cart_items (id, userId, productId, variantId, quantity, createdAt, updatedAt)
VALUES
('cart-001', 'user-cust-004', 'prod-lh-003', null, 1, datetime('now'), datetime('now')),
('cart-002', 'user-cust-004', 'prod-ku-003', null, 2, datetime('now'), datetime('now')),
('cart-003', 'user-cust-005', 'prod-sa-004', null, 1, datetime('now'), datetime('now'));

-- ============================================
-- WISHLIST ITEMS
-- ============================================
INSERT OR IGNORE INTO wishlist_items (id, userId, productId, createdAt)
VALUES
('wish-001', 'user-cust-001', 'prod-lh-001', datetime('now')),
('wish-002', 'user-cust-001', 'prod-me-003', datetime('now')),
('wish-003', 'user-cust-002', 'prod-sa-005', datetime('now')),
('wish-004', 'user-cust-003', 'prod-go-002', datetime('now')),
('wish-005', 'user-cust-004', 'prod-ku-005', datetime('now'));

-- ============================================
-- PRODUCT REVIEWS
-- ============================================
INSERT OR IGNORE INTO product_reviews (id, productId, userId, userName, rating, title, comment, isVerified, isApproved, createdAt, updatedAt)
VALUES
('review-001', 'prod-lh-001', 'user-cust-001', 'Fatema Akhter', 5, 'Amazing lehenga!', 'Absolutely stunning lehenga for my wedding. The embroidery work is incredible!', 1, 1, datetime('now'), datetime('now')),
('review-002', 'prod-lh-002', 'user-cust-002', 'Noor Jahan', 4, 'Beautiful pink lehenga', 'Love the color and stone work. Perfect for parties.', 1, 1, datetime('now'), datetime('now')),
('review-003', 'prod-sa-005', 'user-cust-003', 'Sara Ahmed', 5, 'Authentic Kanjeevaram', 'Pure silk saree with beautiful zari work. Worth the price!', 1, 1, datetime('now'), datetime('now')),
('review-004', 'prod-me-003', 'user-cust-001', 'Fatema Akhter', 5, 'Perfect sherwani', 'My husband loved this sherwani for our wedding!', 1, 1, datetime('now'), datetime('now')),
('review-005', 'prod-go-002', 'user-cust-003', 'Sara Ahmed', 5, 'Dream wedding gown', 'Made my special day even more perfect!', 1, 1, datetime('now'), datetime('now')),
('review-006', 'prod-lh-003', 'user-cust-004', 'Zara Khan', 4, 'Good quality', 'Nice lehenga for the price. Fabric is comfortable.', 1, 1, datetime('now'), datetime('now')),
('review-007', 'prod-ku-003', 'user-cust-005', 'Hana Begum', 4, 'Comfortable kurta', 'Good for casual wear. Fabric is soft and breathable.', 1, 1, datetime('now'), datetime('now'));

-- ============================================
-- STORIES
-- ============================================
INSERT OR IGNORE INTO stories (id, title, thumbnail, images, isActive, "order", createdAt, updatedAt)
VALUES
('story-001', 'New Arrivals', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=400&h=700&fit=crop"]', 1, 1, datetime('now'), datetime('now')),
('story-002', 'Festival Special', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=700&fit=crop"]', 1, 2, datetime('now'), datetime('now')),
('story-003', 'Best Sellers', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=700&fit=crop"]', 1, 3, datetime('now'), datetime('now')),
('story-004', 'Wedding Collection', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=700&fit=crop"]', 1, 4, datetime('now'), datetime('now')),
('story-005', 'Sale Alert', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=400&h=700&fit=crop","https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=700&fit=crop"]', 1, 5, datetime('now'), datetime('now'));

-- ============================================
-- REELS
-- ============================================
INSERT OR IGNORE INTO reels (id, title, thumbnail, videoUrl, productIds, isActive, "order", createdAt, updatedAt)
VALUES
('reel-001', 'Lehenga Styling Tips', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-lh-001","prod-lh-002","prod-lh-003"]', 1, 1, datetime('now'), datetime('now')),
('reel-002', 'Saree Draping Styles', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-sa-001","prod-sa-002","prod-sa-003"]', 1, 2, datetime('now'), datetime('now')),
('reel-003', 'Kurta Fashion', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-ku-001","prod-ku-002","prod-ku-003"]', 1, 3, datetime('now'), datetime('now')),
('reel-004', 'Wedding Looks 2024', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-lh-001","prod-go-002","prod-me-003"]', 1, 4, datetime('now'), datetime('now')),
('reel-005', 'Menswear Collection', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=320&h=568&fit=crop', 'https://www.youtube.com/embed/Gk-s0icT2CI?autoplay=1&mute=1', '["prod-me-001","prod-me-002","prod-me-003"]', 1, 5, datetime('now'), datetime('now'));

-- ============================================
-- PROMOTIONS
-- ============================================
INSERT OR IGNORE INTO promotions (id, title, description, image, ctaText, ctaLink, type, isActive, "order", createdAt, updatedAt)
VALUES
('promo-001', 'Summer Sale', 'Up to 50% off on selected items', '/images/promotions/summer-sale.jpg', 'Shop Now', '/shop?type=sale', 'banner', 1, 1, datetime('now'), datetime('now')),
('promo-002', 'New Collection', 'Discover our latest arrivals', '/images/promotions/new-collection.jpg', 'Explore', '/collections/new', 'banner', 1, 2, datetime('now'), datetime('now')),
('promo-003', 'Free Shipping', 'Free shipping on orders above 5000 BDT', '/images/promotions/free-shipping.jpg', 'Learn More', '/shipping', 'banner', 1, 3, datetime('now'), datetime('now'));

-- ============================================
-- BANNERS
-- ============================================
INSERT OR IGNORE INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, "order", createdAt, updatedAt)
VALUES
('banner-1', 'New Collection 2024', 'Discover our latest ethnic wear collection', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=580&h=700&fit=crop', 'Shop Now', '/shop', 1, 1, datetime('now'), datetime('now')),
('banner-2', 'Festival Special', 'Get ready for the festive season', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=580&h=700&fit=crop', 'Explore', '/collections/sarees', 1, 2, datetime('now'), datetime('now')),
('banner-3', 'Wedding Season', 'Perfect outfits for your special day', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=1400&h=450&fit=crop', 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=580&h=700&fit=crop', 'View Collection', '/collections/lehengas', 1, 3, datetime('now'), datetime('now'));

-- ============================================
-- HOMEPAGE SETTINGS
-- ============================================
INSERT OR IGNORE INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, updatedAt)
VALUES
('hp-1', 'hero-slider', 1, 5000, 5, null, datetime('now')),
('hp-2', 'categories', 1, 5000, 7, null, datetime('now')),
('hp-3', 'featured-products', 1, 5000, 8, null, datetime('now')),
('hp-4', 'new-arrivals', 1, 5000, 8, null, datetime('now')),
('hp-5', 'banners', 1, 5000, 3, null, datetime('now')),
('hp-6', 'stories', 1, 5000, 5, null, datetime('now')),
('hp-7', 'reels', 1, 0, 5, null, datetime('now'));

-- ============================================
-- SITE SETTINGS
-- ============================================
INSERT OR IGNORE INTO site_settings (id, siteName, siteLogo, contactEmail, contactPhone, currency, freeShippingThreshold, baseShippingCost, taxRate, socialMedia, enableStore, maintenanceMode, updatedAt)
VALUES
('site-1', 'SCommerce', '/images/logo.svg', 'info@scommerce.com', '+8801700000000', 'BDT', 5000, 150, 0, '{"facebook":"https://facebook.com/scommerce","instagram":"https://instagram.com/scommerce","twitter":"https://twitter.com/scommerce"}', 1, 0, datetime('now'));

-- ============================================
-- PAYMENT GATEWAYS
-- ============================================
INSERT OR IGNORE INTO payment_gateways (id, name, provider, isActive, isDefault, apiKey, apiSecret, webhookSecret, sandboxMode, supportedCurrencies, settings, createdAt, updatedAt)
VALUES
('pg-1', 'Cash on Delivery', 'cod', 1, 1, null, null, null, 0, 'BDT', null, datetime('now'), datetime('now')),
('pg-2', 'bKash', 'bkash', 0, 0, null, null, null, 1, 'BDT', '{"merchantAccount":"scommerce"}', datetime('now'), datetime('now')),
('pg-3', 'Nagad', 'nagad', 0, 0, null, null, null, 1, 'BDT', '{"merchantAccount":"scommerce"}', datetime('now'), datetime('now'));

-- ============================================
-- SHIPPING CARRIERS
-- ============================================
INSERT OR IGNORE INTO shipping_carriers (id, name, provider, isActive, isDefault, apiKey, apiSecret, accountNumber, sandboxMode, shippingMethods, settings, createdAt, updatedAt)
VALUES
('sc-1', 'Standard Shipping', 'standard', 1, 1, null, null, null, 0, '[{"name":"Standard","cost":150,"estimatedDays":"3-5"}]', null, datetime('now'), datetime('now')),
('sc-2', 'Express Shipping', 'express', 0, 0, null, null, null, 1, '[{"name":"Express","cost":250,"estimatedDays":"1-2"}]', null, datetime('now'), datetime('now'));

-- ============================================
-- EMAIL SERVICES
-- ============================================
INSERT OR IGNORE INTO email_services (id, name, provider, isActive, isDefault, apiKey, apiSecret, fromEmail, fromName, sandboxMode, settings, createdAt, updatedAt)
VALUES
('es-1', 'Resend', 'resend', 1, 1, null, null, 'info@scommerce.com', 'SCommerce', 1, null, datetime('now'), datetime('now'));

-- ============================================
-- ANALYTICS INTEGRATIONS
-- ============================================
INSERT OR IGNORE INTO analytics_integrations (id, name, provider, isActive, trackingId, apiKey, measurementId, settings, createdAt, updatedAt)
VALUES
('ai-1', 'Google Analytics', 'google', 0, null, null, null, null, datetime('now'), datetime('now'));


-- ============================================
-- INVENTORY ALERTS
-- ============================================
INSERT OR IGNORE INTO inventory_alerts (id, productId, alertType, quantity, isRead, isResolved, createdAt)
VALUES
('alert-001', 'prod-lh-001', 'LOW_STOCK', 10, 0, 0, datetime('now')),
('alert-002', 'prod-go-002', 'LOW_STOCK', 5, 0, 0, datetime('now')),
('alert-003', 'prod-sa-005', 'LOW_STOCK', 8, 0, 0, datetime('now'));

-- ============================================
-- ADMIN LOGS
-- ============================================
INSERT OR IGNORE INTO admin_logs (id, action, entity, entityId, adminId, details, createdAt)
VALUES
('log-001', 'CREATE', 'order', 'order-001', 'user-admin-001', 'Order ORD-001 created by customer Fatema Akhter', datetime('now')),
('log-002', 'UPDATE', 'order', 'order-001', 'user-admin-001', 'Order ORD-001 status updated to DELIVERED', datetime('now')),
('log-003', 'CREATE', 'product', 'prod-lh-001', 'user-admin-001', 'New product Red Bridal Lehenga added', datetime('now')),
('log-004', 'UPDATE', 'product', 'prod-lh-002', 'user-staff-001', 'Product Pink Designer Lehenga updated', datetime('now')),
('log-005', 'DELETE', 'review', 'review-003', 'user-staff-002', 'Review deleted for inappropriate content', datetime('now'));

-- ============================================
-- POSTS (Blog)
-- ============================================
INSERT OR IGNORE INTO posts (id, title, content, published, authorId, createdAt, updatedAt)
VALUES
('post-001', 'How to Choose the Perfect Lehenga for Your Wedding', 'Choosing the right lehenga for your wedding day is one of the most important decisions you''ll make. In this guide, we''ll walk you through everything you need to consider...', 1, 'user-admin-001', datetime('now'), datetime('now')),
('post-002', 'Top 5 Saree Trends for 2024', 'Discover the hottest saree trends this season including Banarasi, Kanjeevaram, and Chanderi sarees...', 1, 'user-admin-001', datetime('now'), datetime('now')),
('post-003', 'Traditional vs Modern: Finding Your Style', 'Finding the perfect balance between traditional elegance and modern comfort can be challenging. Here are some tips to help you find your style...', 1, 'user-admin-001', datetime('now'), datetime('now'));

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
('pv-sw-001-1', 'prod-sw-001', 'SW-ANA-S', 'Anarkali Suit - Size S', 4000, 5000, 8, '["/images/products/salwar-1.jpg"]', 'S', null, 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-sw-001-2', 'prod-sw-001', 'SW-ANA-M', 'Anarkali Suit - Size M', 4000, 5000, 7, '["/images/products/salwar-1.jpg"]', 'M', null, 'Cotton', 1, 1, 5, 3, 8, datetime('now'), datetime('now')),
('pv-sw-001-3', 'prod-sw-001', 'SW-ANA-L', 'Anarkali Suit - Size L', 4000, 5000, 6, '["/images/products/salwar-1.jpg"]', 'L', null, 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-sw-001-4', 'prod-sw-001', 'SW-ANA-XL', 'Anarkali Suit - Size XL', 4000, 5000, 5, '["/images/products/salwar-1.jpg"]', 'XL', null, 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),

-- Embroidered Kurta Variants (Size and Color combinations)
('pv-ku-001-1', 'prod-ku-001', 'KU-EMB-BLK-S', 'Embroidered Kurta - Black S', 2000, 2500, 10, '["/images/products/kurta-1.jpg"]', 'S', 'Black', 'Cotton', 1, 1, 5, 3, 8, datetime('now'), datetime('now')),
('pv-ku-001-2', 'prod-ku-001', 'KU-EMB-BLK-M', 'Embroidered Kurta - Black M', 2000, 2500, 10, '["/images/products/kurta-1.jpg"]', 'M', 'Black', 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-ku-001-3', 'prod-ku-001', 'KU-EMB-WHT-S', 'Embroidered Kurta - White S', 2000, 2500, 8, '["/images/products/kurta-1.jpg"]', 'S', 'White', 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),
('pv-ku-001-4', 'prod-ku-001', 'KU-EMB-WHT-M', 'Embroidered Kurta - White M', 2000, 2500, 9, '["/images/products/kurta-1.jpg"]', 'M', 'White', 'Cotton', 1, 0, 5, 3, 8, datetime('now'), datetime('now')),

-- Floral Top Variants (Size and Color combinations)
('pv-to-001-1', 'prod-to-001', 'TO-FLO-RED-S', 'Floral Top - Red S', 1200, 1500, 15, '["/images/products/top-1.jpg"]', 'S', 'Red', 'Cotton Blend', 1, 1, 8, 5, 15, datetime('now'), datetime('now')),
('pv-to-001-2', 'prod-to-001', 'TO-FLO-RED-M', 'Floral Top - Red M', 1200, 1500, 15, '["/images/products/top-1.jpg"]', 'M', 'Red', 'Cotton Blend', 1, 0, 8, 5, 15, datetime('now'), datetime('now')),
('pv-to-001-3', 'prod-to-001', 'TO-FLO-RED-L', 'Floral Top - Red L', 1200, 1500, 12, '["/images/products/top-1.jpg"]', 'L', 'Red', 'Cotton Blend', 1, 0, 8, 5, 15, datetime('now'), datetime('now')),
('pv-to-001-4', 'prod-to-001', 'TO-FLO-BLU-S', 'Floral Top - Blue S', 1200, 1500, 10, '["/images/products/top-1.jpg"]', 'S', 'Blue', 'Cotton Blend', 1, 0, 8, 5, 15, datetime('now'), datetime('now')),
('pv-to-001-5', 'prod-to-001', 'TO-FLO-BLU-M', 'Floral Top - Blue M', 1200, 1500, 12, '["/images/products/top-1.jpg"]', 'M', 'Blue', 'Cotton Blend', 1, 0, 8, 5, 15, datetime('now'), datetime('now')),
('pv-to-001-6', 'prod-to-001', 'TO-FLO-BLU-L', 'Floral Top - Blue L', 1200, 1500, 10, '["/images/products/top-1.jpg"]', 'L', 'Blue', 'Cotton Blend', 1, 0, 8, 5, 15, datetime('now'), datetime('now')),

-- Men Kurta Pyjama Variants (Size variations)
('pv-me-001-1', 'prod-me-001', 'ME-KUR-S', 'Men Kurta Pyjama - Size S', 3000, 3500, 12, '["/images/products/men-1.jpg"]', 'S', 'White', 'Cotton', 1, 0, 5, 4, 10, datetime('now'), datetime('now')),
('pv-me-001-2', 'prod-me-001', 'ME-KUR-M', 'Men Kurta Pyjama - Size M', 3000, 3500, 12, '["/images/products/men-1.jpg"]', 'M', 'White', 'Cotton', 1, 1, 5, 4, 10, datetime('now'), datetime('now')),
('pv-me-001-3', 'prod-me-001', 'ME-KUR-L', 'Men Kurta Pyjama - Size L', 3000, 3500, 10, '["/images/products/men-1.jpg"]', 'L', 'White', 'Cotton', 1, 0, 5, 4, 10, datetime('now'), datetime('now')),
('pv-me-001-4', 'prod-me-001', 'ME-KUR-XL', 'Men Kurta Pyjama - Size XL', 3000, 3500, 8, '["/images/products/men-1.jpg"]', 'XL', 'White', 'Cotton', 1, 0, 5, 4, 10, datetime('now'), datetime('now'));

-- ============================================
-- SUMMARY
-- ============================================
-- Categories: 7
-- Products: 35
-- Product Variants: 20
-- Users: 9 (1 admin + 3 staff + 5 customers)
-- Addresses: 3
-- Orders: 4
-- Order Items: 6
-- Cart Items: 3
-- Wishlist Items: 5
-- Product Reviews: 7
-- Stories: 5
-- Reels: 5
-- Promotions: 3
-- Banners: 3
-- Homepage Settings: 7
-- Inventory Alerts: 3
-- Admin Logs: 5
-- Posts: 3
-- Site Settings: 1
-- Payment Gateways: 3
-- Shipping Carriers: 2
-- Email Services: 1
-- Analytics Integrations: 1

-- Re-enable foreign key constraints after seeding
PRAGMA foreign_keys = ON;
