#!/bin/bash

# ============================================
# Reset D1 Database Script
# Clears all data and re-seeds with fresh data
# ============================================

set -e  # Exit on error

DB_NAME="scommerce-db"
SEED_FILE="./db/seed.sql"

echo "=========================================="
echo "Resetting D1 Database: $DB_NAME"
echo "=========================================="
echo ""

# Step 1: Clear Database
echo "Step 1: Clearing database..."
echo "----------------------------------------"

# Disable foreign keys
wrangler d1 execute $DB_NAME --remote --command="PRAGMA foreign_keys = OFF;"

# List of tables in deletion order
TABLES=(
  "admin_logs"
  "inventory_alerts"
  "cart_items"
  "wishlist_items"
  "order_items"
  "orders"
  "product_reviews"
  "addresses"
  "posts"
  "promotions"
  "banners"
  "homepage_settings"
  "reels"
  "stories"
  "products"
  "categories"
  "users"
)

for table in "${TABLES[@]}"; do
  echo "  Deleting from $table..."
  wrangler d1 execute $DB_NAME --remote --command="DELETE FROM $table;" > /dev/null 2>&1 || echo "  ⚠ Table $table might not exist"
done

# Re-enable foreign keys
wrangler d1 execute $DB_NAME --remote --command="PRAGMA foreign_keys = ON;"

echo "✅ Cleared all tables"
echo ""

# Step 2: Seed Database
echo "Step 2: Seeding database..."
echo "----------------------------------------"

if [ ! -f "$SEED_FILE" ]; then
  echo "❌ ERROR: Seed file not found: $SEED_FILE"
  exit 1
fi

echo "  Executing seed file: $SEED_FILE"
wrangler d1 execute $DB_NAME --remote --file="$SEED_FILE"

echo "✅ Database seeded"
echo ""

# Step 3: Verify
echo "Step 3: Verifying data..."
echo "----------------------------------------"

USER_COUNT=$(wrangler d1 execute $DB_NAME --remote --command="SELECT COUNT(*) as count FROM users;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*')

if [ -n "$USER_COUNT" ]; then
  echo "✅ Users in database: $USER_COUNT"

  if [ "$USER_COUNT" -eq 9 ]; then
    echo "✅ Expected 9 users - Database is ready!"
  else
    echo "⚠ Warning: Expected 9 users but found $USER_COUNT"
  fi
else
  echo "⚠ Warning: Could not verify user count"
fi

echo ""
echo "=========================================="
echo "✅ Database reset complete!"
echo "=========================================="
echo ""
echo "You can now login with:"
echo "  Admin:    admin@scommerce.com / admin123"
echo "  Staff:     rahul@scommerce.com / staff123"
echo "  Customer:  fatema@example.com / user123"
echo ""
