@echo off
REM Database Seeding Script for Cloudflare D1
REM This script will populate your database with comprehensive sample data

echo ============================================
echo Database Seeding for Cloudflare D1
echo ============================================
echo.

echo This will add:
echo   - 7 Categories
echo   - 35 Products (5 per category)
echo   - 9 Users (1 admin + 3 staff + 5 customers)
echo   - 3 Addresses
echo   - 4 Orders with 6 Order Items
echo   - 3 Cart Items
echo   - 5 Wishlist Items
echo   - 7 Product Reviews
echo   - 5 Stories
echo   - 5 Reels
echo   - 3 Promotions
echo   - 3 Banners
echo   - 7 Homepage Settings
echo   - 3 Inventory Alerts
echo   - 5 Admin Logs
echo   - 3 Blog Posts
echo.

echo Step 1: Seeding local database...
wrangler d1 execute scommerce-db --file=db/seed.sql
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error seeding local database!
    pause
    exit /b 1
)
echo.
echo ✅ Local database seeded successfully!
echo.

echo ============================================
echo Verifying data in local database...
echo ============================================
echo.
echo Categories:
wrangler d1 execute scommerce-db --command="SELECT COUNT(*) as count FROM categories;"
echo.
echo Products:
wrangler d1 execute scommerce-db --command="SELECT COUNT(*) as count FROM products;"
echo.
echo Users:
wrangler d1 execute scommerce-db --command="SELECT COUNT(*) as count FROM users;"
echo.
echo Orders:
wrangler d1 execute scommerce-db --command="SELECT COUNT(*) as count FROM orders;"
echo.

echo ============================================
echo Step 2: Seeding remote database...
echo ============================================
echo This will add sample data to your production database.
echo.
pause
wrangler d1 execute scommerce-db --remote --file=db/seed.sql
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error seeding remote database!
    pause
    exit /b 1
)
echo.
echo ✅ Remote database seeded successfully!
echo.

echo ============================================
echo Verifying data in remote database...
echo ============================================
echo.
echo Categories:
wrangler d1 execute scommerce-db --remote --command="SELECT COUNT(*) as count FROM categories;"
echo.
echo Products:
wrangler d1 execute scommerce-db --remote --command="SELECT COUNT(*) as count FROM products;"
echo.
echo Users:
wrangler d1 execute scommerce-db --remote --command="SELECT COUNT(*) as count FROM users;"
echo.
echo Orders:
wrangler d1 execute scommerce-db --remote --command="SELECT COUNT(*) as count FROM orders;"
echo.

echo ============================================
echo ✅ Database Seeding Complete!
echo ============================================
echo.
echo All sections seeded with sample data!
echo Next steps:
echo 1. Test your application at scommerce.demo-web.workers.dev
echo 2. Test API endpoints: /api/products, /api/categories, etc.
echo 3. Verify products display on homepage
echo 4. Check admin panel for orders, customers, and products
echo.
pause
