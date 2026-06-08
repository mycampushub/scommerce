-- Seed Data for Beauty & Personal Care E-commerce Platform
-- Complete seed with Aveeno and CeraVe products

-- Clear existing data in correct order (child tables first, then parent tables)
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
  'Beauty & Personal Care',
  'BDT',
  '৳',
  0.15,
  5000,
  150,
  'info@beautystore.com',
  '+8801700000000',
  datetime('now'),
  datetime('now')
);

-- Insert Default Admin User (password: admin123)
INSERT OR REPLACE INTO users (id, email, name, password, role, emailVerified, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin@beautystore.com',
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
  'user@beautystore.com',
  'Demo User',
  'pbkdf2$100000$3f8b7a2e1c9d4a6f8e2b3c5d7a9e1f4c6b8d0a2e4f6a8b0c2d4e6f8a0b2c4d6$8a7c5d3e1f9b2a4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4',
  'user',
  1,
  '+8801800000000',
  datetime('now'),
  datetime('now')
);

-- Insert Parent Categories (ACTIVE)
INSERT OR REPLACE INTO categories (id, name, slug, description, parentId, isActive, sortOrder, createdAt, updatedAt) VALUES
('cat-skincare', 'Skincare', 'skincare', 'Complete range of skincare products', NULL, 1, 1, datetime('now'), datetime('now')),
('cat-makeup', 'Makeup', 'makeup', 'Complete range of makeup products', NULL, 0, 2, datetime('now'), datetime('now')),
('cat-hair-care', 'Hair Care', 'hair-care', 'Complete range of hair care products', NULL, 1, 3, datetime('now'), datetime('now')),
('cat-body-care', 'Body Care', 'body-care', 'Complete range of body care products', NULL, 1, 4, datetime('now'), datetime('now')),
('cat-personal-care', 'Personal Care', 'personal-care', 'Personal care products for daily hygiene and wellness', NULL, 0, 5, datetime('now'), datetime('now')),
('cat-baby-care', 'Baby Care', 'baby-care', 'Complete range of baby care products', NULL, 1, 6, datetime('now'), datetime('now')),
('cat-mom-care', 'Mom Care', 'mom-care', 'Complete range of mom care products', NULL, 0, 7, datetime('now'), datetime('now')),
('cat-beauty-tools', 'Beauty Tools', 'beauty-tools', 'Beauty tools and accessories for makeup application', NULL, 0, 8, datetime('now'), datetime('now')),
('cat-oral-care', 'Oral Care', 'oral-care', 'Oral care products for healthy teeth and gums', NULL, 0, 9, datetime('now'), datetime('now')),
('cat-bath-shower', 'Bath & Shower', 'bath-shower', 'Bath and shower products for a relaxing experience', NULL, 0, 10, datetime('now'), datetime('now')),
('cat-sun-care', 'Sun Care', 'sun-care', 'Sun protection products for all skin types', NULL, 0, 11, datetime('now'), datetime('now')),
('cat-home-care', 'Home Care', 'home-care', 'Home care products for a clean and healthy environment', NULL, 0, 12, datetime('now'), datetime('now')),
('cat-k-beauty', 'K-Beauty', 'k-beauty', 'Korean beauty products and skincare essentials', NULL, 0, 13, datetime('now'), datetime('now'));

-- Insert Subcategories (ACTIVE for those used by Aveeno/CeraVe)
INSERT OR REPLACE INTO categories (id, name, slug, description, parentId, isActive, sortOrder, createdAt, updatedAt) VALUES
-- Skincare Subcategories
('cat-face-wash', 'Face Wash', 'face-wash', 'Premium face wash products', 'cat-skincare', 1, 1, datetime('now'), datetime('now')),
('cat-cleanser', 'Cleanser', 'cleanser', 'Premium cleanser products', 'cat-skincare', 1, 2, datetime('now'), datetime('now')),
('cat-toner', 'Toner', 'toner', 'Premium toner products', 'cat-skincare', 0, 3, datetime('now'), datetime('now')),
('cat-serum', 'Serum', 'serum', 'Premium serum products', 'cat-skincare', 1, 4, datetime('now'), datetime('now')),
('cat-moisturizer', 'Moisturizer', 'moisturizer', 'Premium moisturizer products', 'cat-skincare', 1, 5, datetime('now'), datetime('now')),
('cat-day-cream', 'Day Cream', 'day-cream', 'Premium day cream products', 'cat-skincare', 1, 6, datetime('now'), datetime('now')),
('cat-night-cream', 'Night Cream', 'night-cream', 'Premium night cream products', 'cat-skincare', 1, 7, datetime('now'), datetime('now')),
('cat-eye-cream', 'Eye Cream', 'eye-cream', 'Premium eye cream products', 'cat-skincare', 1, 8, datetime('now'), datetime('now')),
('cat-sunscreen', 'Sunscreen', 'sunscreen', 'Premium sunscreen products', 'cat-skincare', 0, 9, datetime('now'), datetime('now')),
('cat-face-scrub', 'Face Scrub', 'face-scrub', 'Premium face scrub products', 'cat-skincare', 1, 10, datetime('now'), datetime('now')),
('cat-exfoliator', 'Exfoliator', 'exfoliator', 'Premium exfoliator products', 'cat-skincare', 0, 11, datetime('now'), datetime('now')),
('cat-lip-balm', 'Lip Balm', 'lip-balm', 'Premium lip balm products', 'cat-skincare', 0, 12, datetime('now'), datetime('now')),
-- Body Care Subcategories
('cat-body-wash', 'Body Wash', 'body-wash', 'Premium body wash products', 'cat-body-care', 1, 1, datetime('now'), datetime('now')),
('cat-body-lotion', 'Body Lotion', 'body-lotion', 'Premium body lotion products', 'cat-body-care', 1, 2, datetime('now'), datetime('now')),
('cat-body-cream', 'Body Cream', 'body-cream', 'Premium body cream products', 'cat-body-care', 1, 3, datetime('now'), datetime('now')),
('cat-body-oil', 'Body Oil', 'body-oil', 'Premium body oil products', 'cat-body-care', 0, 4, datetime('now'), datetime('now')),
('cat-hand-cream', 'Hand Cream', 'hand-cream', 'Premium hand cream products', 'cat-body-care', 0, 5, datetime('now'), datetime('now')),
-- Baby Care Subcategories
('cat-baby-lotion', 'Baby Lotion', 'baby-lotion', 'Premium baby lotion products', 'cat-baby-care', 1, 1, datetime('now'), datetime('now')),
('cat-baby-cream', 'Baby Cream', 'baby-cream', 'Premium baby cream products', 'cat-baby-care', 1, 2, datetime('now'), datetime('now')),
('cat-baby-moisturizer', 'Baby Moisturizer', 'baby-moisturizer', 'Premium baby moisturizer products', 'cat-baby-care', 0, 3, datetime('now'), datetime('now')),
('cat-baby-sunscreen', 'Baby Sunscreen', 'baby-sunscreen', 'Premium baby sunscreen products', 'cat-baby-care', 1, 4, datetime('now'), datetime('now')),
('cat-baby-oil', 'Baby Oil', 'baby-oil', 'Premium baby oil products', 'cat-baby-care', 0, 5, datetime('now'), datetime('now')),
('cat-baby-powder', 'Baby Powder', 'baby-powder', 'Premium baby powder products', 'cat-baby-care', 0, 6, datetime('now'), datetime('now')),
('cat-baby-shampoo', 'Baby Shampoo', 'baby-shampoo', 'Premium baby shampoo products', 'cat-baby-care', 0, 7, datetime('now'), datetime('now')),
('cat-baby-wash', 'Baby Wash', 'baby-wash', 'Premium baby wash products', 'cat-baby-care', 1, 8, datetime('now'), datetime('now')),
('cat-baby-soap', 'Baby Soap', 'baby-soap', 'Premium baby soap products', 'cat-baby-care', 0, 9, datetime('now'), datetime('now')),
('cat-baby-wipes', 'Baby Wipes', 'baby-wipes', 'Premium baby wipes products', 'cat-baby-care', 0, 10, datetime('now'), datetime('now')),
('cat-diaper-rash-cream', 'Diaper Rash Cream', 'diaper-rash-cream', 'Premium diaper rash cream products', 'cat-baby-care', 1, 11, datetime('now'), datetime('now')),
('cat-baby-lip-balm', 'Baby Lip Balm', 'baby-lip-balm', 'Premium baby lip balm products', 'cat-baby-care', 0, 12, datetime('now'), datetime('now')),
('cat-baby-toothpaste', 'Baby Toothpaste', 'baby-toothpaste', 'Premium baby toothpaste products', 'cat-baby-care', 0, 13, datetime('now'), datetime('now')),
('cat-baby-toothbrush', 'Baby Toothbrush', 'baby-toothbrush', 'Premium baby toothbrush products', 'cat-baby-care', 0, 14, datetime('now'), datetime('now')),
('cat-mosquito-repellent', 'Mosquito Repellent', 'mosquito-repellent', 'Premium mosquito repellent products', 'cat-baby-care', 0, 15, datetime('now'), datetime('now')),
('cat-baby-food', 'Baby Food', 'baby-food', 'Premium baby food products', 'cat-baby-care', 0, 16, datetime('now'), datetime('now')),
('cat-baby-formula', 'Baby Formula', 'baby-formula', 'Premium baby formula products', 'cat-baby-care', 0, 17, datetime('now'), datetime('now')),
('cat-baby-diaper', 'Baby Diaper', 'baby-diaper', 'Premium baby diaper products', 'cat-baby-care', 0, 18, datetime('now'), datetime('now')),
('cat-feeding-bottle', 'Feeding Bottle', 'feeding-bottle', 'Premium feeding bottle products', 'cat-baby-care', 0, 19, datetime('now'), datetime('now')),
('cat-feeding-nipple', 'Feeding Nipple', 'feeding-nipple', 'Premium feeding nipple products', 'cat-baby-care', 0, 20, datetime('now'), datetime('now')),
('cat-bottle-cleaner', 'Bottle Cleaner', 'bottle-cleaner', 'Premium bottle cleaner products', 'cat-baby-care', 0, 21, datetime('now'), datetime('now')),
('cat-bottle-brush', 'Bottle Brush', 'bottle-brush', 'Premium bottle brush products', 'cat-baby-care', 0, 22, datetime('now'), datetime('now')),
('cat-bottle-warmer', 'Bottle Warmer', 'bottle-warmer', 'Premium bottle warmer products', 'cat-baby-care', 0, 23, datetime('now'), datetime('now')),
-- Hair Care Subcategories
('cat-shampoo', 'Shampoo', 'shampoo', 'Premium shampoo products', 'cat-hair-care', 1, 1, datetime('now'), datetime('now')),
('cat-conditioner', 'Conditioner', 'conditioner', 'Premium conditioner products', 'cat-hair-care', 1, 2, datetime('now'), datetime('now')),
('cat-hair-oil', 'Hair Oil', 'hair-oil', 'Premium hair oil products', 'cat-hair-care', 0, 3, datetime('now'), datetime('now')),
('cat-hair-serum', 'Hair Serum', 'hair-serum', 'Premium hair serum products', 'cat-hair-care', 0, 4, datetime('now'), datetime('now')),
('cat-hair-mask', 'Hair Mask', 'hair-mask', 'Premium hair mask products', 'cat-hair-care', 0, 5, datetime('now'), datetime('now')),
('cat-hair-cream', 'Hair Cream', 'hair-cream', 'Premium hair cream products', 'cat-hair-care', 0, 6, datetime('now'), datetime('now')),
('cat-scalp-treatment', 'Scalp Treatment', 'scalp-treatment', 'Premium scalp treatment products', 'cat-hair-care', 0, 7, datetime('now'), datetime('now')),
('cat-hair-tonic', 'Hair Tonic', 'hair-tonic', 'Premium hair tonic products', 'cat-hair-care', 0, 8, datetime('now'), datetime('now')),
('cat-hair-color', 'Hair Color', 'hair-color', 'Premium hair color products', 'cat-hair-care', 0, 9, datetime('now'), datetime('now')),
('cat-hair-styling-gel', 'Hair Styling Gel', 'hair-styling-gel', 'Premium hair styling gel products', 'cat-hair-care', 0, 10, datetime('now'), datetime('now')),
('cat-hair-wax', 'Hair Wax', 'hair-wax', 'Premium hair wax products', 'cat-hair-care', 0, 11, datetime('now'), datetime('now')),
('cat-hair-spray', 'Hair Spray', 'hair-spray', 'Premium hair spray products', 'cat-hair-care', 0, 12, datetime('now'), datetime('now')),
('cat-hair-mousse', 'Hair Mousse', 'hair-mousse', 'Premium hair mousse products', 'cat-hair-care', 0, 13, datetime('now'), datetime('now')),
('cat-heat-protectant', 'Heat Protectant', 'heat-protectant', 'Premium heat protectant products', 'cat-hair-care', 0, 14, datetime('now'), datetime('now')),
('cat-hair-growth-treatment', 'Hair Growth Treatment', 'hair-growth-treatment', 'Premium hair growth treatment products', 'cat-hair-care', 0, 15, datetime('now'), datetime('now')),
('cat-dandruff-treatment', 'Dandruff Treatment', 'dandruff-treatment', 'Premium dandruff treatment products', 'cat-hair-care', 0, 16, datetime('now'), datetime('now')),
-- Other subcategories (inactive)
('cat-cleansing-oil', 'Cleansing Oil', 'cleansing-oil', 'Premium cleansing oil products', 'cat-skincare', 0, 13, datetime('now'), datetime('now')),
('cat-cleansing-balm', 'Cleansing Balm', 'cleansing-balm', 'Premium cleansing balm products', 'cat-skincare', 0, 14, datetime('now'), datetime('now')),
('cat-micellar-water', 'Micellar Water', 'micellar-water', 'Premium micellar water products', 'cat-skincare', 0, 15, datetime('now'), datetime('now')),
('cat-toner-pads', 'Toner Pads', 'toner-pads', 'Premium toner pads products', 'cat-skincare', 0, 16, datetime('now'), datetime('now')),
('cat-essence', 'Essence', 'essence', 'Premium essence products', 'cat-skincare', 0, 17, datetime('now'), datetime('now')),
('cat-ampoule', 'Ampoule', 'ampoule', 'Premium ampoule products', 'cat-skincare', 0, 18, datetime('now'), datetime('now')),
('cat-face-oil', 'Face Oil', 'face-oil', 'Premium face oil products', 'cat-skincare', 0, 19, datetime('now'), datetime('now')),
('cat-day-night-cream', 'Day & Night Cream', 'day-night-cream', 'Premium day & night cream products', 'cat-skincare', 0, 20, datetime('now'), datetime('now')),
('cat-gel-cream', 'Gel Cream', 'gel-cream', 'Premium gel cream products', 'cat-skincare', 0, 21, datetime('now'), datetime('now')),
('cat-sleeping-mask', 'Sleeping Mask', 'sleeping-mask', 'Premium sleeping mask products', 'cat-skincare', 0, 22, datetime('now'), datetime('now')),
('cat-sheet-mask', 'Sheet Mask', 'sheet-mask', 'Premium sheet mask products', 'cat-skincare', 0, 23, datetime('now'), datetime('now')),
('cat-clay-mask', 'Clay Mask', 'clay-mask', 'Premium clay mask products', 'cat-skincare', 0, 24, datetime('now'), datetime('now')),
('cat-wash-off-mask', 'Wash Off Mask', 'wash-off-mask', 'Premium wash off mask products', 'cat-skincare', 0, 25, datetime('now'), datetime('now')),
('cat-face-pack', 'Face Pack', 'face-pack', 'Premium face pack products', 'cat-skincare', 0, 26, datetime('now'), datetime('now')),
('cat-peeling-solution', 'Peeling Solution', 'peeling-solution', 'Premium peeling solution products', 'cat-skincare', 0, 27, datetime('now'), datetime('now')),
('cat-eye-gel', 'Eye Gel', 'eye-gel', 'Premium eye gel products', 'cat-skincare', 0, 28, datetime('now'), datetime('now')),
('cat-eye-patch', 'Eye Patch', 'eye-patch', 'Premium eye patch products', 'cat-skincare', 0, 29, datetime('now'), datetime('now')),
('cat-lip-oil', 'Lip Oil', 'lip-oil', 'Premium lip oil products', 'cat-skincare', 0, 30, datetime('now'), datetime('now')),
('cat-lip-mask', 'Lip Mask', 'lip-mask', 'Premium lip mask products', 'cat-skincare', 0, 31, datetime('now'), datetime('now')),
('cat-lip-scrub', 'Lip Scrub', 'lip-scrub', 'Premium lip scrub products', 'cat-skincare', 0, 32, datetime('now'), datetime('now')),
('cat-sun-stick', 'Sun Stick', 'sun-stick', 'Premium sun stick products', 'cat-skincare', 0, 33, datetime('now'), datetime('now')),
('cat-facial-wipes', 'Facial Wipes', 'facial-wipes', 'Premium facial wipes products', 'cat-skincare', 0, 34, datetime('now'), datetime('now')),
('cat-pimple-patches', 'Pimple Patches', 'pimple-patches', 'Premium pimple patches products', 'cat-skincare', 0, 35, datetime('now'), datetime('now')),
('cat-blemish-treatment', 'Blemish Treatment', 'blemish-treatment', 'Premium blemish treatment products', 'cat-skincare', 0, 36, datetime('now'), datetime('now')),
('cat-spot-treatment', 'Spot Treatment', 'spot-treatment', 'Premium spot treatment products', 'cat-skincare', 0, 37, datetime('now'), datetime('now')),
('cat-facial-kit', 'Facial Kit', 'facial-kit', 'Premium facial kit products', 'cat-skincare', 0, 38, datetime('now'), datetime('now')),
('cat-makeup-remover', 'Makeup Remover', 'makeup-remover', 'Premium makeup remover products', 'cat-skincare', 0, 39, datetime('now'), datetime('now')),
('cat-shower-gel', 'Shower Gel', 'shower-gel', 'Premium shower gel products', 'cat-body-care', 0, 92, datetime('now'), datetime('now')),
('cat-soap', 'Soap', 'soap', 'Premium soap products', 'cat-body-care', 0, 93, datetime('now'), datetime('now')),
('cat-body-scrub', 'Body Scrub', 'body-scrub', 'Premium body scrub products', 'cat-body-care', 0, 94, datetime('now'), datetime('now')),
('cat-body-butter', 'Body Butter', 'body-butter', 'Premium body butter products', 'cat-body-care', 0, 97, datetime('now'), datetime('now')),
('cat-body-mist', 'Body Mist', 'body-mist', 'Premium body mist products', 'cat-body-care', 0, 99, datetime('now'), datetime('now')),
('cat-deodorant', 'Deodorant', 'deodorant', 'Premium deodorant products', 'cat-body-care', 0, 100, datetime('now'), datetime('now')),
('cat-roll-on', 'Roll On', 'roll-on', 'Premium roll on products', 'cat-body-care', 0, 101, datetime('now'), datetime('now')),
('cat-talcum-powder', 'Talcum Powder', 'talcum-powder', 'Premium talcum powder products', 'cat-body-care', 0, 102, datetime('now'), datetime('now')),
('cat-foot-cream', 'Foot Cream', 'foot-cream', 'Premium foot cream products', 'cat-body-care', 0, 104, datetime('now'), datetime('now')),
('cat-hand-wash', 'Hand Wash', 'hand-wash', 'Premium hand wash products', 'cat-body-care', 0, 105, datetime('now'), datetime('now')),
('cat-hand-sanitizer', 'Hand Sanitizer', 'hand-sanitizer', 'Premium hand sanitizer products', 'cat-body-care', 0, 106, datetime('now'), datetime('now')),
('cat-intimate-wash', 'Intimate Wash', 'intimate-wash', 'Premium intimate wash products', 'cat-body-care', 0, 107, datetime('now'), datetime('now')),
('cat-stretch-mark-cream', 'Stretch Mark Cream', 'stretch-mark-cream', 'Premium stretch mark cream products', 'cat-body-care', 0, 108, datetime('now'), datetime('now')),
('cat-maternity-care', 'Maternity Care', 'maternity-care', 'Premium maternity care products', 'cat-mom-care', 0, 132, datetime('now'), datetime('now')),
('cat-breast-care', 'Breast Care', 'breast-care', 'Premium breast care products', 'cat-mom-care', 0, 133, datetime('now'), datetime('now')),
('cat-nipple-cream', 'Nipple Cream', 'nipple-cream', 'Premium nipple cream products', 'cat-mom-care', 0, 134, datetime('now'), datetime('now')),
('cat-stretch-mark-care', 'Stretch Mark Care', 'stretch-mark-care', 'Premium stretch mark care products', 'cat-mom-care', 0, 135, datetime('now'), datetime('now')),
('cat-postpartum-care', 'Postpartum Care', 'postpartum-care', 'Premium postpartum care products', 'cat-mom-care', 0, 136, datetime('now'), datetime('now')),
('cat-feminine-wash', 'Feminine Wash', 'feminine-wash', 'Premium feminine wash products', 'cat-mom-care', 0, 137, datetime('now'), datetime('now')),
('cat-sanitary-napkin', 'Sanitary Napkin', 'sanitary-napkin', 'Premium sanitary napkin products', 'cat-mom-care', 0, 138, datetime('now'), datetime('now')),
('cat-panty-liners', 'Panty Liners', 'panty-liners', 'Premium panty liners products', 'cat-mom-care', 0, 139, datetime('now'), datetime('now'));

-- Insert Brands (Aveeno and CeraVe ACTIVE, others inactive)
-- Note: Only including Aveeno and CeraVe as active to keep seed file manageable
INSERT OR REPLACE INTO brands (id, name, slug, logo, description, country, isActive, featured, sortOrder, createdAt, updatedAt) VALUES
('brand-023', 'Aveeno', 'aveeno', NULL, 'Aveeno beauty products', 'USA', 1, 1, 21, datetime('now'), datetime('now')),
('brand-063', 'CeraVe', 'cerave', NULL, 'CeraVe beauty products', 'USA', 1, 1, 60, datetime('now'), datetime('now'));

-- ============================================
-- AVEENO PRODUCTS
-- ============================================

-- AVEENO BODY CARE PRODUCTS
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
-- Aveeno Daily Moisturizing Lotion
('prod-aveeno-001', 'Aveeno Daily Moisturizing Lotion', 'aveeno-daily-moisturizing-lotion', 'Naturally nourishing lotion with oat and rich emollients for 24-hour moisturization. Dermatologist recommended for dry skin.', 'cat-body-lotion', 1800, 1800, 2800, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["71g","227g","300ml","354ml","532ml","710ml"]', 1080, 1080, datetime('now'), datetime('now'));

-- Variants for Aveeno Daily Moisturizing Lotion
INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-001-1', 'prod-aveeno-001', 'AVE-ADML-71g', 'Aveeno Daily Moisturizing Lotion - 71g', 700, 1200, 50, '71g', 1, 0, 10, 5, 20, 'USA', 420, 420, datetime('now'), datetime('now')),
('var-aveeno-001-2', 'prod-aveeno-001', 'AVE-ADML-227g', 'Aveeno Daily Moisturizing Lotion - 227g', 1200, 1800, 50, '227g', 1, 0, 10, 5, 20, 'USA', 720, 720, datetime('now'), datetime('now')),
('var-aveeno-001-3', 'prod-aveeno-001', 'AVE-ADML-300ml', 'Aveeno Daily Moisturizing Lotion - 300ml', 1500, 2500, 50, '300ml', 1, 0, 10, 5, 20, 'USA', 900, 900, datetime('now'), datetime('now')),
('var-aveeno-001-4', 'prod-aveeno-001', 'AVE-ADML-354ml', 'Aveeno Daily Moisturizing Lotion - 354ml', 1800, 2800, 50, '354ml', 1, 1, 10, 5, 20, 'USA', 1080, 1080, datetime('now'), datetime('now')),
('var-aveeno-001-5', 'prod-aveeno-001', 'AVE-ADML-532ml', 'Aveeno Daily Moisturizing Lotion - 532ml', 2500, 3800, 50, '532ml', 1, 0, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now')),
('var-aveeno-001-6', 'prod-aveeno-001', 'AVE-ADML-710ml', 'Aveeno Daily Moisturizing Lotion - 710ml', 3500, 5000, 50, '710ml', 1, 0, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- Aveeno Daily Moisturizing Body Wash
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-002', 'Aveeno Daily Moisturizing Body Wash', 'aveeno-daily-moisturizing-body-wash', 'Daily body wash that moisturizes as it cleanses. Formulated with natural oat and rich emollients.', 'cat-body-wash', 2200, 2200, 3500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["300ml","532ml"]', 1320, 1320, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-002-1', 'prod-aveeno-002', 'AVE-ADMBW-300ml', 'Aveeno Daily Moisturizing Body Wash - 300ml', 1200, 2200, 50, '300ml', 1, 0, 10, 5, 20, 'USA', 720, 720, datetime('now'), datetime('now')),
('var-aveeno-002-2', 'prod-aveeno-002', 'AVE-ADMBW-532ml', 'Aveeno Daily Moisturizing Body Wash - 532ml', 2200, 3500, 50, '532ml', 1, 1, 10, 5, 20, 'USA', 1320, 1320, datetime('now'), datetime('now'));

-- Aveeno Skin Relief Moisturizing Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-003', 'Aveeno Skin Relief Moisturizing Lotion', 'aveeno-skin-relief-moisturizing-lotion', 'Moisturizing lotion with natural oat and shea butter for relief from dry, itchy skin. Fragrance-free and steroid-free.', 'cat-body-lotion', 2200, 2200, 3500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["71g","354ml","532ml"]', 1320, 1320, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-003-1', 'prod-aveeno-003', 'AVE-ASRML-71g', 'Aveeno Skin Relief Moisturizing Lotion - 71g', 800, 1300, 50, '71g', 1, 0, 10, 5, 20, 'USA', 480, 480, datetime('now'), datetime('now')),
('var-aveeno-003-2', 'prod-aveeno-003', 'AVE-ASRML-354ml', 'Aveeno Skin Relief Moisturizing Lotion - 354ml', 2200, 3500, 50, '354ml', 1, 1, 10, 5, 20, 'USA', 1320, 1320, datetime('now'), datetime('now')),
('var-aveeno-003-3', 'prod-aveeno-003', 'AVE-ASRML-532ml', 'Aveeno Skin Relief Moisturizing Lotion - 532ml', 3200, 4800, 50, '532ml', 1, 0, 10, 5, 20, 'USA', 1920, 1920, datetime('now'), datetime('now'));

-- Aveeno Skin Relief Body Wash
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-004', 'Aveeno Skin Relief Body Wash', 'aveeno-skin-relief-body-wash', 'Soothing body wash with natural oat and menthol for relief from dry, itchy skin. Gentle enough for sensitive skin.', 'cat-body-wash', 2500, 2500, 4000, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["300ml","532ml"]', 1500, 1500, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-004-1', 'prod-aveeno-004', 'AVE-ASRBW-300ml', 'Aveeno Skin Relief Body Wash - 300ml', 1500, 2500, 50, '300ml', 1, 0, 10, 5, 20, 'USA', 900, 900, datetime('now'), datetime('now')),
('var-aveeno-004-2', 'prod-aveeno-004', 'AVE-ASRBW-532ml', 'Aveeno Skin Relief Body Wash - 532ml', 2500, 4000, 50, '532ml', 1, 1, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now'));

-- Aveeno Stress Relief Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-005', 'Aveeno Stress Relief Lotion', 'aveeno-stress-relief-lotion', 'Calming lotion with natural oat, lavender, and chamomile scents for stress relief and skin hydration.', 'cat-body-lotion', 3200, 3200, 4800, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["354ml","532ml"]', 1920, 1920, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-005-1', 'prod-aveeno-005', 'AVE-ASRL-354ml', 'Aveeno Stress Relief Lotion - 354ml', 2200, 3500, 50, '354ml', 1, 0, 10, 5, 20, 'USA', 1320, 1320, datetime('now'), datetime('now')),
('var-aveeno-005-2', 'prod-aveeno-005', 'AVE-ASRL-532ml', 'Aveeno Stress Relief Lotion - 532ml', 3200, 4800, 50, '532ml', 1, 1, 10, 5, 20, 'USA', 1920, 1920, datetime('now'), datetime('now'));

-- Aveeno Stress Relief Body Wash
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-006', 'Aveeno Stress Relief Body Wash', 'aveeno-stress-relief-body-wash', 'Stress-relieving body wash with calming scents of lavender, chamomile, and ylang-ylang for a relaxing shower experience.', 'cat-body-wash', 1500, 1500, 2500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["300ml"]', 900, 900, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-006-1', 'prod-aveeno-006', 'AVE-ASRBW2-300ml', 'Aveeno Stress Relief Body Wash - 300ml', 1500, 2500, 50, '300ml', 1, 1, 10, 5, 20, 'USA', 900, 900, datetime('now'), datetime('now'));

-- Aveeno Sheer Hydration Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-007', 'Aveeno Sheer Hydration Lotion', 'aveeno-sheer-hydration-lotion', 'Lightweight, oil-free lotion with natural oat and glycerin for all-day hydration without greasy feel.', 'cat-body-lotion', 3200, 3200, 4800, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["354ml","532ml"]', 1920, 1920, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-007-1', 'prod-aveeno-007', 'AVE-ASHL-354ml', 'Aveeno Sheer Hydration Lotion - 354ml', 2200, 3500, 50, '354ml', 1, 0, 10, 5, 20, 'USA', 1320, 1320, datetime('now'), datetime('now')),
('var-aveeno-007-2', 'prod-aveeno-007', 'AVE-ASHL-532ml', 'Aveeno Sheer Hydration Lotion - 532ml', 3200, 4800, 50, '532ml', 1, 1, 10, 5, 20, 'USA', 1920, 1920, datetime('now'), datetime('now'));

-- Aveeno Tone + Texture Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-008', 'Aveeno Tone + Texture Lotion', 'aveeno-tone-texture-lotion', 'Lotion with natural oat and shea butter to improve skin tone and texture while providing deep hydration.', 'cat-body-lotion', 3500, 3500, 5500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["200ml","532ml"]', 2100, 2100, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-008-1', 'prod-aveeno-008', 'AVE-ATTL-200ml', 'Aveeno Tone + Texture Lotion - 200ml', 2200, 3500, 50, '200ml', 1, 0, 10, 5, 20, 'USA', 1320, 1320, datetime('now'), datetime('now')),
('var-aveeno-008-2', 'prod-aveeno-008', 'AVE-ATTL-532ml', 'Aveeno Tone + Texture Lotion - 532ml', 3500, 5500, 50, '532ml', 1, 1, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- Aveeno Eczema Therapy Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-009', 'Aveeno Eczema Therapy Cream', 'aveeno-eczema-therapy-cream', 'Clinically proven relief for eczema-prone skin. Colloidal oatmeal and ceramide-enriched formula.', 'cat-body-cream', 3000, 3000, 4500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["141g","206g"]', 1800, 1800, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-009-1', 'prod-aveeno-009', 'AVE-AETC-141g', 'Aveeno Eczema Therapy Cream - 141g', 2200, 3500, 50, '141g', 1, 0, 10, 5, 20, 'USA', 1320, 1320, datetime('now'), datetime('now')),
('var-aveeno-009-2', 'prod-aveeno-009', 'AVE-AETC-206g', 'Aveeno Eczema Therapy Cream - 206g', 3000, 4500, 50, '206g', 1, 1, 10, 5, 20, 'USA', 1800, 1800, datetime('now'), datetime('now'));

-- Aveeno Restorative Skin Therapy Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-010', 'Aveeno Restorative Skin Therapy Lotion', 'aveeno-restorative-skin-therapy-lotion', 'Intensive moisturizing lotion with triple oat complex for severely dry skin. Restores skin barrier.', 'cat-body-lotion', 2500, 2500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1500, 1500, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-010-1', 'prod-aveeno-010', 'AVE-ARSTL-354ml', 'Aveeno Restorative Skin Therapy Lotion - 354ml', 2500, 50, '354ml', 1, 1, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now'));

-- Aveeno Restorative Skin Therapy Balm
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-011', 'Aveeno Restorative Skin Therapy Balm', 'aveeno-restorative-skin-therapy-balm', 'Intensive skin therapy balm with triple oat complex for extra-dry, rough patches. Creates protective barrier.', 'cat-body-cream', 2800, 2800, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1680, 1680, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-011-1', 'prod-aveeno-011', 'AVE-ARSTB-312g', 'Aveeno Restorative Skin Therapy Balm - 312g', 2800, 50, '312g', 1, 1, 10, 5, 20, 'USA', 1680, 1680, datetime('now'), datetime('now'));

-- AVEENO BABY PRODUCTS
-- Aveeno Baby Daily Care Moisturising Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-001', 'Aveeno Baby Daily Care Moisturising Lotion', 'aveeno-baby-daily-care-moisturising-lotion', 'Daily moisturizing lotion formulated specially for baby''s delicate skin with natural oat extract.', 'cat-baby-lotion', 1050, 1050, 1200, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 630, 630, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-001-1', 'prod-aveeno-baby-001', 'AVE-ABDCML-150ml', 'Aveeno Baby Daily Care Moisturising Lotion - 150ml', 1050, 1200, 50, '150ml', 1, 1, 10, 5, 20, 'USA', 630, 630, datetime('now'), datetime('now'));

-- Aveeno Baby Daily Moisture Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-002', 'Aveeno Baby Daily Moisture Lotion', 'aveeno-baby-daily-moisture-lotion', 'Lightweight daily moisture lotion with natural oat extract for baby''s soft, delicate skin.', 'cat-baby-lotion', 2100, 2100, 2800, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["227ml","354ml","532ml"]', 1260, 1260, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-002-1', 'prod-aveeno-baby-002', 'AVE-ABDML-227ml', 'Aveeno Baby Daily Moisture Lotion - 227ml', 1500, 1800, 50, '227ml', 1, 0, 10, 5, 20, 'USA', 900, 900, datetime('now'), datetime('now')),
('var-aveeno-baby-002-2', 'prod-aveeno-baby-002', 'AVE-ABDML-354ml', 'Aveeno Baby Daily Moisture Lotion - 354ml', 2100, 2800, 50, '354ml', 1, 1, 10, 5, 20, 'USA', 1260, 1260, datetime('now'), datetime('now')),
('var-aveeno-baby-002-3', 'prod-aveeno-baby-002', 'AVE-ABDML-532ml', 'Aveeno Baby Daily Moisture Lotion - 532ml', 3500, 4000, 50, '532ml', 1, 0, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- Aveeno Baby Daily Moisture Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-003', 'Aveeno Baby Daily Moisture Cream', 'aveeno-baby-daily-moisture-cream', 'Rich daily moisture cream with natural oat extract for extra dry baby skin.', 'cat-baby-cream', 2000, 2000, 2500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1200, 1200, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-003-1', 'prod-aveeno-baby-003', 'AVE-ABDMC-227g', 'Aveeno Baby Daily Moisture Cream - 227g', 2000, 2500, 50, '227g', 1, 1, 10, 5, 20, 'USA', 1200, 1200, datetime('now'), datetime('now'));

-- Aveeno Baby Wash & Shampoo
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-004', 'Aveeno Baby Wash & Shampoo', 'aveeno-baby-wash-shampoo', 'Tear-free wash and shampoo formulated with natural oat extract for baby''s hair and body.', 'cat-baby-wash', 2100, 2100, 3000, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', '["236ml","354ml"]', 1260, 1260, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-004-1', 'prod-aveeno-baby-004', 'AVE-ABWS-236ml', 'Aveeno Baby Wash & Shampoo - 236ml', 1700, 2200, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1020, 1020, datetime('now'), datetime('now')),
('var-aveeno-baby-004-2', 'prod-aveeno-baby-004', 'AVE-ABWS-354ml', 'Aveeno Baby Wash & Shampoo - 354ml', 2400, 3000, 50, '354ml', 1, 1, 10, 5, 20, 'USA', 1440, 1440, datetime('now'), datetime('now'));

-- Aveeno Baby Soothing Relief Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-005', 'Aveeno Baby Soothing Relief Cream', 'aveeno-baby-soothing-relief-cream', 'Soothing relief cream with natural oat and dimethicone for baby''s dry, irritated skin.', 'cat-baby-cream', 2400, 2400, 3000, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1440, 1440, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-005-1', 'prod-aveeno-baby-005', 'AVE-ABSRC-140g', 'Aveeno Baby Soothing Relief Cream - 140g', 2400, 3000, 50, '140g', 1, 1, 10, 5, 20, 'USA', 1440, 1440, datetime('now'), datetime('now'));

-- Aveeno Baby Eczema Therapy Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-006', 'Aveeno Baby Eczema Therapy Cream', 'aveeno-baby-eczema-therapy-cream', 'Clinically proven eczema therapy cream for baby with natural oat extract and ceramides.', 'cat-baby-cream', 2850, 2850, 3500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1710, 1710, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-006-1', 'prod-aveeno-baby-006', 'AVE-ABETC-141g', 'Aveeno Baby Eczema Therapy Cream - 141g', 2850, 3500, 50, '141g', 1, 1, 10, 5, 20, 'USA', 1710, 1710, datetime('now'), datetime('now'));

-- Aveeno Baby Eczema Therapy Night Balm
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-007', 'Aveeno Baby Eczema Therapy Night Balm', 'aveeno-baby-eczema-therapy-night-balm', 'Overnight eczema therapy balm for baby with intensive moisturizing for night-time relief.', 'cat-baby-cream', 3250, 3250, 4000, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1950, 1950, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-007-1', 'prod-aveeno-baby-007', 'AVE-ABETNB-156g', 'Aveeno Baby Eczema Therapy Night Balm - 156g', 3250, 4000, 50, '156g', 1, 1, 10, 5, 20, 'USA', 1950, 1950, datetime('now'), datetime('now'));

-- Aveeno Baby Calming Comfort Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-008', 'Aveeno Baby Calming Comfort Lotion', 'aveeno-baby-calming-comfort-lotion', 'Calming lotion with lavender and vanilla scents for baby''s bedtime routine.', 'cat-baby-lotion', 2000, 2000, 2500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1200, 1200, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-008-1', 'prod-aveeno-baby-008', 'AVE-ABCCL-227ml', 'Aveeno Baby Calming Comfort Lotion - 227ml', 2000, 2500, 50, '227ml', 1, 1, 10, 5, 20, 'USA', 1200, 1200, datetime('now'), datetime('now'));

-- Aveeno Baby Calming Comfort Bath
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-009', 'Aveeno Baby Calming Comfort Bath', 'aveeno-baby-calming-comfort-bath', 'Calming bubble bath with lavender and vanilla scents for a soothing baby bath experience.', 'cat-baby-wash', 2000, 2000, 2500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1200, 1200, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-009-1', 'prod-aveeno-baby-009', 'AVE-ABCCB-236ml', 'Aveeno Baby Calming Comfort Bath - 236ml', 2000, 2500, 50, '236ml', 1, 1, 10, 5, 20, 'USA', 1200, 1200, datetime('now'), datetime('now'));

-- Aveeno Baby Continuous Protection SPF50
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-010', 'Aveeno Baby Continuous Protection SPF50', 'aveeno-baby-continuous-protection-spf50', 'Sunscreen with SPF 50 for baby with natural oat extract. Water-resistant and tear-free.', 'cat-baby-sunscreen', 2650, 2650, 3500, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1590, 1590, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-010-1', 'prod-aveeno-baby-010', 'AVE-ABCPSF50-88ml', 'Aveeno Baby Continuous Protection SPF50 - 88ml', 2650, 3500, 50, '88ml', 1, 1, 10, 5, 20, 'USA', 1590, 1590, datetime('now'), datetime('now'));

-- Aveeno Baby Barrier Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-aveeno-baby-011', 'Aveeno Baby Barrier Cream', 'aveeno-baby-barrier-cream', 'Protective diaper rash cream with zinc oxide and natural oat extract for baby''s delicate skin.', 'cat-diaper-rash-cream', 2150, 2150, 2800, 50, 1, 1, 'brand-023', 'Aveeno', 'USA', 1290, 1290, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-aveeno-baby-011-1', 'prod-aveeno-baby-011', 'AVE-ABBRC-100g', 'Aveeno Baby Barrier Cream - 100g', 2150, 2800, 50, '100g', 1, 1, 10, 5, 20, 'USA', 1290, 1290, datetime('now'), datetime('now'));

-- ============================================
-- CERAVE PRODUCTS
-- ============================================

-- CERAVE MOISTURIZERS
-- CeraVe Moisturizing Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-001', 'CeraVe Moisturizing Cream', 'cerave-moisturizing-cream', 'Rich cream with hyaluronic acid and essential ceramides for 24-hour hydration. Non-comedogenic and fragrance-free.', 'cat-body-cream', 3200, 3200, 5000, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["50ml","177ml","340g","454g","539g"]', 1920, 1920, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-001-1', 'prod-cerave-001', 'CEV-CMC-50ml', 'CeraVe Moisturizing Cream - 50ml', 1100, 1400, 50, '50ml', 1, 0, 10, 5, 20, 'USA', 660, 660, datetime('now'), datetime('now')),
('var-cerave-001-2', 'prod-cerave-001', 'CEV-CMC-177ml', 'CeraVe Moisturizing Cream - 177ml', 2300, 2800, 50, '177ml', 1, 0, 10, 5, 20, 'USA', 1380, 1380, datetime('now'), datetime('now')),
('var-cerave-001-3', 'prod-cerave-001', 'CEV-CMC-340g', 'CeraVe Moisturizing Cream - 340g', 3500, 4200, 50, '340g', 1, 0, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now')),
('var-cerave-001-4', 'prod-cerave-001', 'CEV-CMC-454g', 'CeraVe Moisturizing Cream - 454g', 4100, 5000, 50, '454g', 1, 1, 10, 5, 20, 'USA', 2460, 2460, datetime('now'), datetime('now')),
('var-cerave-001-5', 'prod-cerave-001', 'CEV-CMC-539g', 'CeraVe Moisturizing Cream - 539g', 4500, 5500, 50, '539g', 1, 0, 10, 5, 20, 'USA', 2700, 2700, datetime('now'), datetime('now'));

-- CeraVe Moisturizing Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-002', 'CeraVe Moisturizing Lotion', 'cerave-moisturizing-lotion', 'Lightweight lotion with hyaluronic acid and three essential ceramides for all-day hydration.', 'cat-body-lotion', 3650, 3650, 5200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","355ml","473ml"]', 2190, 2190, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-002-1', 'prod-cerave-002', 'CEV-CML-236ml', 'CeraVe Moisturizing Lotion - 236ml', 2400, 3000, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1440, 1440, datetime('now'), datetime('now')),
('var-cerave-002-2', 'prod-cerave-002', 'CEV-CML-355ml', 'CeraVe Moisturizing Lotion - 355ml', 3650, 4500, 50, '355ml', 1, 1, 10, 5, 20, 'USA', 2190, 2190, datetime('now'), datetime('now')),
('var-cerave-002-3', 'prod-cerave-002', 'CEV-CML-473ml', 'CeraVe Moisturizing Lotion - 473ml', 4200, 5200, 50, '473ml', 1, 0, 10, 5, 20, 'USA', 2520, 2520, datetime('now'), datetime('now'));

-- CeraVe Daily Moisturizing Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-003', 'CeraVe Daily Moisturizing Lotion', 'cerave-daily-moisturizing-lotion', 'Daily moisturizing lotion formulated with MVE technology for controlled release of ingredients over 24 hours.', 'cat-body-lotion', 3900, 3900, 4800, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","355ml"]', 2340, 2340, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-003-1', 'prod-cerave-003', 'CEV-CDML-236ml', 'CeraVe Daily Moisturizing Lotion - 236ml', 2600, 3200, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1560, 1560, datetime('now'), datetime('now')),
('var-cerave-003-2', 'prod-cerave-003', 'CEV-CDML-355ml', 'CeraVe Daily Moisturizing Lotion - 355ml', 3900, 4800, 50, '355ml', 1, 1, 10, 5, 20, 'USA', 2340, 2340, datetime('now'), datetime('now'));

-- CERAVE CLEANSERS
-- CeraVe Hydrating Cleanser
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-004', 'CeraVe Hydrating Cleanser', 'cerave-hydrating-cleanser', 'Gentle, hydrating cleanser with hyaluronic acid and ceramides for normal to dry skin.', 'cat-cleanser', 4500, 4500, 5500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","473ml","562ml"]', 2700, 2700, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-004-1', 'prod-cerave-004', 'CEV-CHC-236ml', 'CeraVe Hydrating Cleanser - 236ml', 2400, 3000, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1440, 1440, datetime('now'), datetime('now')),
('var-cerave-004-2', 'prod-cerave-004', 'CEV-CHC-473ml', 'CeraVe Hydrating Cleanser - 473ml', 4100, 5000, 50, '473ml', 1, 0, 10, 5, 20, 'USA', 2460, 2460, datetime('now'), datetime('now')),
('var-cerave-004-3', 'prod-cerave-004', 'CEV-CHC-562ml', 'CeraVe Hydrating Cleanser - 562ml', 4500, 5500, 50, '562ml', 1, 1, 10, 5, 20, 'USA', 2700, 2700, datetime('now'), datetime('now'));

-- CeraVe Foaming Cleanser
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-005', 'CeraVe Foaming Cleanser', 'cerave-foaming-cleanser', 'Foaming cleanser that deep cleans without disrupting the skin barrier. Ideal for normal to oily skin.', 'cat-face-wash', 4550, 4550, 5600, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","473ml","562ml"]', 2730, 2730, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-005-1', 'prod-cerave-005', 'CEV-CFC-236ml', 'CeraVe Foaming Cleanser - 236ml', 2500, 3200, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now')),
('var-cerave-005-2', 'prod-cerave-005', 'CEV-CFC-473ml', 'CeraVe Foaming Cleanser - 473ml', 4200, 5200, 50, '473ml', 1, 0, 10, 5, 20, 'USA', 2520, 2520, datetime('now'), datetime('now')),
('var-cerave-005-3', 'prod-cerave-005', 'CEV-CFC-562ml', 'CeraVe Foaming Cleanser - 562ml', 4550, 5600, 50, '562ml', 1, 1, 10, 5, 20, 'USA', 2730, 2730, datetime('now'), datetime('now'));

-- CeraVe SA Smoothing Cleanser
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-006', 'CeraVe SA Smoothing Cleanser', 'cerave-sa-smoothing-cleanser', 'Exfoliating cleanser with salicylic acid and ceramides for rough and bumpy skin.', 'cat-cleanser', 5000, 5000, 6200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","473ml"]', 3000, 3000, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-006-1', 'prod-cerave-006', 'CEV-CSASC-236ml', 'CeraVe SA Smoothing Cleanser - 236ml', 3000, 3800, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1800, 1800, datetime('now'), datetime('now')),
('var-cerave-006-2', 'prod-cerave-006', 'CEV-CSASC-473ml', 'CeraVe SA Smoothing Cleanser - 473ml', 5000, 6200, 50, '473ml', 1, 1, 10, 5, 20, 'USA', 3000, 3000, datetime('now'), datetime('now'));

-- CeraVe Hydrating Foaming Oil Cleanser
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-007', 'CeraVe Hydrating Foaming Oil Cleanser', 'cerave-hydrating-foaming-oil-cleanser', 'Hydrating oil cleanser that removes makeup while nourishing skin with ceramides and jojoba oil.', 'cat-cleanser', 5000, 5000, 6200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","473ml"]', 3000, 3000, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-007-1', 'prod-cerave-007', 'CEV-CHFOC-236ml', 'CeraVe Hydrating Foaming Oil Cleanser - 236ml', 3000, 3800, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 1800, 1800, datetime('now'), datetime('now')),
('var-cerave-007-2', 'prod-cerave-007', 'CEV-CHFOC-473ml', 'CeraVe Hydrating Foaming Oil Cleanser - 473ml', 5000, 6200, 50, '473ml', 1, 1, 10, 5, 20, 'USA', 3000, 3000, datetime('now'), datetime('now'));

-- CeraVe Acne Control Cleanser
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-008', 'CeraVe Acne Control Cleanser', 'cerave-acne-control-cleanser', 'Acne control cleanser with benzoyl peroxide and ceramides to treat acne and prevent future breakouts.', 'cat-cleanser', 3200, 3200, 4200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1920, 1920, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-008-1', 'prod-cerave-008', 'CEV-CACC-237ml', 'CeraVe Acne Control Cleanser - 237ml', 3200, 4200, 50, '237ml', 1, 1, 10, 5, 20, 'USA', 1920, 1920, datetime('now'), datetime('now'));

-- CeraVe Blemish Control Cleanser
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-009', 'CeraVe Blemish Control Cleanser', 'cerave-blemish-control-cleanser', 'Blemish control cleanser with niacinamide and ceramides to reduce blemishes and improve skin tone.', 'cat-cleanser', 3200, 3200, 4200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1920, 1920, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-009-1', 'prod-cerave-009', 'CEV-CBCC-236ml', 'CeraVe Blemish Control Cleanser - 236ml', 3200, 4200, 50, '236ml', 1, 1, 10, 5, 20, 'USA', 1920, 1920, datetime('now'), datetime('now'));

-- CERAVE FACE MOISTURIZERS
-- CeraVe PM Facial Moisturizing Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-010', 'CeraVe PM Facial Moisturizing Lotion', 'cerave-pm-facial-moisturizing-lotion', 'Night cream with niacinamide and ceramides for overnight skin repair and hydration.', 'cat-night-cream', 3200, 3200, 4200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1920, 1920, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-010-1', 'prod-cerave-010', 'CEV-CPFML-52ml', 'CeraVe PM Facial Moisturizing Lotion - 52ml', 3200, 4200, 50, '52ml', 1, 1, 10, 5, 20, 'USA', 1920, 1920, datetime('now'), datetime('now'));

-- CeraVe AM Facial Moisturizing Lotion SPF30
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-011', 'CeraVe AM Facial Moisturizing Lotion SPF30', 'cerave-am-facial-moisturizing-lotion-spf30', 'Daily facial moisturizer with SPF30, niacinamide, and ceramides for sun protection and hydration.', 'cat-day-cream', 3500, 3500, 4500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2100, 2100, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-011-1', 'prod-cerave-011', 'CEV-CAFMSPF30-89ml', 'CeraVe AM Facial Moisturizing Lotion SPF30 - 89ml', 3500, 4500, 50, '89ml', 1, 1, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- CeraVe Facial Moisturizing Lotion SPF50
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-012', 'CeraVe Facial Moisturizing Lotion SPF50', 'cerave-facial-moisturizing-lotion-spf50', 'Facial moisturizer with SPF50, niacinamide, and ceramides for high sun protection and hydration.', 'cat-moisturizer', 3650, 3650, 4800, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2190, 2190, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-012-1', 'prod-cerave-012', 'CEV-CFMLSPF50-52ml', 'CeraVe Facial Moisturizing Lotion SPF50 - 52ml', 3650, 4800, 50, '52ml', 1, 1, 10, 5, 20, 'USA', 2190, 2190, datetime('now'), datetime('now'));

-- CeraVe Moisturizing Cream Tube
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-013', 'CeraVe Moisturizing Cream Tube', 'cerave-moisturizing-cream-tube', 'Convenient tube format of the classic moisturizing cream for on-the-go hydration.', 'cat-moisturizer', 1100, 1100, 1400, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 660, 660, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-013-1', 'prod-cerave-013', 'CEV-CMCT-50ml', 'CeraVe Moisturizing Cream Tube - 50ml', 1100, 1400, 50, '50ml', 1, 1, 10, 5, 20, 'USA', 660, 660, datetime('now'), datetime('now'));

-- CeraVe Eye Repair Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-014', 'CeraVe Eye Repair Cream', 'cerave-eye-repair-cream', 'Eye cream with ceramides and niacinamide to reduce puffiness and dark circles.', 'cat-eye-cream', 2500, 2500, 3200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1500, 1500, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-014-1', 'prod-cerave-014', 'CEV-CERC-14ml', 'CeraVe Eye Repair Cream - 14ml', 2500, 3200, 50, '14ml', 1, 1, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now'));

-- CeraVe Healing Ointment
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-015', 'CeraVe Healing Ointment', 'cerave-healing-ointment', 'Protective ointment with ceramides for dry, cracked skin. Cuts, scrapes, and burns.', 'cat-body-cream', 4750, 4750, 6000, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["85g","340g"]', 2850, 2850, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-015-1', 'prod-cerave-015', 'CEV-CHO-85g', 'CeraVe Healing Ointment - 85g', 2500, 3200, 50, '85g', 1, 0, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now')),
('var-cerave-015-2', 'prod-cerave-015', 'CEV-CHO-340g', 'CeraVe Healing Ointment - 340g', 4750, 6000, 50, '340g', 1, 1, 10, 5, 20, 'USA', 2850, 2850, datetime('now'), datetime('now'));

-- CERAVE SERUMS & TREATMENTS
-- CeraVe Hydrating Hyaluronic Acid Serum
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-016', 'CeraVe Hydrating Hyaluronic Acid Serum', 'cerave-hydrating-hyaluronic-acid-serum', 'Hydrating serum with hyaluronic acid and ceramides for plump, hydrated skin.', 'cat-serum', 3500, 3500, 4500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2100, 2100, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-016-1', 'prod-cerave-016', 'CEV-CHHAS-30ml', 'CeraVe Hydrating Hyaluronic Acid Serum - 30ml', 3500, 4500, 50, '30ml', 1, 1, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- CeraVe Resurfacing Retinol Serum
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-017', 'CeraVe Resurfacing Retinol Serum', 'cerave-resurfacing-retinol-serum', 'Anti-aging serum with encapsulated retinol and ceramides to improve skin texture and reduce fine lines.', 'cat-serum', 3900, 3900, 5000, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2340, 2340, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-017-1', 'prod-cerave-017', 'CEV-CRRS-30ml', 'CeraVe Resurfacing Retinol Serum - 30ml', 3900, 5000, 50, '30ml', 1, 1, 10, 5, 20, 'USA', 2340, 2340, datetime('now'), datetime('now'));

-- CeraVe Skin Renewing Retinol Serum
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-018', 'CeraVe Skin Renewing Retinol Serum', 'cerave-skin-renewing-retinol-serum', 'Skin-renewing serum with retinol and ceramides for smoother, more youthful-looking skin.', 'cat-serum', 4000, 4000, 5200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2400, 2400, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-018-1', 'prod-cerave-018', 'CEV-CSRRS-30ml', 'CeraVe Skin Renewing Retinol Serum - 30ml', 4000, 5200, 50, '30ml', 1, 1, 10, 5, 20, 'USA', 2400, 2400, datetime('now'), datetime('now'));

-- CeraVe Vitamin C Serum
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-019', 'CeraVe Vitamin C Serum', 'cerave-vitamin-c-serum', 'Brightening serum with 10% pure vitamin C and ceramides for radiant, even-toned skin.', 'cat-serum', 4000, 4000, 5200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2400, 2400, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-019-1', 'prod-cerave-019', 'CEV-CVCS-30ml', 'CeraVe Vitamin C Serum - 30ml', 4000, 5200, 50, '30ml', 1, 1, 10, 5, 20, 'USA', 2400, 2400, datetime('now'), datetime('now'));

-- CeraVe Acne Control Gel
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-020', 'CeraVe Acne Control Gel', 'cerave-acne-control-gel', 'Acne treatment gel with 2% salicylic acid and ceramides to treat acne and prevent future breakouts.', 'cat-serum', 3500, 3500, 4500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2100, 2100, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-020-1', 'prod-cerave-020', 'CEV-CACG-40ml', 'CeraVe Acne Control Gel - 40ml', 3500, 4500, 50, '40ml', 1, 1, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- CeraVe Blemish Control Gel
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-021', 'CeraVe Blemish Control Gel', 'cerave-blemish-control-gel', 'Blemish control gel with niacinamide and ceramides to reduce blemishes and improve skin tone.', 'cat-serum', 3500, 3500, 4500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2100, 2100, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-021-1', 'prod-cerave-021', 'CEV-CBCG-40ml', 'CeraVe Blemish Control Gel - 40ml', 3500, 4500, 50, '40ml', 1, 1, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- CERAVE SA COLLECTION
-- CeraVe SA Smoothing Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-022', 'CeraVe SA Smoothing Cream', 'cerave-sa-smoothing-cream', 'Exfoliating cream with salicylic acid and ceramides for rough and bumpy skin relief.', 'cat-body-cream', 4650, 4650, 5800, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["177ml","340g"]', 2790, 2790, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-022-1', 'prod-cerave-022', 'CEV-CSASC2-177ml', 'CeraVe SA Smoothing Cream - 177ml', 3000, 3800, 50, '177ml', 1, 0, 10, 5, 20, 'USA', 1800, 1800, datetime('now'), datetime('now')),
('var-cerave-022-2', 'prod-cerave-022', 'CEV-CSASC2-340g', 'CeraVe SA Smoothing Cream - 340g', 4650, 5800, 50, '340g', 1, 1, 10, 5, 20, 'USA', 2790, 2790, datetime('now'), datetime('now'));

-- CeraVe SA Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, availableSizes, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-023', 'CeraVe SA Lotion', 'cerave-sa-lotion', 'Exfoliating lotion with salicylic acid and ceramides for rough and bumpy skin.', 'cat-body-lotion', 5350, 5350, 6500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', '["236ml","473ml"]', 3210, 3210, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-023-1', 'prod-cerave-023', 'CEV-CSAL-236ml', 'CeraVe SA Lotion - 236ml', 3350, 4200, 50, '236ml', 1, 0, 10, 5, 20, 'USA', 2010, 2010, datetime('now'), datetime('now')),
('var-cerave-023-2', 'prod-cerave-023', 'CEV-CSAL-473ml', 'CeraVe SA Lotion - 473ml', 5350, 6500, 50, '473ml', 1, 1, 10, 5, 20, 'USA', 3210, 3210, datetime('now'), datetime('now'));

-- CERAVE BABY
-- CeraVe Baby Moisturizing Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-024', 'CeraVe Baby Moisturizing Lotion', 'cerave-baby-moisturizing-lotion', 'Baby moisturizing lotion with ceramides and vitamins for gentle, long-lasting hydration.', 'cat-baby-lotion', 3000, 3000, 3800, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1800, 1800, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-024-1', 'prod-cerave-024', 'CEV-CBML-237ml', 'CeraVe Baby Moisturizing Lotion - 237ml', 3000, 3800, 50, '237ml', 1, 1, 10, 5, 20, 'USA', 1800, 1800, datetime('now'), datetime('now'));

-- CeraVe Baby Wash & Shampoo
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-025', 'CeraVe Baby Wash & Shampoo', 'cerave-baby-wash-shampoo', 'Tear-free baby wash and shampoo with ceramides and vitamins for gentle cleansing.', 'cat-baby-wash', 3000, 3000, 3800, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1800, 1800, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-025-1', 'prod-cerave-025', 'CEV-CBWS-237ml', 'CeraVe Baby Wash & Shampoo - 237ml', 3000, 3800, 50, '237ml', 1, 1, 10, 5, 20, 'USA', 1800, 1800, datetime('now'), datetime('now'));

-- CeraVe Baby Healing Ointment
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-026', 'CeraVe Baby Healing Ointment', 'cerave-baby-healing-ointment', 'Baby healing ointment with ceramides for diaper rash and minor skin irritations.', 'cat-diaper-rash-cream', 2500, 2500, 3200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 1500, 1500, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-026-1', 'prod-cerave-026', 'CEV-CBHO-85g', 'CeraVe Baby Healing Ointment - 85g', 2500, 3200, 50, '85g', 1, 1, 10, 5, 20, 'USA', 1500, 1500, datetime('now'), datetime('now'));

-- CERAVE ADVANCED / SPECIALTY
-- CeraVe Diabetics Dry Skin Relief Lotion
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-027', 'CeraVe Diabetics Dry Skin Relief Lotion', 'cerave-diabetics-dry-skin-relief-lotion', 'Specialized lotion for diabetic skin with ceramides and urea for intense hydration.', 'cat-body-lotion', 3500, 3500, 4500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2100, 2100, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-027-1', 'prod-cerave-027', 'CEV-CDDSRL-236ml', 'CeraVe Diabetics Dry Skin Relief Lotion - 236ml', 3500, 4500, 50, '236ml', 1, 1, 10, 5, 20, 'USA', 2100, 2100, datetime('now'), datetime('now'));

-- CeraVe Itch Relief Moisturizing Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-028', 'CeraVe Itch Relief Moisturizing Cream', 'cerave-itch-relief-moisturizing-cream', 'Itch relief cream with pramoxine and ceramides for instant relief from itchiness.', 'cat-body-cream', 5000, 5000, 6500, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 3000, 3000, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-028-1', 'prod-cerave-028', 'CEV-CIRMC-340g', 'CeraVe Itch Relief Moisturizing Cream - 340g', 5000, 6500, 50, '340g', 1, 1, 10, 5, 20, 'USA', 3000, 3000, datetime('now'), datetime('now'));

-- CeraVe Psoriasis Moisturizing Cream
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, comparePrice, stock, isActive, hasVariants, brandId, brandName, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('prod-cerave-029', 'CeraVe Psoriasis Moisturizing Cream', 'cerave-psoriasis-moisturizing-cream', 'Psoriasis treatment cream with salicylic acid and ceramides for relief from psoriasis symptoms.', 'cat-body-cream', 4700, 4700, 6200, 50, 1, 1, 'brand-063', 'CeraVe', 'USA', 2820, 2820, datetime('now'), datetime('now'));

INSERT INTO product_variants (id, productId, sku, name, price, comparePrice, stock, size, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, countryOfOrigin, totalCost, averageCost, createdAt, updatedAt) VALUES
('var-cerave-029-1', 'prod-cerave-029', 'CEV-CPMC-227g', 'CeraVe Psoriasis Moisturizing Cream - 227g', 4700, 6200, 50, '227g', 1, 1, 10, 5, 20, 'USA', 2820, 2820, datetime('now'), datetime('now'));

-- Insert Email Service
INSERT OR REPLACE INTO email_services (id, name, provider, fromEmail, fromName, isActive, isDefault, createdAt, updatedAt) VALUES
('email-default', 'Default SMTP', 'custom', 'noreply@beautystore.com', 'Beauty & Personal Care', 1, 1, datetime('now'), datetime('now'));

-- Insert Payment Gateway
INSERT OR REPLACE INTO payment_gateways (id, name, provider, isActive, isDefault, createdAt, updatedAt) VALUES
('payment-cod', 'Cash on Delivery', 'custom', 1, 1, datetime('now'), datetime('now'));

-- Insert Shipping Carrier
INSERT OR REPLACE INTO shipping_carriers (id, name, provider, isActive, isDefault, createdAt, updatedAt) VALUES
('shipping-default', 'Standard Delivery', 'custom', 1, 1, datetime('now'), datetime('now'));

-- Insert Banners
INSERT OR REPLACE INTO banners (id, title, description, image, mobileImage, buttonText, buttonLink, isActive, `order`, createdAt, updatedAt) VALUES
('banner-001', 'New Collection', 'Explore our latest arrivals', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 'Shop Now', '/shop', 1, 1, datetime('now'), datetime('now')),
('banner-002', 'Special Offers', 'Up to 50% off on selected items', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 'View Deals', '/shop?sale=true', 1, 2, datetime('now'), datetime('now')),
('banner-003', 'Free Shipping', 'Free shipping on orders over ৳5000', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 'Learn More', '/shipping', 1, 3, datetime('now'), datetime('now'));

-- Insert Homepage Settings
INSERT OR REPLACE INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, createdAt, updatedAt) VALUES
('hero-enabled', 'hero', 1, 5000, 5, NULL, datetime('now'), datetime('now')),
('brands-enabled', 'brands', 1, 5000, 10, '{"brandIds": ["brand-023", "brand-063"], "autoScroll": true, "scrollInterval": 4000, "heading": "Featured Brands", "description": "Discover top beauty brands"}', datetime('now'), datetime('now')),
('featured-products-enabled', 'featured_products', 1, 3000, 10, '{"productIds": [], "heading": "Featured Products", "description": "Discover our handpicked selection"}', datetime('now'), datetime('now')),
('category-carousel-enabled', 'category-carousel', 1, 4000, 8, '{"categoryIds": [], "heading": "Shop by Category", "description": "Explore our wide range"}', datetime('now'), datetime('now'));

-- Insert Promotions
INSERT OR REPLACE INTO promotions (id, title, description, image, ctaText, ctaLink, promoCode, discountType, discountValue, minOrderAmount, isActive, `order`, createdAt, updatedAt) VALUES
('promo-001', 'First Order Discount', 'Get 10% off on your first order', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 'Use Code FIRST10', '/shop', 'FIRST10', 'percentage', 10, 1000, 1, 1, datetime('now'), datetime('now')),
('promo-002', 'Summer Sale', 'Flat ৳500 off on orders above ৳3000', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600', 'Use Code SUMMER500', '/shop', 'SUMMER500', 'fixed', 500, 3000, 1, 2, datetime('now'), datetime('now'));

-- Insert Page SEO
INSERT OR REPLACE INTO page_seo (id, pagePath, pageTitle, metaTitle, metaDescription, keywords, ogTitle, ogDescription, isActive, createdAt, updatedAt) VALUES
('seo-home', '/', 'Beauty & Personal Care', 'Beauty & Personal Care Store', 'Shop the best beauty and personal care products at great prices.', 'beauty, skincare, makeup, personal care, cosmetics, online shopping, Bangladesh', 'Beauty & Personal Care Store', 'Your one-stop shop for all beauty needs.', 1, datetime('now'), datetime('now')),
('seo-shop', '/shop', 'Shop - Beauty Store', 'Shop All Products', 'Browse our complete collection of beauty and personal care products.', 'shop, products, beauty, cosmetics', 'Shop Beauty Products', 'Find your perfect beauty products here.', 1, datetime('now'), datetime('now'));

-- Summary output
SELECT 'SEEDING COMPLETE' AS status;
SELECT COUNT(*) AS total_categories FROM categories;
SELECT COUNT(*) AS active_categories FROM categories WHERE isActive = 1;
SELECT COUNT(*) AS total_brands FROM brands;
SELECT COUNT(*) AS active_brands FROM brands WHERE isActive = 1;
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS active_products FROM products WHERE isActive = 1;
SELECT COUNT(*) AS total_variants FROM product_variants;
SELECT COUNT(*) AS active_variants FROM product_variants WHERE isActive = 1;