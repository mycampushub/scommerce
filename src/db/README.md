# SCommerce Database Guide

This directory contains all database-related files including schema, seed data, and repository files.

## 📁 Directory Structure

```
src/db/
├── schema.sql           # Main database schema for D1
├── seed.sql             # Comprehensive seed data
├── db.ts                # Database client initialization
├── unified-db.ts        # Unified database operations
├── types.ts             # TypeScript types
└── *.repository.ts      # Data access layer for each entity
```

## 🚀 Quick Start

### For Local Development (Prisma + SQLite)

```bash
# Push schema to local database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed local database (if using Prisma seed)
npm run db:seed:prisma
```

### For Production (Cloudflare D1)

```bash
# 1. Drop all existing tables (if needed)
npm run db:drop:remote

# 2. Create fresh schema on remote D1
npm run db:setup:remote

# 3. Insert seed data on remote D1
npm run db:seed:remote
```

## 📊 Database Schema

### Core Tables

| Table | Description | Records |
|-------|-------------|---------|
| `users` | User accounts and authentication | 6 |
| `addresses` | User shipping/billing addresses | 5 |
| `categories` | Product categories | 8 |
| `products` | Product catalog | 22 |
| `product_variants` | Product size/color variants | 5 |
| `product_reviews` | Customer reviews | 8 |
| `orders` | Customer orders | 5 |
| `order_items` | Items in each order | 8 |
| `cart_items` | Shopping cart items | 6 |
| `wishlist_items` | User wishlists | 7 |

### Content Management

| Table | Description | Records |
|-------|-------------|---------|
| `banners` | Homepage banners | 3 |
| `stories` | Instagram-style stories | 3 |
| `reels` | Video reels | 3 |
| `promotions` | Marketing promotions | 3 |
| `homepage_settings` | Homepage configuration | 7 |
| `posts` | Blog posts | 4 |

### System Tables

| Table | Description | Records |
|-------|-------------|---------|
| `site_settings` | Global site configuration | 1 |
| `payment_gateways` | Payment methods | 3 |
| `shipping_carriers` | Delivery options | 3 |
| `analytics_integrations` | Analytics tools | 2 |
| `email_services` | Email providers | 2 |
| `image_gallery` | Media library | 10 |
| `admin_logs` | Admin activity logs | 8 |
| `inventory_alerts` | Stock notifications | 4 |
| `inventory_reservations` | Temporary stock holds | 3 |

## 📦 Seed Data Overview

### Users
- **Admin**: 1 account with admin role
- **Regular Users**: 5 accounts with complete profiles

### Products by Category
- **Men's Fashion**: 3 products (t-shirt, jeans, polo)
- **Women's Fashion**: 3 products (dress, blouse, handbag)
- **Electronics**: 3 products (earbuds, smart watch, power bank)
- **Home & Living**: 3 products (lamp, blanket, cushions)
- **Sports & Fitness**: 3 products (yoga mat, bands, running shoes)
- **Accessories**: 3 products (watch, wallet, sunglasses)
- **Beauty & Personal Care**: 2 products (serum, perfume)
- **Kids & Baby**: 2 products (t-shirt, toy)

### Featured Products
- 6 products marked as featured for homepage showcase

### Orders
- **Status Distribution**:
  - 1 Delivered
  - 2 Processing
  - 1 Shipped
  - 1 Pending
- **Payment Methods**: COD, bKash, Nagad

### Promo Codes
- `WELCOME10`: 10% off for new customers
- `FLASH20`: 20% off on fashion items

### Payment Gateways
- Cash on Delivery (default)
- bKash (sandbox mode)
- Nagad (sandbox mode)

### Shipping Carriers
- Standard Delivery (3-5 days, 150 BDT)
- Express Delivery (1-2 days, 300 BDT)
- Pathao (2-3 days, 120 BDT)

## 🔧 Database Scripts

### Available NPM Scripts

```bash
# Prisma Operations
npm run db:push           # Push schema to local Prisma DB
npm run db:generate       # Generate Prisma Client
npm run db:migrate        # Run migrations
npm run db:reset          # Reset local database

# D1 Operations
npm run db:setup          # Setup schema on local D1
npm run db:setup:remote   # Setup schema on remote D1
npm run db:seed           # Seed local D1
npm run db:seed:remote    # Seed remote D1
npm run db:drop           # Drop all tables from local D1
npm run db:drop:remote   # Drop all tables from remote D1
```

## 🗄️ Schema Management

### Adding New Tables

1. Add table definition to `prisma/schema.prisma`
2. Add corresponding SQL to `src/db/schema.sql`
3. Create repository file in `src/db/`
4. Run `npm run db:setup:remote` to deploy to D1

### Modifying Tables

1. Update `prisma/schema.prisma`
2. Update `src/db/schema.sql`
3. For non-destructive changes, use migration scripts
4. For destructive changes, use drop and recreate

## 📝 Seed Data Customization

### Editing Seed Data

1. Open `src/db/seed.sql`
2. Find the section you want to modify
3. Update the INSERT statements
4. Re-run `npm run db:seed:remote`

### Adding New Products

```sql
INSERT INTO products (id, name, slug, description, categoryId, price, basePrice, images, stock, isActive, isFeatured, createdAt, updatedAt)
VALUES ('prod-XXX', 'Product Name', 'product-slug', 'Description', 'cat-XXX', 1000, 1000, '["url1","url2"]', 50, 1, 1, datetime('now'), datetime('now'));
```

### Adding New Users

```sql
INSERT INTO users (id, email, name, password, role, emailVerified, createdAt, updatedAt)
VALUES ('user-XXX', 'email@example.com', 'Full Name', '$2b$10$hashed_password', 'user', 1, datetime('now'), datetime('now'));
```

## 🔍 Common Queries

### Get All Active Products
```sql
SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC;
```

### Get Orders by Status
```sql
SELECT * FROM orders WHERE status = 'PENDING' ORDER BY createdAt DESC;
```

### Get Low Stock Items
```sql
SELECT p.name, pv.stock, pv.size, pv.color
FROM products p
JOIN product_variants pv ON p.id = pv.productId
WHERE pv.stock <= pv.lowStockAlert;
```

### Get Popular Products (by usage count in gallery)
```sql
SELECT * FROM image_gallery
WHERE category = 'products'
ORDER BY usageCount DESC
LIMIT 10;
```

## ⚠️ Important Notes

1. **Foreign Key Constraints**: Always respect the order of operations when deleting/inserting data
2. **CUIDs**: Use cuid() or similar to generate unique IDs
3. **Dates**: Use ISO 8601 format or SQLite datetime() function
4. **JSON Fields**: Store as JSON strings in SQLite
5. **Boolean Fields**: SQLite uses INTEGER (0 or 1) for booleans

## 🔄 Workflow Recommendation

### For Production Deployment

```bash
# 1. Update schema in src/db/schema.sql
# 2. Update seed data in src/db/seed.sql (optional)

# 3. Backup existing data (if needed)
# Use wrangler d1 backups or export tables

# 4. Deploy to remote
npm run db:drop:remote    # Only if starting fresh
npm run db:setup:remote
npm run db:seed:remote    # Optional
```

### For Local Development

```bash
# Use Prisma for local development
npm run db:push
npm run db:generate

# Or use local D1
npm run db:setup
npm run db:seed
```

## 🐛 Troubleshooting

### Schema Error: "no such column"
**Solution**: Drop all tables and recreate schema
```bash
npm run db:drop:remote
npm run db:setup:remote
```

### Foreign Key Constraint Failed
**Solution**: Check that referenced IDs exist before inserting

### Missing image_gallery Table
**Solution**: Ensure schema.sql includes image_gallery table definition

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Last Updated**: January 2025
**Version**: 0.2.0
