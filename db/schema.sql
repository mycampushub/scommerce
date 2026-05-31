-- Schema for SCommerce E-commerce Platform
-- This file is used for Cloudflare D1 deployment
-- Generated from Prisma schema

-- Homepage Settings
CREATE TABLE IF NOT EXISTS homepage_settings (
  id TEXT PRIMARY KEY,
  section_name TEXT UNIQUE NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  auto_play INTEGER DEFAULT 5000,
  display_limit INTEGER,
  settings TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_homepage_settings_section ON homepage_settings(section_name);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  division TEXT NOT NULL,
  postal_code TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  admin_id TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_created ON admin_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity_created ON admin_logs(entity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created ON admin_logs(admin_id, created_at DESC);

-- Analytics Integrations
CREATE TABLE IF NOT EXISTS analytics_integrations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT 'custom',
  tracking_id TEXT,
  measurement_id TEXT,
  api_key TEXT,
  pixel_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  settings TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  mobile_image TEXT,
  button_text TEXT,
  button_link TEXT,
  is_active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(order_index);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  website TEXT,
  description TEXT,
  country TEXT,
  is_active INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brands_active_order ON brands(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_featured ON brands(featured);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER DEFAULT 1,
  version INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_variant ON cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_variant ON cart_items(user_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, sort_order);

-- Email Services
CREATE TABLE IF NOT EXISTS email_services (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT 'custom',
  api_key TEXT,
  api_secret TEXT,
  from_email TEXT,
  from_name TEXT,
  webhook_url TEXT,
  sandbox_mode INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  is_default BOOLEAN DEFAULT 0,
  settings TEXT,
  last_tested TEXT,
  test_status TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Inventory Alerts
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id TEXT PRIMARY KEY,
  variant_id TEXT,
  product_id TEXT,
  alert_type TEXT DEFAULT 'LOW_STOCK',
  quantity INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0,
  is_resolved INTEGER DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE(product_id, variant_id, alert_type)
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_read_resolved ON inventory_alerts(is_read, is_resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_variant ON inventory_alerts(variant_id);

-- Inventory Reservations
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id TEXT PRIMARY KEY,
  variant_id TEXT,
  product_id TEXT,
  user_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_user ON inventory_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant ON inventory_reservations(variant_id);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  variant_sku TEXT,
  variant_size TEXT,
  variant_color TEXT,
  variant_material TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  billing_address TEXT,
  city TEXT,
  district TEXT,
  division TEXT,
  subtotal REAL NOT NULL,
  shipping REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'PENDING',
  payment_status TEXT DEFAULT 'PENDING',
  payment_method TEXT,
  tracking_number TEXT,
  tracking_status TEXT DEFAULT 'PENDING',
  estimated_delivery_date TEXT,
  cancelled_at TEXT,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  refunded_at TEXT,
  refunded_amount REAL,
  refund_method TEXT,
  refund_reason TEXT,
  notes TEXT,
  deleted_at TEXT,
  deleted_by TEXT,
  deleted_reason TEXT,
  version INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  promo_code TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_orders_email_status ON orders(customer_email, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Payment Gateways
CREATE TABLE IF NOT EXISTS payment_gateways (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT 'custom',
  api_key TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  sandbox_mode INTEGER DEFAULT 0,
  supported_currencies TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_default BOOLEAN DEFAULT 0,
  settings TEXT,
  last_tested TEXT,
  test_status TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 0,
  author_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  comment TEXT,
  is_verified INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_approved_created ON product_reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_rating ON product_reviews(product_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_approved ON product_reviews(product_id, is_approved);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  compare_price REAL,
  stock INTEGER DEFAULT 0,
  images TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 10,
  reorder_level INTEGER DEFAULT 5,
  reorder_qty INTEGER DEFAULT 20,
  version INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  cost_price REAL DEFAULT 0,
  size_type TEXT,
  size_value REAL,
  size_unit TEXT,
  size_label TEXT,
  country_of_origin TEXT,
  total_purchased INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,
  average_cost REAL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_size_color ON product_variants(product_id, size, color);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active ON product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_country ON product_variants(country_of_origin);
CREATE INDEX IF NOT EXISTS idx_product_variants_size_type ON product_variants(size_type, size_unit);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL,
  price REAL DEFAULT 0,
  base_price REAL DEFAULT 0,
  compare_price REAL,
  discount REAL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  images TEXT,
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 10,
  reorder_level INTEGER DEFAULT 5,
  reorder_qty INTEGER DEFAULT 20,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  has_variants INTEGER DEFAULT 0,
  weight REAL,
  dimensions TEXT,
  tags TEXT,
  version INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  cost_price REAL DEFAULT 0,
  brand_id TEXT,
  brand_name TEXT,
  brand_logo TEXT,
  size_type TEXT,
  size_value REAL,
  size_unit TEXT,
  size_label TEXT,
  material TEXT,
  color TEXT,
  country_of_origin TEXT,
  available_sizes TEXT,
  available_colors TEXT,
  total_purchased INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0,
  average_cost REAL DEFAULT 0,
  last_purchase_at TEXT,
  last_purchase_cost REAL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country_of_origin);
CREATE INDEX IF NOT EXISTS idx_products_size_type ON products(size_type, size_unit);

-- Product Color Images
CREATE TABLE IF NOT EXISTS product_color_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  images TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, color)
);

CREATE INDEX IF NOT EXISTS idx_product_color_images_product ON product_color_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_color_images_color ON product_color_images(color);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  cta_text TEXT,
  cta_link TEXT,
  type TEXT DEFAULT 'banner',
  promo_code TEXT UNIQUE,
  discount_type TEXT,
  discount_value REAL,
  min_order_amount REAL,
  max_discount_amount REAL,
  start_date TEXT,
  end_date TEXT,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  user_limit INTEGER,
  applicable_categories TEXT,
  applicable_products TEXT,
  conditions TEXT,
  discount_rules TEXT,
  is_active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(promo_code);
CREATE INDEX IF NOT EXISTS idx_promotions_type_active ON promotions(type, is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);

-- Reels
CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  video_url TEXT NOT NULL,
  product_ids TEXT,
  is_active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reels_order ON reels(order_index);
CREATE INDEX IF NOT EXISTS idx_reels_active ON reels(is_active);

-- Shipping Carriers
CREATE TABLE IF NOT EXISTS shipping_carriers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  provider TEXT DEFAULT 'custom',
  api_key TEXT,
  api_secret TEXT,
  account_number TEXT,
  webhook_url TEXT,
  sandbox_mode INTEGER DEFAULT 0,
  shipping_methods TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_default BOOLEAN DEFAULT 0,
  settings TEXT,
  last_tested TEXT,
  test_status TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_name TEXT DEFAULT 'SCommerce',
  site_logo TEXT,
  currency TEXT DEFAULT 'BDT',
  currency_symbol TEXT DEFAULT '৳',
  tax_rate REAL DEFAULT 0.18,
  free_shipping_threshold REAL DEFAULT 5000,
  base_shipping_cost REAL DEFAULT 150,
  contact_email TEXT,
  contact_phone TEXT,
  social_media TEXT,
  enable_store INTEGER DEFAULT 1,
  maintenance_mode INTEGER DEFAULT 0,
  seo TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  images TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stories_order ON stories(order_index);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(is_active);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT UNIQUE,
  address TEXT,
  password TEXT,
  email_verified INTEGER DEFAULT 0,
  email_token TEXT,
  new_email TEXT,
  reset_token TEXT,
  reset_token_expiry TEXT,
  role TEXT DEFAULT 'user',
  avatar TEXT,
  is_banned BOOLEAN DEFAULT 0,
  banned_at TEXT,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Wishlist Items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

-- Media
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  tags TEXT,
  category TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_uploader ON media(uploaded_by);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  total_amount REAL NOT NULL,
  total_quantity INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  expected_date TEXT,
  received_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_date ON purchase_orders(status, order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date DESC);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  quantity INTEGER NOT NULL,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  received_qty INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_variant ON purchase_order_items(variant_id);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  variant_id TEXT,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost REAL,
  total_cost REAL,
  reference_id TEXT,
  reference_type TEXT,
  approved INTEGER DEFAULT 0,
  approved_at TEXT,
  supplier_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created ON inventory_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_created ON inventory_movements(variant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type_created ON inventory_movements(movement_type, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_supplier ON inventory_movements(supplier_id);

-- Inventory Adjustments
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  variant_id TEXT,
  adjustment_type TEXT NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  quantity_diff INTEGER NOT NULL,
  reason TEXT NOT NULL,
  approved_by TEXT,
  approved INTEGER DEFAULT 0,
  approved_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_created ON inventory_adjustments(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type_created ON inventory_adjustments(adjustment_type, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created ON inventory_adjustments(created_at DESC);

-- Page SEO
CREATE TABLE IF NOT EXISTS page_seo (
  id TEXT PRIMARY KEY,
  page_path TEXT UNIQUE NOT NULL,
  page_title TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_seo_path ON page_seo(page_path);
CREATE INDEX IF NOT EXISTS idx_page_seo_active ON page_seo(is_active);