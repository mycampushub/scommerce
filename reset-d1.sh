#!/bin/bash
set -e

echo "🔄 Step 1: Dropping all tables in correct order (child tables first)..."

# Drop child tables first (those with foreign keys)
wrangler d1 execute scommerce-db --remote --command "
DROP TABLE IF EXISTS inventory_alerts;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS reels;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS homepage_settings;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS payment_gateways;
DROP TABLE IF EXISTS shipping_carriers;
DROP TABLE IF EXISTS analytics_integrations;
DROP TABLE IF EXISTS email_services;
"

echo "✅ Step 2: Applying fresh schema..."
wrangler d1 execute scommerce-db --remote --file=db/schema.sql

echo "🌱 Step 3: Seeding with fresh data..."
wrangler d1 execute scommerce-db --remote --file=db/seed-remote.sql

echo "✨ Database reset complete!"
