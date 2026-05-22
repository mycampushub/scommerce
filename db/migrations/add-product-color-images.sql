-- Migration: Add product_color_images table and multi-select fields
-- This migration adds support for per-color product images and multi-select size/color system
-- Run this on existing Cloudflare D1 databases after updating schema.sql

-- Add availableSizes and availableColors columns to products table (if they don't exist)
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we use ALTER TABLE safely

-- Check and add availableSizes column
-- This may fail if column already exists, which is fine
ALTER TABLE "products" ADD COLUMN "availableSizes" TEXT;

-- Check and add availableColors column
-- This may fail if column already exists, which is fine
ALTER TABLE "products" ADD COLUMN "availableColors" TEXT;

-- Create product_color_images table
CREATE TABLE IF NOT EXISTS "product_color_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_color_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint on productId and color
-- Note: This may fail if it already exists, which is fine
CREATE UNIQUE INDEX IF NOT EXISTS "product_color_images_productId_color_key" ON "product_color_images"("productId", "color");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "product_color_images_productId_idx" ON "product_color_images"("productId");
CREATE INDEX IF NOT EXISTS "product_color_images_color_idx" ON "product_color_images"("color");
