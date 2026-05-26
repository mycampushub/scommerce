# Brand & Category Pages Implementation Plan

## Overview

Design brand and category pages to mirror the homepage structure but with content scoped to specific brands or categories. Each page will have its own hero slider, stories/reels section, featured products, and full product listing.

## Current Homepage Architecture

The homepage currently includes:
- **Hero Banners** - carousel slider
- **Reels & Stories** - short-form video content
- **Featured Products** - curated product showcase
- **Brand Showcase** - brand logos
- **Category Carousel** - category navigation

## Proposed Page Structure

### Brand Page: `/brands/[slug]`
- Hero slider (brand-specific banners)
- Brand info & description
- Brand stories/reels (showcasing brand products)
- Featured products for this brand
- All brand products (with filters: price, color, size, etc.)

### Category Page: `/categories/[slug]`
- Hero slider (category-specific banners)
- Category description
- Category stories/reels (products in this category)
- Featured products for this category
- All category products (with filters)

---

## Database Schema Changes

### 1. Modify `banners` Table

Add scoping fields to support brand/category-specific banners:

```prisma
model banners {
  id          Int      @id @default(autoincrement())
  title       String
  subtitle    String?
  image       String
  link        String?
  btnText     String?
  btnLink     String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)

  // NEW: Scoping fields
  entityType  String?  // 'brand' | 'category' | null (null = homepage)
  entityId    Int?     // brand.id or category.id

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2. Modify `reels` Table

Add scoping fields to support brand/category-specific reels:

```prisma
model reels {
  id          Int      @id @default(autoincrement())
  title       String
  thumbnail   String
  videoUrl    String
  link        String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)

  // NEW: Scoping fields
  entityType  String?  // 'brand' | 'category' | null (null = homepage)
  entityId    Int?     // brand.id or category.id

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3. Add New `featured_products_sets` Table

Create curated featured product sets for different entities:

```prisma
model featured_products_sets {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  entityType  String   // 'brand' | 'category' | 'homepage'
  entityId    Int?     // brand.id, category.id, or null for homepage
  productIds  String   // JSON array of product IDs
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([entityType, entityId])
}
```

---

## Migration Script

```sql
-- Add scoping fields to banners
ALTER TABLE banners ADD COLUMN entityType TEXT;
ALTER TABLE banners ADD COLUMN entityId INTEGER;

-- Add scoping fields to reels
ALTER TABLE reels ADD COLUMN entityType TEXT;
ALTER TABLE reels ADD COLUMN entityId INTEGER;

-- Create featured_products_sets table
CREATE TABLE IF NOT EXISTS featured_products_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  entityType TEXT NOT NULL,
  entityId INTEGER,
  productIds TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_featured_products_sets_entity ON featured_products_sets(entityType, entityId);
```

---

## API Endpoints

### Brand-Specific Content

```typescript
// Get brand details
GET /api/brands/[slug]

// Get brand-specific banners
GET /api/brands/[slug]/banners
// Query params: active=true|false

// Get brand-specific reels
GET /api/brands/[slug]/reels
// Query params: active=true|false

// Get brand-specific featured products
GET /api/brands/[slug]/featured-products
// Query params: active=true|false

// Get all brand products (with pagination & filters)
GET /api/brands/[slug]/products?page=1&limit=20&sort=price&order=asc&minPrice=100&maxPrice=500
```

### Category-Specific Content

```typescript
// Get category details
GET /api/categories/[slug]

// Get category-specific banners
GET /api/categories/[slug]/banners

// Get category-specific reels
GET /api/categories/[slug]/reels

// Get category-specific featured products
GET /api/categories/[slug]/featured-products

// Get all category products (with pagination & filters)
GET /api/categories/[slug]/products?page=1&limit=20&sort=price&order=asc
```

### Admin Management Endpoints

```typescript
// Banners with scope
GET /api/admin/homepage/banners?entityType=brand&entityId=1
POST /api/admin/homepage/banners
PUT /api/admin/homepage/banners/[id]
DELETE /api/admin/homepage/banners/[id]

// Reels with scope
GET /api/admin/homepage/reels?entityType=brand&entityId=1
POST /api/admin/homepage/reels
PUT /api/admin/homepage/reels/[id]
DELETE /api/admin/homepage/reels/[id]

// Featured product sets
GET /api/admin/homepage/featured-sets?entityType=brand&entityId=1
POST /api/admin/homepage/featured-sets
PUT /api/admin/homepage/featured-sets/[id]
DELETE /api/admin/homepage/featured-sets/[id]
```

---

## Component Architecture

### Reusable Components

These existing components will be reused with scoping:

```tsx
// Hero slider with scoped banners
<HeroSlider banners={banners} entityType="brand" entityId={brandId} />

// Reels section with scoped content
<ReelsSection reels={reels} title={`${brand.name} Stories`} />

// Featured products grid
<FeaturedProductsGrid
  products={featuredProducts}
  title={`Featured ${brand.name} Products`}
/>

// Product grid with filters
<ProductGrid
  products={products}
  filters={filters}
  onFilterChange={handleFilterChange}
/>
```

### New Components

```tsx
// Brand header component
<BrandHeader brand={brand} stats={{ productCount, avgRating }} />

// Category header component
<CategoryHeader category={category} subcategories={subcategories} />

// Product filters sidebar
<ProductFilters
  filters={filters}
  availableFilters={availableFilters}
  onChange={handleFilterChange}
/>
```

---

## Page Implementation Examples

### Brand Page: `app/brands/[slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { getBrandBySlug, getBannersForBrand, getReelsForBrand } from '@/lib/queries';

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) notFound();

  const [banners, reels, featuredProducts, allProducts] = await Promise.all([
    getBannersForBrand(brand.id, true),
    getReelsForBrand(brand.id, true),
    getFeaturedProductsForBrand(brand.id, true),
    getProductsByBrand(brand.id, { page: 1, limit: 20 }),
  ]);

  return (
    <div className="min-h-screen">
      {/* Brand-specific hero slider */}
      {banners.length > 0 && <HeroSlider banners={banners} />}

      {/* Brand info header */}
      <BrandHeader brand={brand} />

      {/* Brand-specific stories/reels */}
      {reels.length > 0 && (
        <ReelsSection reels={reels} title={`${brand.name} Stories`} />
      )}

      {/* Featured products for this brand */}
      {featuredProducts.length > 0 && (
        <FeaturedProductsGrid
          products={featuredProducts}
          title={`Featured ${brand.name} Products`}
        />
      )}

      {/* All brand products with filters */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">All {brand.name} Products</h2>
          <ProductGrid products={allProducts} />
        </div>
      </section>
    </div>
  );
}
```

### Category Page: `app/categories/[slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getBannersForCategory, getReelsForCategory } from '@/lib/queries';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const [banners, reels, featuredProducts, allProducts, subcategories] = await Promise.all([
    getBannersForCategory(category.id, true),
    getReelsForCategory(category.id, true),
    getFeaturedProductsForCategory(category.id, true),
    getProductsByCategory(category.id, { page: 1, limit: 20 }),
    getSubcategories(category.id),
  ]);

  return (
    <div className="min-h-screen">
      {/* Category-specific hero slider */}
      {banners.length > 0 && <HeroSlider banners={banners} />}

      {/* Category info header */}
      <CategoryHeader category={category} subcategories={subcategories} />

      {/* Category-specific stories/reels */}
      {reels.length > 0 && (
        <ReelsSection reels={reels} title={`${category.name} Stories`} />
      )}

      {/* Featured products for this category */}
      {featuredProducts.length > 0 && (
        <FeaturedProductsGrid
          products={featuredProducts}
          title={`Featured ${category.name} Products`}
        />
      )}

      {/* All category products with filters */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">All {category.name} Products</h2>
          <ProductGrid products={allProducts} />
        </div>
      </section>
    </div>
  );
}
```

---

## Admin Management Updates

### Banners Management

Update `/admin/homepage/banners/page.tsx` to support scoping:

```tsx
// Add scope selector in create/edit dialog
<div className="space-y-4">
  <div>
    <Label>Scope</Label>
    <Select value={scope.type} onValueChange={(value) => setScope({ type: value })}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="homepage">Homepage</SelectItem>
        <SelectItem value="brand">Brand</SelectItem>
        <SelectItem value="category">Category</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {scope.type === 'brand' && (
    <div>
      <Label>Select Brand</Label>
      <Select value={scope.entityId?.toString()} onValueChange={(value) => setScope({ ...scope, entityId: parseInt(value) })}>
        <SelectTrigger>
          <SelectValue placeholder="Select a brand" />
        </SelectTrigger>
        <SelectContent>
          {brands.map(brand => (
            <SelectItem key={brand.id} value={brand.id.toString()}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}

  {scope.type === 'category' && (
    <div>
      <Label>Select Category</Label>
      <Select value={scope.entityId?.toString()} onValueChange={(value) => setScope({ ...scope, entityId: parseInt(value) })}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}
</div>
```

### Similar Updates Needed For:
- `/admin/homepage/reels/page.tsx` - Add scope selector
- `/admin/homepage/featured-sets/page.tsx` - New page for managing featured product sets

---

## Database Query Functions

Create these query functions in `lib/queries/brand.ts` and `lib/queries/category.ts`:

```typescript
// lib/queries/brand.ts
export async function getBannersForBrand(brandId: number, activeOnly: boolean = true) {
  const db = await import('@/lib/db').then(m => m.default);
  const query = activeOnly
    ? 'SELECT * FROM banners WHERE entityType = ? AND entityId = ? AND isActive = 1 ORDER BY sortOrder ASC'
    : 'SELECT * FROM banners WHERE entityType = ? AND entityId = ? ORDER BY sortOrder ASC';
  return db.all(query, ['brand', brandId]);
}

export async function getReelsForBrand(brandId: number, activeOnly: boolean = true) {
  const db = await import('@/lib/db').then(m => m.default);
  const query = activeOnly
    ? 'SELECT * FROM reels WHERE entityType = ? AND entityId = ? AND isActive = 1 ORDER BY sortOrder ASC'
    : 'SELECT * FROM reels WHERE entityType = ? AND entityId = ? ORDER BY sortOrder ASC';
  return db.all(query, ['brand', brandId]);
}

export async function getFeaturedProductsForBrand(brandId: number, activeOnly: boolean = true) {
  const db = await import('@/lib/db').then(m => m.default);
  const query = activeOnly
    ? `SELECT fps.* FROM featured_products_sets fps
       WHERE fps.entityType = 'brand' AND fps.entityId = ? AND fps.isActive = 1
       ORDER BY fps.sortOrder ASC`
    : `SELECT fps.* FROM featured_products_sets fps
       WHERE fps.entityType = 'brand' AND fps.entityId = ?
       ORDER BY fps.sortOrder ASC`;
  const sets = await db.all(query, [brandId]);

  // Fetch products for each set
  const allProductIds = sets.flatMap(set => JSON.parse(set.productIds));
  if (allProductIds.length === 0) return [];

  const products = await db.all(
    `SELECT * FROM products WHERE id IN (${allProductIds.join(',')})`
  );

  return products;
}

export async function getProductsByBrand(brandId: number, options: { page: number; limit: number; filters?: any }) {
  const db = await import('@/lib/db').then(m => m.default);
  const offset = (options.page - 1) * options.limit;

  let query = 'SELECT * FROM products WHERE brandId = ? AND isActive = 1';
  const params: any[] = [brandId];

  // Add filters
  if (options.filters?.minPrice) {
    query += ' AND price >= ?';
    params.push(options.filters.minPrice);
  }
  if (options.filters?.maxPrice) {
    query += ' AND price <= ?';
    params.push(options.filters.maxPrice);
  }

  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(options.limit, offset);

  const products = await db.all(query, params);

  // Get total count
  const countQuery = 'SELECT COUNT(*) as count FROM products WHERE brandId = ? AND isActive = 1';
  const { count } = await db.get(countQuery, [brandId]);

  return {
    products,
    pagination: {
      page: options.page,
      limit: options.limit,
      total: count,
      totalPages: Math.ceil(count / options.limit),
    },
  };
}
```

Similar functions for categories in `lib/queries/category.ts`.

---

## SEO & Meta Tags

### Brand Page SEO

```tsx
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brand = await getBrandBySlug(params.slug);
  if (!brand) return {};

  return {
    title: `${brand.name} - Shop ${brand.name} Products | SCommerce`,
    description: brand.description || `Discover ${brand.name} products. Shop the latest collection with great deals.`,
    openGraph: {
      title: brand.name,
      description: brand.description,
      images: brand.logo ? [{ url: brand.logo }] : [],
    },
  };
}
```

### Category Page SEO

```tsx
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};

  return {
    title: `${category.name} - Shop ${category.name} Products | SCommerce`,
    description: category.description || `Browse ${category.name} products. Find what you're looking for.`,
    openGraph: {
      title: category.name,
      description: category.description,
      images: category.image ? [{ url: category.image }] : [],
    },
  };
}
```

---

## Implementation Checklist

### Phase 1: Database & Backend
- [ ] Update Prisma schema with scoping fields
- [ ] Run migration script
- [ ] Create query functions for brand-specific content
- [ ] Create query functions for category-specific content
- [ ] Implement API endpoints for brand pages
- [ ] Implement API endpoints for category pages
- [ ] Update admin API endpoints to support scoping

### Phase 2: Frontend Components
- [ ] Create `BrandHeader` component
- [ ] Create `CategoryHeader` component
- [ ] Create `ProductFilters` component
- [ ] Update `HeroSlider` to support scoped banners
- [ ] Update `ReelsSection` to support scoped reels
- [ ] Update `FeaturedProductsGrid` to support entity-specific products

### Phase 3: Page Implementation
- [ ] Create `/brands/[slug]/page.tsx`
- [ ] Create `/categories/[slug]/page.tsx`
- [ ] Add SEO metadata for brand pages
- [ ] Add SEO metadata for category pages

### Phase 4: Admin Management
- [ ] Update `/admin/homepage/banners/page.tsx` with scope selector
- [ ] Update `/admin/homepage/reels/page.tsx` with scope selector
- [ ] Create `/admin/homepage/featured-sets/page.tsx`
- [ ] Add scope filtering to admin lists

### Phase 5: Testing & Optimization
- [ ] Test brand pages with and without scoped content
- [ ] Test category pages with and without scoped content
- [ ] Test admin management of scoped content
- [ ] Add database indexes for performance
- [ ] Implement caching for frequently accessed data

---

## Performance Considerations

1. **Database Indexing**: Ensure indexes on `entityType` and `entityId` columns
2. **Caching**: Cache brand/category pages and product lists
3. **Lazy Loading**: Lazy load product images and reels videos
4. **Pagination**: Implement proper pagination for product lists
5. **Image Optimization**: Use Next.js Image component with proper sizes

---

## Future Enhancements

1. **Template System**: Allow different layout templates per brand/category
2. **A/B Testing**: Test different banner arrangements
3. **Personalization**: Show personalized content based on user behavior
4. **Analytics**: Track engagement with scoped content
5. **Bulk Management**: Bulk assign banners/reels to multiple brands/categories

---

## Summary Table

| Feature | Homepage | Brand Page | Category Page |
|---------|----------|------------|---------------|
| Hero Slider | ✅ (global) | ✅ (brand-specific) | ✅ (category-specific) |
| Reels/Stories | ✅ (global) | ✅ (brand products) | ✅ (category products) |
| Featured Products | ✅ (curated) | ✅ (brand picks) | ✅ (category picks) |
| All Products | ❌ | ✅ (by brand) | ✅ (by category) |
| Filters | ❌ | ✅ (price, etc.) | ✅ (price, etc.) |
| SEO | ✅ | ✅ (brand meta) | ✅ (category meta) |
