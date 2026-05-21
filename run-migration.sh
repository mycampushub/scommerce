#!/bin/bash

# Script to run the D1 migration
# Usage: ./run-migration.sh

echo "Running D1 migration to add missing product columns..."

# Get the database_id from wrangler.toml
DB_ID=$(grep "database_id" wrangler.toml | head -1 | awk '{print $3}' | tr -d '"')
DB_NAME=$(grep "database_name" wrangler.toml | head -1 | awk '{print $3}' | tr -d '"')

echo "Database Name: $DB_NAME"
echo "Database ID: $DB_ID"

# Run the migration
echo "Executing migration..."
wrangler d1 execute "$DB_NAME" --local --file="./db/migrations/add_missing_product_columns.sql"

echo ""
echo "Migration completed!"
echo ""
echo "To deploy to production, run:"
echo "wrangler d1 execute \"$DB_NAME\" --file=\"./db/migrations/add_missing_product_columns.sql\""
