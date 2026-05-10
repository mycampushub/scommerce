-- Migration script to update remote D1 database schema
-- This will add displayOrder column as an alias for order column

-- Stories table migration
ALTER TABLE stories ADD COLUMN displayOrder INTEGER DEFAULT 0;
UPDATE stories SET displayOrder = "order";

-- Reels table migration
ALTER TABLE reels ADD COLUMN displayOrder INTEGER DEFAULT 0;
UPDATE reels SET displayOrder = "order";

-- Promotions table migration
ALTER TABLE promotions ADD COLUMN displayOrder INTEGER DEFAULT 0;
UPDATE promotions SET displayOrder = "order";
