@echo off
REM Database Setup Script for Cloudflare D1
REM This script will set up both local and remote databases

echo ============================================
echo Database Setup for Cloudflare D1
echo ============================================
echo.

echo Step 1: Setting up local database...
wrangler d1 execute scommerce-db --file=db/schema.sql
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error setting up local database!
    echo Please check the error message above.
    pause
    exit /b 1
)
echo.
echo ✅ Local database setup completed successfully!
echo.

echo ============================================
echo Verifying local database tables...
echo ============================================
wrangler d1 execute scommerce-db --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
echo.

echo ============================================
echo Step 2: Setting up remote database...
echo ============================================
echo This will apply the schema to your production database on Cloudflare.
echo.
pause
wrangler d1 execute scommerce-db --remote --file=db/schema.sql
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error setting up remote database!
    echo Please check the error message above.
    pause
    exit /b 1
)
echo.
echo ✅ Remote database setup completed successfully!
echo.

echo ============================================
echo Verifying remote database tables...
echo ============================================
wrangler d1 execute scommerce-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
echo.

echo ============================================
echo ✅ Database Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Build and deploy your application
echo 2. Test the API endpoints
echo 3. Verify products are loading correctly
echo.
pause
