# Remote D1 Database Seeding Instructions

## Problem
The remote D1 database has an older schema with the column named `order` instead of `displayOrder` for the stories, reels, and promotions tables.

## Solution
Use the `seed-remote-simple.sql` file which is compatible with your existing remote D1 database schema.

## How to Seed the Remote D1 Database

Run this command from your project root directory:

```bash
wrangler d1 execute scommerce-db --remote --file=db/seed-remote-simple.sql
```

## What This Seed File Contains

This will create the following test data:

### Categories (7)
- Lehengas
- Sarees
- Salwar Suits
- Kurtas
- Tops
- Gowns
- Menswear

### Products (7 with variants)
- **Red Bridal Lehenga** - 3 size variants (S, M, L) with `hasVariants = 1`
- **Silk Banarasi Saree** - 3 color variants (Red, Green, Blue) with `hasVariants = 1`
- **Anarkali Suit** - 4 size variants (S, M, L, XL) with `hasVariants = 0`
- **Embroidered Kurta** - 4 size/color variants with `hasVariants = 0`
- Floral Top
- Evening Gown
- Men Kurta Pyjama

### Users (6)
- Admin: `admin@scommerce.com` / `admin123`
- Staff: `rahul@scommerce.com` / `staff123`
- Staff: `priya@scommerce.com` / `staff123`
- Customer: `fatema@example.com` / `customer123`
- Customer: `noor@example.com` / `customer123`
- Customer: `sara@example.com` / `customer123`

### Other Data
- 2 Stories
- 2 Reels
- 2 Promotions
- 2 Banners
- 2 Orders with items
- Cart Items
- Wishlist Items
- Product Reviews
- Homepage Settings
- Site Settings

## Product Variations Note

Products with variants:
- **Red Bridal Lehenga** - Has 3 size variants (S, M, L), all with `isActive = 1`, one marked `isDefault = 1`
- **Silk Banarasi Saree** - Has 3 color variants (Red, Green, Blue), all with `isActive = 1`, one marked `isDefault = 1`

These products have `hasVariants = 1` in the database, so the product page will display the variant selector.

## After Seeding

After successful seeding, you can:
1. Login at `/login` with admin credentials
2. Access the admin dashboard at `/admin`
3. View and manage products, orders, categories, etc.
4. The dashboard stats API should work correctly
5. Orders should load properly
6. Product creation and order creation should work
7. Product variations should be visible on product pages

## Troubleshooting

If you encounter any issues:
1. Check that the D1 database binding is correct in your `wrangler.toml`
2. Make sure you're using the correct D1 database name: `scommerce-db`
3. Try running the seed command again (it uses `INSERT OR IGNORE` so it's safe to re-run)

## Notes

- The seed file uses `INSERT OR IGNORE` to avoid duplicate data
- This seed file is specifically for the remote D1 database with the older schema
- For local development, use the Prisma seed: `bun run db:seed` or `bun prisma db seed`
