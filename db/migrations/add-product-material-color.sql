-- Migration: Add material and color columns to products table
-- This migration adds support for material and color attributes for single products (without variants)
-- Run this on existing databases after updating schema.sql

-- Add material column to products table (if it doesn't exist)
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we use ALTER TABLE safely
ALTER TABLE "products" ADD COLUMN "material" TEXT;

-- Add color column to products table (if it doesn't exist)
ALTER TABLE "products" ADD COLUMN "color" TEXT;
