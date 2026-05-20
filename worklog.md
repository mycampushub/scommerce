---

Task ID: 1-a
Agent: main
Task: Fix product creation and multiple size selection

Work Log:
- Updated productSchema validation to include new fields:
  - Brand fields: brandId, brandName, brandLogo
  - Size system fields: sizeType, sizeValue, sizeUnit, sizeLabel
  - Country of origin: countryOfOrigin
  - hasVariants: boolean flag for variant support

- Created MultiSizeSelector component (/src/components/admin/multi-size-selector.tsx):
  - Supports multiple size selection (S, M, L, XL or 100ml, 200ml, 500ml)
  - Two size types: Label sizes (XS, S, M, L, XL, XXL, 3XL) and Unit sizes (ml, g, kg, etc.)
  - Quick-select buttons for common sizes
  - Custom size input support
  - Visual display of selected sizes with remove option

- Updated /src/app/admin/products/page.tsx:
  - Added MultiSizeSelector import and state management
  - Modified Add Product form to include Size Selection Mode (Single vs Multiple)
  - Updated handleAddProduct to create variants automatically when multiple sizes selected
  - Fixed API response parsing: changed `result.data` to `result.products` for products API

- Ran database seed successfully:
  - 9 Users
  - 7 Categories
  - 35 Products
  - 24 Product Variants

Stage Summary:
- Product schema now accepts all new fields
- Multiple size selection implemented with automatic variant creation
- Product creation now works with single or multiple sizes
- Seeded data is now visible in admin products page
- Frontend correctly parses products API response

---
Task ID: 1
Agent: main
Task: Rearrange sidebar with expandable Inventory Management section

Work Log:
- Updated /src/app/admin/layout.tsx:
  - Added Warehouse, ChevronDown, ChevronRight icons
  - Created separate inventoryNav array with:
    - Inventory (/admin/inventory)
    - Purchase Orders (/admin/purchase-orders)
    - Suppliers (/admin/suppliers)
    - Inventory Reports (/admin/inventory/reports)
  - Removed these items from main navigation array
  - Added inventoryExpanded state to manage expand/collapse
  - Added useEffect to auto-expand inventory section when on inventory-related pages
  - Created expandable Inventory Management section with:
    - Warehouse icon as main icon
    - Chevron indicators for expand/collapse
    - Nested navigation with border-l-2 visual hierarchy
    - Active state highlighting for both parent and child items
    - Click handler to toggle expansion

Stage Summary:
- Sidebar now has expandable Inventory Management section
- Inventory items are grouped together for better organization
- Auto-expands when on inventory-related pages
- Maintains active state highlighting for nested items

---
Task ID: 3
Agent: main
Task: Fix table responsiveness for all admin pages

Work Log:
- Updated /src/app/globals.css:
  - Added .table-scrollable utility class with:
    - width: 100% and overflow-x: auto for horizontal scrolling
    - -webkit-overflow-scrolling: touch for smooth mobile scrolling
    - Custom scrollbar styling for better visibility
    - Light gray track and gray thumb with hover effect

- Updated /src/components/ui/table.tsx:
  - Added .table-scrollable class to the table container
  - Ensures all tables have consistent scrolling behavior

- Fixed admin pages by removing ScrollArea wrappers:
  - /src/app/admin/customers/page.tsx
  - /src/app/admin/inventory/page.tsx
  - /src/app/admin/categories/page.tsx
  - /src/app/admin/orders/page.tsx
  - /src/app/admin/staff/page.tsx
  - /src/app/admin/products/page.tsx
  - Changed from ScrollArea wrapper to simple overflow-x-auto div
  - Maintains horizontal scrolling without interference

- All tables already have proper min-width classes on headers and cells for mobile:
  - min-w-[100px] to min-w-[250px] on table headers
  - whitespace-nowrap on cells that shouldn't wrap
  - Consistent spacing and responsive design

Stage Summary:
- All admin tables now have proper horizontal scrolling on mobile
- Custom scrollbars are visible and user-friendly
- Tables no longer trapped in ScrollArea that interferes with horizontal scrolling
- Consistent scrolling behavior across all admin pages

---
Task ID: 5
Agent: main
Task: Update order repository to be Cloudflare-only (remove Prisma fallback)

Work Log:
- Updated /src/db/order.repository.ts to remove Prisma fallback code:
  - Removed `if (!env || !env.DB)` checks in `createOrderWithItems` method (line 441)
  - Removed all `isPrisma` conditional logic in `createOrderWithItems` method
  - Kept only D1 (raw SQL) code path for order creation, order items creation, stock updates, and inventory alerts
  - Removed Prisma fallback for inventory reservations deletion in `createOrderWithItems`

  - Removed `if (!env || !env.DB)` checks in `cancelOrderWithRestock` method (line 770)
  - Removed all `isPrisma` conditional logic in `cancelOrderWithRestock` method
  - Kept only D1 (raw SQL) code path for fetching order items, restoring stock, and order cancellation
  - Removed Prisma fallback for inventory reservations deletion in `cancelOrderWithRestock`

- Transaction logic preserved with D1 only:
  - Both methods still use `runTransaction` for atomic operations
  - All database operations use raw SQL via `db.prepare()`, `.bind()`, `.run()`, `.first()`, and `.all()`
  - Commit and rollback functionality maintained

- Simpler methods unchanged:
  - `findByOrderNumber`, `findById`, `findByUserId`, `create`, `updateStatus`, `updatePaymentStatus`, `updateTracking`, `cancel`, `refund`, `findAll`, `count`, `getItems`, `addItem`, `archiveOldOrders`, `cleanupDeletedOrders`, `getArchivedCount` remain unchanged as they were already D1-only

Stage Summary:
- Order repository is now Cloudflare D1-only, with no Prisma fallback
- Removed ~400 lines of Prisma fallback code from `createOrderWithItems` and `cancelOrderWithRestock`
- Transaction logic preserved and working with D1 raw SQL
- Both methods maintain atomicity with commit/rollback support

---
Task ID: 2-d
Agent: main
Task: Rewrite inventory-adjustment repository to use raw SQL (Cloudflare Worker compatible)

Work Log:
- Read original /home/z/my-project/src/db/inventory-adjustment.repository.ts
- Replaced all Prisma ORM calls with raw SQL queries using helper functions from @/db/db
- Updated all methods to accept `env: Env | null` parameter as the first parameter
- Converted all Prisma `include` relationships to SQL JOINs:
  - findById: Simple SELECT with no joins
  - findAll: LEFT JOIN with products and product_variants tables, using JSON_OBJECT for nested data
  - findByProduct: Calls findAll with parameters
  - create: INSERT statement with all fields
  - applyAdjustment: Multiple operations (INSERT inventory_adjustment, UPDATE products/product_variants, INSERT inventory_movements)
  - count: SELECT COUNT(*) with dynamic WHERE clause
- Replaced Prisma select fields with explicit column selection in SQL
- Replaced Prisma where conditions with dynamic SQL WHERE clause building
- Replaced Prisma orderBy with SQL ORDER BY
- Replaced Prisma take/skip with SQL LIMIT/OFFSET
- Used generateId() and now() helper functions for ID and timestamp generation
- Implemented proper JSON parsing for nested objects returned from JSON_OBJECT SQL function

Stage Summary:
- InventoryAdjustmentRepository fully migrated from Prisma to raw SQL
- All methods now Cloudflare Worker compatible with D1 database
- JOIN queries manually implemented with LEFT JOIN syntax
- Include relationships converted to JSON_OBJECT in SQL queries
- No Prisma dependencies remain in the file

---
Task ID: 2-c
Agent: main
Task: Rewrite inventory-movement repository to be Cloudflare Worker compatible

Work Log:
- Read original /home/z/my-project/src/db/inventory-movement.repository.ts
- Removed Prisma ORM imports and replaced with raw SQL helper functions from @/db/db
- Added `env: Env | null` parameter as first parameter to all methods
- Converted all methods to use raw SQL:
  - findById: LEFT JOIN with suppliers, products, and product_variants tables; formatted supplier object from joined columns
  - findAll: LEFT JOIN with suppliers, products, and product_variants tables; dynamic WHERE clause building; formatted results with supplier objects
  - findByProduct, findByMovementType, findByReference: Wrapper methods calling findAll with appropriate parameters
  - create: INSERT statement using execute() helper; generateId() and now() for ID and timestamp
  - count: SELECT COUNT(*) with dynamic WHERE clause; using count() helper function
  - getSummary: SQL aggregate functions (COUNT, SUM, CASE WHEN) for calculating totals in a single query
- Replaced Prisma include relationships with manual SQL JOINs
- Replaced Prisma aggregations with SQL aggregate functions
- Used queryFirst() and queryAll() for SELECT operations
- Used execute() for INSERT operations
- Replaced multiple database calls in original findById with a single JOIN query
- Replaced batch fetching in findAll with JOIN queries for products and variants
- Replaced array-based aggregations in getSummary with SQL aggregate functions

Stage Summary:
- InventoryMovementRepository fully migrated from Prisma to raw SQL
- All methods now Cloudflare Worker compatible with D1 database
- JOIN queries manually implemented with LEFT JOIN syntax
- Include relationships converted to manual object formatting from joined columns
- Aggregations converted to SQL aggregate functions for better performance
- No Prisma dependencies remain in the file


---
Task ID: 2-b
Agent: full-stack-developer
Task: Rewrite purchase-order.repository.ts to use raw SQL (Cloudflare-compatible)

Work Log:
- Read original /home/z/my-project/src/db/purchase-order.repository.ts
- Converted all Prisma queries to raw SQL
- Replaced JOINs with SQL JOINs
- Updated all methods to accept `env` parameter
- Wrote updated file

Stage Summary:
- Successfully converted purchase-order.repository.ts to use raw SQL
- All methods now accept env parameter for Cloudflare Workers
- All Prisma ORM calls replaced with SQL queries

---
Task ID: 4
Agent: main
Task: Update integration repository to be Cloudflare-compatible

Work Log:
- Read /home/z/my-project/src/db/integration.repository.ts (original Prisma-based implementation)
- Read /home/z/my-project/src/db/d1-integration-repository.ts (Cloudflare D1 reference implementation)
- Removed Prisma imports and replaced with raw SQL helper functions from @/db/db
  - Changed from `import { PrismaClient } from '@prisma/client'` and `import prisma from '@/lib/database'`
  - To `import { queryAll, execute, generateSecureId } from '@/db/db'`
- Updated all interfaces to use string dates instead of Date objects (ISO format):
  - PaymentGateway: createdAt, updatedAt, lastTested
  - ShippingCarrier: createdAt, updatedAt, lastTested
  - AnalyticsIntegration: createdAt, updatedAt
  - EmailService: createdAt, updatedAt, lastTested
- Added `env: Env | null` as the first parameter to all methods in IntegrationRepository class
- Replaced all Prisma ORM calls with raw SQL:
  - prisma.payment_gateways.findMany() → queryAll<PaymentGateway>(env, 'SELECT * FROM payment_gateways ORDER BY createdAt DESC')
  - prisma.payment_gateways.findUnique() → queryAll(env, 'SELECT * FROM payment_gateways WHERE id = ?', id)
  - prisma.payment_gateways.findFirst() → queryAll(env, 'SELECT * FROM payment_gateways WHERE isDefault = 1 LIMIT 1')
  - prisma.payment_gateways.create() → execute(env, 'INSERT INTO payment_gateways ...')
  - prisma.payment_gateways.update() → execute(env, 'UPDATE payment_gateways SET ...')
  - prisma.payment_gateways.delete() → execute(env, 'DELETE FROM payment_gateways WHERE id = ?', id)
  - prisma.$transaction() → Multiple sequential execute() calls
- Same patterns applied to shipping_carriers, analytics_integrations, and email_services tables
- Changed from generateId() to generateSecureId() for ID generation
- Added updatedAt field to all create operations
- Implemented dynamic UPDATE query building with partial field updates:
  - Build SET clause dynamically based on provided fields
  - Convert boolean fields (isActive, isDefault) to integer (0/1) for SQLite
  - Always update updatedAt timestamp on modifications
- Replaced boolean-to-boolean conversion with direct boolean values (SQLite stores as 0/1, returned as numbers converted to boolean by queryAll)
- Removed manual object mapping from Prisma results (SQL results directly match interfaces)

Stage Summary:
- IntegrationRepository fully migrated from Prisma to raw SQL
- All methods now Cloudflare Worker compatible with D1 database
- Supports all integration types: Payment Gateways, Shipping Carriers, Analytics Integrations, Email Services
- All methods accept `env: Env | null` parameter as required
- Uses ISO string dates instead of Date objects
- Dynamic UPDATE queries for partial field updates
- No Prisma dependencies remain in the file
---
Task ID: 9
Agent: main
Task: Update inventory report API routes to be Cloudflare-compatible

Work Log:
- Read three inventory report API route files:
  - /home/z/my-project/src/app/api/admin/inventory/reports/stock/route.ts
  - /home/z/my-project/src/app/api/admin/inventory/reports/cost-analysis/route.ts
  - /home/z/my-project/src/app/api/admin/inventory/reports/valuation/route.ts

- Updated /home/z/my-project/src/app/api/admin/inventory/reports/stock/route.ts:
  - Replaced `import { db } from '@/lib/db'` with `import { queryAll } from '@/db/db'` and `import { getEnv } from '@/lib/cloudflare'`
  - Added `const env = await getEnv(request)` to get Cloudflare env for D1 database
  - Replaced `db.products.findMany({ where, include: { categories: true, product_variants: true } })` with two raw SQL queries:
    - Products query with LEFT JOIN on categories table to get category name
    - Variants query filtered by product IDs from the first query
  - Converted Prisma WHERE conditions to dynamic SQL WHERE clause building
  - Converted Prisma include relationships to SQL JOINs
  - Grouped variants by product using a map (variantsByProduct)
  - Maintained all original business logic for stock status calculation and filtering

- Updated /home/z/my-project/src/app/api/admin/inventory/reports/cost-analysis/route.ts:
  - Replaced `import { db } from '@/lib/db'` with `import { queryAll } from '@/db/db'` and `import { getEnv } from '@/lib/cloudflare'`
  - Added `const env = await getEnv(request)` to get Cloudflare env for D1 database
  - Replaced `db.products.findMany({ where, include: { categories: true, product_variants: true } })` with two raw SQL queries:
    - Products query with LEFT JOIN on categories table
    - Variants query filtered by product IDs
  - Converted Prisma WHERE conditions (categoryId, brandId, isActive) to SQL WHERE clause
  - Converted Prisma include relationships to SQL JOINs
  - Grouped variants by product using a map (variantsByProduct)
  - Maintained all original business logic for cost analysis calculations (margin, profit, revenue, cost)
  - Preserved sorting functionality (margin, profit, cost, revenue)

- Updated /home/z/my-project/src/app/api/admin/inventory/reports/valuation/route.ts:
  - Replaced `import { db } from '@/lib/db'` with `import { queryAll } from '@/db/db'` and `import { getEnv } from '@/lib/cloudflare'`
  - Added `const env = await getEnv(request)` to get Cloudflare env for D1 database
  - Replaced `db.products.findMany({ where, include: { categories: true, product_variants: true } })` with two raw SQL queries:
    - Products query with LEFT JOIN on categories table
    - Variants query filtered by product IDs
  - Converted Prisma WHERE conditions (categoryId, brandId, countryOfOrigin, isActive) to SQL WHERE clause
  - Converted Prisma include relationships to SQL JOINs
  - Grouped variants by product using a map (variantsByProduct)
  - Maintained all original business logic for inventory valuation calculations
  - Preserved sorting by total value descending

Stage Summary:
- All three inventory report API routes migrated from Prisma to raw SQL
- All routes now Cloudflare Worker compatible with D1 database
- Prisma `db.products.findMany()` with `include` replaced by SQL JOINs and separate queries
- Prisma `where` conditions converted to dynamic SQL WHERE clauses
- All routes use `queryAll()` from `@/db/db` and `getEnv()` from `@/lib/cloudflare`
- All original business logic preserved (stock status, cost analysis, valuation calculations)
- No Prisma dependencies remain in the three API route files
---

---
Task ID: 8
Agent: main
Task: Update audit-logger.ts to be Cloudflare-only (remove Prisma fallback)

Work Log:
- Read original /home/z/my-project/src/lib/audit-logger.ts
- Removed Prisma import (`import { db } from '@/lib/db'`)
- Removed `if (!env || !env.DB)` fallback check in logAuditEvent method
- Kept only D1 (raw SQL) code path using execute() helper
- Updated getAdminAuditLogs to use raw SQL with LEFT JOIN to users table
- Updated getAllAuditLogs to use raw SQL with dynamic WHERE clause building and LEFT JOIN
- Updated getEntityAuditLogs to use raw SQL with LEFT JOIN to users table
- Reformatted results to match original structure with nested users object
- All methods now require env parameter (no Prisma fallback)
- Helper functions (getIpAddress, getUserAgent, createAuditLogOptions, logAdminAction) unchanged

Stage Summary:
- Audit logger is now Cloudflare D1-only with no Prisma dependencies
- All methods use raw SQL queries
- JOIN queries manually implemented with LEFT JOIN syntax
- Dynamic WHERE clause building for filters
---
Task ID: 10
Agent: main
Task: Update inventory adjustments API routes to be Cloudflare-compatible

Work Log:
- Read three inventory adjustment API route files:
  - /home/z/my-project/src/app/api/admin/inventory/adjustments/route.ts
  - /home/z/my-project/src/app/api/admin/inventory/adjustments/[id]/route.ts
  - /home/z/my-project/src/app/api/admin/inventory/adjustments/[id]/approve/route.ts

- Updated /home/z/my-project/src/app/api/admin/inventory/adjustments/route.ts:
  - Added `import { getEnv } from '@/lib/cloudflare'` and `import { queryFirst } from '@/db/db'`
  - Removed `import { db } from '@/lib/db'`
  - Added `const env = await getEnv()` at the start of both GET and POST handlers
  - Replaced `db.product_variants.findUnique()` with `queryFirst()` using raw SQL SELECT
  - Replaced `db.products.findUnique()` with `queryFirst()` using raw SQL SELECT
  - Updated `inventoryAdjustmentRepository.findAll()` call to pass `env` parameter
  - Updated `inventoryAdjustmentRepository.applyAdjustment()` call to pass `env` parameter
  - All business logic (validation, stock verification, warnings) preserved

- Updated /home/z/my-project/src/app/api/admin/inventory/adjustments/[id]/route.ts:
  - Added `import { getEnv } from '@/lib/cloudflare'` and `import { queryFirst, execute } from '@/db/db'`
  - Removed `import { db } from '@/lib/db'`
  - Added `const env = await getEnv()` at the start of DELETE handler
  - Replaced `db.inventory_adjustments.findUnique()` with `queryFirst()` using raw SQL SELECT
  - Replaced `db.inventory_adjustments.delete()` with `execute()` using raw SQL DELETE
  - Changed boolean check from `adjustment.approved` to `adjustment.approved === 1` for SQLite integer representation
  - All business logic (admin verification, deletion prevention for approved adjustments) preserved

- Updated /home/z/my-project/src/app/api/admin/inventory/adjustments/[id]/approve/route.ts:
  - Added `import { getEnv } from '@/lib/cloudflare'` and `import { queryFirst, execute } from '@/db/db'`
  - Removed `import { db } from '@/lib/db'`
  - Added `const env = await getEnv()` at the start of POST handler
  - Replaced `db.inventory_adjustments.findUnique()` with `queryFirst()` using raw SQL SELECT with multiple columns
  - Replaced `db.product_variants.update()` with `execute()` using raw SQL UPDATE
  - Replaced `db.products.update()` with `execute()` using raw SQL UPDATE
  - Replaced `db.inventory_adjustments.update()` with `execute()` using raw SQL UPDATE
  - Changed boolean check from `adjustment.approved` to `adjustment.approved === 1`
  - Updated `inventoryMovementRepository.create()` call to pass `env` parameter
  - Converted `new Date()` to `new Date().toISOString()` for date storage
  - Added final `queryFirst()` to fetch and return the updated adjustment record
  - All business logic (admin verification, duplicate approval prevention, stock updates, movement creation) preserved

Stage Summary:
- All three inventory adjustment API routes migrated from Prisma to raw SQL
- All routes now Cloudflare Worker compatible with D1 database
- Prisma `findUnique()` replaced with `queryFirst()` using raw SQL SELECT
- Prisma `delete()` and `update()` replaced with `execute()` using raw SQL DELETE/UPDATE
- Date objects converted to ISO strings for storage
- Boolean values checked as integers (0/1) for SQLite compatibility
- All routes use `queryFirst()` and `execute()` from `@/db/db` and `getEnv()` from `@/lib/cloudflare`
- Repository calls updated to pass `env` parameter
- All original business logic preserved (validation, stock checks, approval prevention)
- No Prisma dependencies remain in the three API route files
---

---
Task ID: 11-a through 11-h
Agent: main
Task: Fix remaining API routes and libraries to be Cloudflare-only

Work Log:
Comprehensive audit and fix of all remaining files with Prisma fallback code for Cloudflare Workers compatibility.

**Fixed 8 files in total:**

- **Task 11-a: /src/app/api/admin/inventory/reports/purchase/route.ts**
  - Removed `import { db } from '@/lib/db'`
  - Added `import { getEnv } from '@/lib/cloudflare'` and `import { queryAll } from '@/db/db'`
  - Added `const env = await getEnv()` to GET handler
  - Replaced `db.products.findMany()` with raw SQL using `queryAll()` and dynamic IN clause
  - Maintained product name mapping logic

- **Task 11-b: /src/lib/transaction.ts**
  - Completely removed Prisma transaction fallback code (~80 lines)
  - Removed `import prisma from '@/lib/database'`
  - Removed `runPrismaTransaction()` function
  - Kept only D1 transaction support with `runD1Transaction()`
  - Added error for non-Cloudflare environments instead of fallback
  - Preserved batch transaction support and retry logic

- **Task 11-c: /src/app/api/settings/route.ts**
  - Removed unused `import prisma from '@/lib/database'`
  - No other changes needed (already Cloudflare-compatible)

- **Task 11-d: /src/app/api/admin/customers/route.ts**
  - Removed `import prisma from '@/lib/database'`
  - Removed Prisma fallback in order counts query (lines 65-79)
  - Kept only D1 raw SQL path using `queryAll()` with GROUP BY
  - Removed try-catch with Prisma fallback logic
  - Maintained order count and total spent aggregation

- **Task 11-e: /src/app/api/admin/stats/route.ts**
  - Removed `import prisma from '@/lib/database'` and `import { shouldUsePrisma } from '@/db/unified-db'`
  - Removed all `if (usePrisma)` conditional blocks
  - Kept only D1 raw SQL paths for:
    - Product stats (total, active, low stock, out of stock)
    - Order stats (total, pending, processing, completed, cancelled)
    - Customer stats (total, active)
    - Orders list with items for the period
    - Previous period orders for comparison
    - Customer metrics for the period
    - Top products by sales
    - Top customers by orders
  - All queries now use `count()` and `queryAll()` from `@/db/db`

- **Task 11-f: /src/app/api/admin/cleanup/expired-reservations/route.ts**
  - Removed `import prisma from '@/lib/database'`
  - Removed Prisma fallback in GET handler (lines 58-63)
  - Kept only D1 raw SQL path using `queryFirst()` for COUNT query
  - Maintained expired reservation count functionality

- **Task 11-g: /src/app/api/users/[id]/route.ts**
  - Removed `import prisma from '@/lib/database'`
  - Removed all `if (!env || !env.DB)` conditional blocks in DELETE handler
  - Kept only D1 raw SQL paths for:
    - User existence check
    - Active order count check
    - Hard delete operations (orders, cart items, addresses, reviews, reservations, user)
    - Soft delete operation (isBanned flag)
  - All operations now use `queryFirst()` and `execute()` from `@/db/db`

- **Task 11-h: /src/app/api/admin/inventory/alerts/route.ts**
  - Removed `import prisma from '@/lib/database'`
  - Removed all `if (!env || !env.DB)` conditional blocks in GET and POST handlers
  - GET handler: Kept only D1 path for:
    - Alert fetching with dynamic WHERE clause
    - Product batch fetching with IN clause
  - POST handler: Kept only D1 path for:
    - Alert creation with INSERT OR IGNORE
    - Duplicate detection and fetching
    - Product enrichment using `ProductRepository.findById()`
  - All operations now use `queryAll()`, `queryFirst()`, and `execute()` from `@/db/db`

**Total Impact:**
- 8 files converted from Prisma fallback to Cloudflare-only (raw SQL)
- Removed ~400+ lines of Prisma fallback code
- All database operations now use D1 (Cloudflare Workers) directly
- No more `if (!env || !env.DB)` checks
- Consistent use of helper functions from `@/db/db`:
  - `queryFirst()` for single row queries
  - `queryAll()` for multiple row queries
  - `execute()` for INSERT/UPDATE/DELETE operations
  - `count()` for COUNT queries
  - `getEnv()` to get Cloudflare environment

Stage Summary:
- All remaining API routes and libraries are now Cloudflare Workers compatible
- Complete elimination of Prisma fallback patterns from the codebase
- Consistent database access pattern using raw SQL with D1
- All files now strictly use Cloudflare Workers + D1 without any Prisma dependencies

---
Task ID: 12
Agent: main
Task: Restore deleted upload API route

Work Log:
- User reported that the upload API was removed
- Investigation found that `/src/app/api/admin/upload/route.ts` was deleted in commit 34ce4d8
- The `image-upload.tsx` component was calling `/api/admin/upload` which no longer existed
- Restored the upload API route from git history (commit 6d30b68)

- Upload API features restored:
  - POST handler: File upload with validation, size limits, duplicate detection
  - DELETE handler: File deletion with proper security checks
  - OPTIONS handler: CORS preflight support
  - R2 bucket support for Cloudflare Workers production
  - Local filesystem support for development
  - Rate limiting (20 uploads per minute per user)
  - File type and extension validation
  - Image dimensions detection (PNG, JPEG, WebP, GIF)
  - SHA256 hash computation for duplicate detection
  - Media table integration for centralized file management
  - Admin action logging via audit-logger
  - Proper error handling and security checks

Stage Summary:
- Upload API route successfully restored at `/src/app/api/admin/upload/route.ts`
- Image upload functionality is now working again
- All upload features intact: R2 support, local filesystem support, validation, rate limiting, media table integration
