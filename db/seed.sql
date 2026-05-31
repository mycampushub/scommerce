-- Seed Data for SCommerce E-commerce Platform
-- Run this after schema.sql to populate initial data

-- Insert Site Settings
INSERT INTO site_settings (id, site_name, currency, currency_symbol, tax_rate, free_shipping_threshold, base_shipping_cost, contact_email, contact_phone)
VALUES (
  'default-settings',
  'SCommerce',
  'BDT',
  '৳',
  0.18,
  5000,
  150,
  'info@scommerce.com',
  '+8801700000000'
);

-- Insert Default Admin User (password: admin123)
INSERT INTO users (id, email, name, password, role, email_verified)
VALUES (
  'admin-001',
  'admin@scommerce.com',
  'Admin User',
  '$2a$10$8K1p/a0dL3xQZQdZQZQZQeHhRJgY4t6QZQZQZQZQZQZQZQZQZQZQ',
  'admin',
  1
);

-- Insert Categories
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
('cat-saree', 'Sarees', 'saree', 'Beautiful traditional sarees for every occasion', 1, 1),
('cat-salwar', 'Salwar Suits', 'salwar', 'Elegant salwar suits for modern women', 1, 2),
('cat-lehengas', 'Lehengas', 'lehengas', 'Stunning lehengas for special occasions', 1, 3),
('cat-kurtas', 'Kurtas', 'kurtas', 'Comfortable and stylish kurtas', 1, 4),
('cat-menswear', 'Menswear', 'menswear', 'Trendy menswear collection', 1, 5),
('cat-gowns', 'Gowns', 'gowns', 'Elegant gowns for formal events', 1, 6),
('cat-tops', 'Tops', 'tops', 'Casual and formal tops', 1, 7),
('cat-accessories', 'Accessories', 'accessories', 'Fashion accessories to complete your look', 1, 8);

-- Insert Brands
INSERT INTO brands (id, name, slug, description, country, is_active, featured, sort_order) VALUES
('brand-001', 'Luxury Sarees', 'luxury-sarees', 'Premium quality silk sarees', 'India', 1, 1, 1),
('brand-002', 'Modern Fashion', 'modern-fashion', 'Contemporary ethnic wear', 'Bangladesh', 1, 1, 2),
('brand-003', 'Elegant Style', 'elegant-style', 'Traditional with modern touch', 'Pakistan', 1, 0, 3),
('brand-004', 'Royal Collection', 'royal-collection', 'Luxury bridal wear', 'India', 1, 1, 4);

-- Insert Sample Products
INSERT INTO products (id, name, slug, description, category_id, price, base_price, compare_price, images, stock, is_active, is_featured, has_variants, brand_id, material, color, available_sizes, available_colors) VALUES
('prod-001', 'Silk Saree - Royal Blue', 'silk-saree-royal-blue', 'Pure silk saree with intricate golden embroidery', 'cat-saree', 3500, 3500, 4500, '["https://example.com/saree-1.jpg"]', 50, 1, 1, 0, 'brand-001', 'Silk', 'Blue', '["6m", "6.5m"]', '["Blue", "Gold"]'),
('prod-002', 'Cotton Salwar Suit', 'cotton-salwar-suit', 'Comfortable cotton salwar suit with embroidery', 'cat-salwar', 1800, 1800, 2200, '["https://example.com/salwar-1.jpg"]', 30, 1, 1, 0, 'brand-002', 'Cotton', 'Green', '["S", "M", "L", "XL"]', '["Green", "Pink"]'),
('prod-003', 'Bridal Lehenga', 'bridal-lehenga', 'Heavy work bridal lehenga with dupatta', 'cat-lehengas', 15000, 15000, 18000, '["https://example.com/lehenga-1.jpg"]', 15, 1, 1, 0, 'brand-004', 'Velvet', 'Red', '["S", "M", "L"]', '["Red", "Maroon"]'),
('prod-004', 'Cotton Kurta', 'cotton-kurta', 'Casual cotton kurta for everyday wear', 'cat-kurtas', 800, 800, 1000, '["https://example.com/kurta-1.jpg"]', 100, 1, 1, 0, 'brand-002', 'Cotton', 'White', '["S", "M", "L", "XL", "XXL"]', '["White", "Blue", "Grey"]'),
('prod-005', 'Formal Shirt', 'formal-shirt', 'Premium cotton formal shirt', 'cat-menswear', 1200, 1200, 1500, '["https://example.com/shirt-1.jpg"]', 75, 1, 0, 0, 'brand-003', 'Cotton', 'White', '["S", "M", "L", "XL"]', '["White", "Light Blue"]'),
('prod-006', 'Evening Gown', 'evening-gown', 'Elegant evening gown for parties', 'cat-gowns', 8000, 8000, 10000, '["https://example.com/gown-1.jpg"]', 20, 1, 1, 0, 'brand-004', 'Silk', 'Black', '["S", "M", "L"]', '["Black", "Navy"]'),
('prod-007', 'Casual Top', 'casual-top', 'Comfortable casual top', 'cat-tops', 600, 600, 800, '["https://example.com/top-1.jpg"]', 80, 1, 0, 0, 'brand-002', 'Cotton', 'Pink', '["S", "M", "L", "XL"]', '["Pink", "Yellow", "White"]');

-- Insert Sample Product Variants
INSERT INTO product_variants (id, product_id, sku, name, price, stock, size, color, is_active, is_default) VALUES
('var-001-1', 'prod-001', 'SAREE-BLUE-6M', 'Silk Saree - 6m', 3500, 25, '6m', 'Blue', 1, 1),
('var-001-2', 'prod-001', 'SAREE-BLUE-6.5M', 'Silk Saree - 6.5m', 3600, 25, '6.5m', 'Blue', 1, 0),
('var-002-1', 'prod-002', 'SALWAR-GREEN-S', 'Cotton Salwar - Small', 1800, 10, 'S', 'Green', 1, 0),
('var-002-2', 'prod-002', 'SALWAR-GREEN-M', 'Cotton Salwar - Medium', 1800, 10, 'M', 'Green', 1, 1),
('var-002-3', 'prod-002', 'SALWAR-GREEN-L', 'Cotton Salwar - Large', 1800, 10, 'L', 'Green', 1, 0),
('var-003-1', 'prod-003', 'LEHENGA-RED-S', 'Bridal Lehenga - Small', 15000, 5, 'S', 'Red', 1, 0),
('var-003-2', 'prod-003', 'LEHENGA-RED-M', 'Bridal Lehenga - Medium', 15000, 5, 'M', 'Red', 1, 1),
('var-003-3', 'prod-003', 'LEHENGA-RED-L', 'Bridal Lehenga - Large', 15000, 5, 'L', 'Red', 1, 0);

-- Insert Banners
INSERT INTO banners (id, title, description, image, button_text, button_link, is_active, order_index) VALUES
('banner-001', 'New Collection', 'Explore our latest arrivals', 'https://example.com/banner-1.jpg', 'Shop Now', '/shop', 1, 1),
('banner-002', 'Special Offers', 'Up to 50% off on selected items', 'https://example.com/banner-2.jpg', 'View Deals', '/shop?sale=true', 1, 2),
('banner-003', 'Free Shipping', 'Free shipping on orders over ৳5000', 'https://example.com/banner-3.jpg', 'Learn More', '/shipping', 1, 3);

-- Insert Reels
INSERT INTO reels (id, title, thumbnail, video_url, product_ids, is_active, order_index) VALUES
('reel-001', 'Summer Collection', 'https://example.com/reel-thumb-1.jpg', 'https://example.com/reel-1.mp4', '["prod-001", "prod-002"]', 1, 1),
('reel-002', 'Bridal Special', 'https://example.com/reel-thumb-2.jpg', 'https://example.com/reel-2.mp4', '["prod-003"]', 1, 2),
('reel-003', 'Casual Wear', 'https://example.com/reel-thumb-3.jpg', 'https://example.com/reel-3.mp4', '["prod-004", "prod-005"]', 1, 3);

-- Insert Stories
INSERT INTO stories (id, title, thumbnail, images, is_active, order_index) VALUES
('story-001', 'New Arrivals', 'https://example.com/story-thumb-1.jpg', '["https://example.com/story-1.jpg", "https://example.com/story-2.jpg"]', 1, 1),
('story-002', 'Trending Now', 'https://example.com/story-thumb-2.jpg', '["https://example.com/story-3.jpg", "https://example.com/story-4.jpg"]', 1, 2),
('story-003', 'Best Sellers', 'https://example.com/story-thumb-3.jpg', '["https://example.com/story-5.jpg", "https://example.com/story-6.jpg"]', 1, 3);

-- Insert Homepage Settings
INSERT INTO homepage_settings (id, section_name, is_enabled, auto_play, display_limit) VALUES
('hero-enabled', 'hero', 1, 5000, 5),
('brands-enabled', 'brands', 1, 5000, 10),
('featured-products-enabled', 'featured-products', 1, 3000, 10),
('reels-enabled', 'reels', 1, 3000, 10),
('category-carousel-enabled', 'category-carousel', 1, 4000, 8),
('stories-enabled', 'stories', 1, 4000, 5),
('marquee-enabled', 'marquee', 1, 0, 1),
('mosaic-grid-enabled', 'mosaic-grid', 1, 0, 6);

-- Insert Promotions
INSERT INTO promotions (id, title, description, image, promo_code, discount_type, discount_value, min_order_amount, is_active, order_index) VALUES
('promo-001', 'First Order Discount', 'Get 10% off on your first order', 'https://example.com/promo-1.jpg', 'FIRST10', 'percentage', 10, 1000, 1, 1),
('promo-002', 'Summer Sale', 'Flat ৳500 off on orders above ৳3000', 'https://example.com/promo-2.jpg', 'SUMMER500', 'fixed', 500, 3000, 1, 2);

-- Insert Page SEO
INSERT INTO page_seo (id, page_path, page_title, meta_title, meta_description, keywords, is_active) VALUES
('seo-home', '/', 'SCommerce - Your Fashion Destination', 'SCommerce - Best Ethnic Wear Collection', 'Shop the latest collection of sarees, salwar suits, lehengas, and more at SCommerce. Free shipping on orders over ৳5000.', 'sarees, salwar suits, lehengas, kurtas, ethnic wear, fashion, online shopping', 1),
('seo-shop', '/shop', 'Shop - SCommerce', 'Shop All Products - SCommerce', 'Browse our complete collection of ethnic wear and fashion items.', 'shop, products, online shopping', 1),
('seo-about', '/about', 'About Us - SCommerce', 'About SCommerce', 'Learn about SCommerce and our commitment to quality fashion.', 'about us, company, fashion', 1),
('seo-contact', '/contact', 'Contact Us - SCommerce', 'Contact SCommerce', 'Get in touch with us for any queries or support.', 'contact, support, help', 1);

-- Insert Default Suppliers
INSERT INTO suppliers (id, code, name, email, phone, is_active) VALUES
('sup-001', 'SUP001', 'Fashion Hub Ltd', 'contact@fashionhub.com', '+8801700000001', 1),
('sup-002', 'SUP002', 'Textile World', 'info@textileworld.com', '+8801700000002', 1),
('sup-003', 'SUP003', 'Premium Fabrics', 'sales@premiumfabrics.com', '+8801700000003', 1);

-- Insert Default Email Service
INSERT INTO email_services (id, name, provider, from_email, from_name, is_active, is_default) VALUES
('email-default', 'Default SMTP', 'custom', 'noreply@scommerce.com', 'SCommerce', 1, 1);

-- Insert Default Payment Gateway
INSERT INTO payment_gateways (id, name, provider, is_active, is_default) VALUES
('payment-cod', 'Cash on Delivery', 'custom', 1, 1);

-- Insert Default Shipping Carrier
INSERT INTO shipping_carriers (id, name, provider, is_active, is_default) VALUES
('shipping-default', 'Standard Delivery', 'custom', 1, 1);