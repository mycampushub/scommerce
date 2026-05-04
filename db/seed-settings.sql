-- Seed initial site settings
INSERT INTO site_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, updatedAt)
VALUES 
  ('general', 1, 5000, 100, '{"siteName":"SCommerce","currency":"BDT","currencySymbol":"৳","taxRate":0.18,"freeShippingThreshold":5000,"baseShippingCost":150,"contactEmail":"contact@scommerce.com","contactPhone":"+8801XXXXXXXXX"}', datetime('now')),
  ('homepage', 1, 5000, 12, '{"banners":true,"stories":true,"reels":true,"products":true,"categories":true,"promotions":true}', datetime('now')),
  ('featured', 1, 5000, 4, '[]', datetime('now')),
  ('sale', 1, 5000, 4, '[]', datetime('now')),
  ('new', 1, 5000, 4, '[]', datetime('now')),
  ('trending', 1, 5000, 4, '[]', datetime('now'));
