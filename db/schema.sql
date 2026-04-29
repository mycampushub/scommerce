-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  password TEXT,
  emailVerified INTEGER DEFAULT 0,
  emailToken TEXT,
  newEmail TEXT,
  resetToken TEXT,
  resetTokenExpiry TEXT,
  role TEXT DEFAULT 'user',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  fullName TEXT NOT NULL,
  phone TEXT NOT NULL,
  addressLine1 TEXT NOT NULL,
  addressLine2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  division TEXT NOT NULL,
  postalCode TEXT,
  isDefault INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_addresses_userId ON addresses(userId);
CREATE INDEX IF NOT EXISTS idx_addresses_isDefault ON addresses(isDefault);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_isActive ON categories(isActive);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  categoryId TEXT NOT NULL,
  price REAL DEFAULT 0,
  basePrice REAL DEFAULT 0,
  comparePrice REAL,
  discount REAL DEFAULT 0,
  discountType TEXT DEFAULT 'percentage',
  images TEXT,
  stock INTEGER DEFAULT 0,
  lowStockAlert INTEGER DEFAULT 10,
  reorderLevel INTEGER DEFAULT 5,
  reorderQty INTEGER DEFAULT 20,
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  hasVariants INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId);
CREATE INDEX IF NOT EXISTS idx_products_isFeatured ON products(isFeatured);
CREATE INDEX IF NOT EXISTS idx_products_isActive_createdAt ON products(isActive, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_isActive_isFeatured ON products(isActive, isFeatured);

-- Product Variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  comparePrice REAL,
  stock INTEGER DEFAULT 0,
  images TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  isActive INTEGER DEFAULT 1,
  isDefault INTEGER DEFAULT 0,
  lowStockAlert INTEGER DEFAULT 10,
  reorderLevel INTEGER DEFAULT 5,
  reorderQty INTEGER DEFAULT 20,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_variants_productId ON product_variants(productId);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_productId_isActive ON product_variants(productId, isActive);
CREATE INDEX IF NOT EXISTS idx_product_variants_productId_size_color ON product_variants(productId, size, color);

-- Product Reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  comment TEXT,
  isVerified INTEGER DEFAULT 0,
  isApproved INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE(productId, userId)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_productId ON product_reviews(productId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_userId ON product_reviews(userId);
CREATE INDEX IF NOT EXISTS idx_product_reviews_isApproved ON product_reviews(isApproved);

-- Wishlist Items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(userId, productId)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  orderNumber TEXT UNIQUE NOT NULL,
  userId TEXT,
  customerName TEXT NOT NULL,
  customerEmail TEXT NOT NULL,
  customerPhone TEXT,
  shippingAddress TEXT NOT NULL,
  billingAddress TEXT,
  city TEXT,
  district TEXT,
  division TEXT,
  subtotal REAL NOT NULL,
  shipping REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'PENDING',
  paymentStatus TEXT DEFAULT 'PENDING',
  paymentMethod TEXT,
  trackingNumber TEXT,
  trackingStatus TEXT DEFAULT 'PENDING',
  estimatedDeliveryDate TEXT,
  cancelledAt TEXT,
  cancelledBy TEXT,
  cancellationReason TEXT,
  refundedAt TEXT,
  refundedAmount REAL,
  refundMethod TEXT,
  refundReason TEXT,
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_customerEmail ON orders(customerEmail);
CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders(orderNumber);
CREATE INDEX IF NOT EXISTS idx_orders_status_createdAt ON orders(status, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customerEmail_status ON orders(customerEmail, status);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  productName TEXT NOT NULL,
  productImage TEXT,
  variantSku TEXT,
  variantSize TEXT,
  variantColor TEXT,
  variantMaterial TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_productId ON order_items(productId);
CREATE INDEX IF NOT EXISTS idx_order_items_variantId ON order_items(variantId);

-- Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  variantId TEXT,
  quantity INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE CASCADE,
  UNIQUE(userId, productId)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_userId ON cart_items(userId);
CREATE INDEX IF NOT EXISTS idx_cart_items_userId_productId ON cart_items(userId, productId);
CREATE INDEX IF NOT EXISTS idx_cart_items_variantId ON cart_items(variantId);

-- Admin Logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entityId TEXT,
  adminId TEXT NOT NULL,
  details TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_adminId ON admin_logs(adminId);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity);
CREATE INDEX IF NOT EXISTS idx_admin_logs_createdAt ON admin_logs(createdAt);

-- Inventory Alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id TEXT PRIMARY KEY,
  variantId TEXT,
  productId TEXT,
  alertType TEXT DEFAULT 'LOW_STOCK',
  quantity INTEGER NOT NULL,
  isRead INTEGER DEFAULT 0,
  isResolved INTEGER DEFAULT 0,
  resolvedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_variantId ON inventory_alerts(variantId);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_productId ON inventory_alerts(productId);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_isRead_isResolved ON inventory_alerts(isRead, isResolved);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER DEFAULT 0,
  authorId TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_authorId ON posts(authorId);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  mobileImage TEXT,
  buttonText TEXT,
  buttonLink TEXT,
  isActive INTEGER DEFAULT 1,
  order INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_banners_isActive ON banners(isActive);
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(order);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  images TEXT NOT NULL,
  isActive INTEGER DEFAULT 1,
  order INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stories_isActive ON stories(isActive);
CREATE INDEX IF NOT EXISTS idx_stories_order ON stories(order);

-- Reels table
CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  videoUrl TEXT NOT NULL,
  productIds TEXT,
  isActive INTEGER DEFAULT 1,
  order INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reels_isActive ON reels(isActive);
CREATE INDEX IF NOT EXISTS idx_reels_order ON reels(order);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  ctaText TEXT,
  ctaLink TEXT,
  type TEXT DEFAULT 'banner',
  isActive INTEGER DEFAULT 1,
  order INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promotions_isActive ON promotions(isActive);
CREATE INDEX IF NOT EXISTS idx_promotions_type_isActive ON promotions(type, isActive);

-- Homepage Settings table
CREATE TABLE IF NOT EXISTS homepage_settings (
  id TEXT PRIMARY KEY,
  sectionName TEXT UNIQUE NOT NULL,
  isEnabled INTEGER DEFAULT 1,
  autoPlay INTEGER DEFAULT 5000,
  displayLimit INTEGER,
  settings TEXT,
  updatedAt TEXT DEFAULT (datetime('now'))
);
