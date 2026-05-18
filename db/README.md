# Database Structure

## Single Source of Truth

This project uses **Prisma** as the single source of truth for the database schema.

## Files

### Schema Files
- **`prisma/schema.prisma`** - Single source of truth for database schema (26 models)
- **`db/schema.sql`** - Auto-generated SQL schema from Prisma (for D1 deployment)

### Seed Files
- **`db/seed.sql`** - Comprehensive seed data (356 lines, covers all tables)
- **`prisma/seed-bun.ts`** - Seed script that executes seed.sql

### Database Files
- **`db/custom.db`** - Local SQLite database for development

## How It Works

### For Local Development
```bash
# Push schema to local database
bunx prisma db push

# Seed database
bun run db:seed  # Uses prisma/seed-bun.ts
```

### For Production (Cloudflare D1)
```bash
# Generate SQL schema from Prisma
bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > db/schema.sql

# Upload schema.sql to Cloudflare D1
wrangler d1 execute scommerce-db --file=db/schema.sql

# Upload seed data
wrangler d1 execute scommerce-db --file=db/seed.sql
```

### Regenerating Schema from Prisma
If you modify `prisma/schema.prisma`, regenerate the SQL schema:

```bash
bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > db/schema.sql
```

## Summary

| Before | After |
|--------|-------|
| 2 schema files (inconsistent) | 1 Prisma schema (single source of truth) |
| 3 seed files (redundant) | 1 seed file (comprehensive) |
| Multiple Prisma seed scripts | 1 simple seed script |
| Confusing architecture | Clean, maintainable structure |

## Data Models

The database includes 26 models:

- **Users & Authentication**: User, Address
- **Products**: Product, Category, ProductVariant, ProductReview
- **Orders**: Order, OrderItem, CartItem, WishlistItem
- **Content**: Banner, Story, Reel, Promotion, Post
- **Settings**: HomepageSettings, SiteSettings
- **Integrations**: PaymentGateway, ShippingCarrier, EmailService, AnalyticsIntegration
- **Admin**: AdminLog
- **Inventory**: InventoryAlert, InventoryReservation
