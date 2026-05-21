# Database Setup Guide

## Fresh Database Setup

### For Local Development

```bash
# Set up the database schema
bun run db:setup

# Seed the database with sample data
bun run db:seed:d1
```

### For Cloudflare D1 (Production)

```bash
# Create a new D1 database
wrangler d1 create scommerce-db

# Update the database_id in wrangler.toml with the returned ID

# Set up the schema on remote database
wrangler d1 execute scommerce-db --remote --file=db/schema.sql

# Seed the remote database (optional)
wrangler d1 execute scommerce-db --remote --file=db/seed.sql
```

### What This Sets Up

**Tables Created:**
- users - User accounts
- categories - Product categories
- products - Products (38 columns including inventory tracking)
- product_variants - Product variants with size system
- brands - Brand information
- suppliers - Supplier information for purchase orders
- purchase_orders - Purchase order management
- purchase_order_items - Items in purchase orders
- orders - Customer orders
- order_items - Items in orders
- carts - Shopping carts
- addresses - Customer addresses
- promotions - Coupons and promotions (25 fields)
- banners - Homepage banners
- stories - Instagram-style stories
- reels - Video reels
- homepage_settings - Homepage configuration
- inventory_movements - Inventory tracking
- inventory_adjustments - Inventory adjustments
- inventory_reservations - Stock reservations
- audit_logs - Admin activity logs
- settings - Site settings

### Deploy to Cloudflare Workers

```bash
# Build for Cloudflare
npm run build:cloudflare

# Deploy
wrangler deploy
```

**Important:** Set these environment variables in Cloudflare Dashboard:
- JWT_SECRET - Generate: `openssl rand -base64 48 | tr -d '/+=' | cut -c1-64`
- ADMIN_SECRET - Generate: `openssl rand -base64 48 | tr -d '/+=' | cut -c1-64`

### Verification

After setup, verify by creating:
1. ✅ Product - Go to /admin/products and create a product
2. ✅ Category - Go to /admin/categories and create a category
3. ✅ Purchase Order - Go to /admin/purchase-orders and create a PO
4. ✅ Coupon - Go to /admin/coupons and create a coupon

All should work with a fresh database!
