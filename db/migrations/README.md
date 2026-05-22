# Cloudflare D1 Database Migrations

This directory contains SQL migration scripts for updating existing Cloudflare D1 databases.

## Recent Migration

### Add Product Color Images and Multi-Select System (add-product-color-images.sql)

This migration adds:
- `availableSizes` column to `products` table (JSON: ["S", "M", "L", "XL"])
- `availableColors` column to `products` table (JSON: ["Red", "Blue", "Green"])
- `product_color_images` table for per-color image storage
- Indexes for performance

## How to Apply Migrations

### For Local Development (wrangler dev)

```bash
# Apply migration to local D1 database
wrangler d1 execute scommerce-db --file=db/migrations/add-product-color-images.sql
```

### For Production (Remote D1 Database)

```bash
# Apply migration to remote D1 database
wrangler d1 execute scommerce-db --remote --file=db/migrations/add-product-color-images.sql
```

## New Database Setup

For brand new databases, use the full schema instead of migrations:

```bash
# Local
bun run db:setup

# Remote (Production)
bun run db:setup:remote
```

## Important Notes

1. **Backup First**: Always backup your D1 database before running migrations
2. **Test Locally**: Test migrations on local D1 first before applying to production
3. **Idempotent**: Migrations are designed to be safe to run multiple times
4. **Check Logs**: Monitor the output for any errors or warnings

## Schema vs Migrations

- **schema.sql**: Complete database schema for new databases
- **migrations/*.sql**: Incremental updates for existing databases
- Both must be kept in sync for consistency

## Rolling Back

If you need to rollback, you would need to:
1. Drop the new tables/columns (if safe to do so)
2. Restore from a backup

Always test rollback procedures before production deployment.
