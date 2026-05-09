import Database from 'bun:sqlite';

const db = new Database('/home/z/my-project/db/custom.db');

// Enable foreign keys
db.exec('PRAGMA foreign_keys = OFF;');

const now = new Date().toISOString();

// Insert one variant first to test
const testVariant = [
  'pv-lh-001-1',
  'prod-lh-001',
  'LH-RED-S',
  'Red Bridal Lehenga - Size S',
  15000,
  18000,
  3,
  '["/images/products/lehenga-1.svg"]',
  'S',
  'Red',
  'Velvet',
  1,
  1,
  5,
  2,
  5,
  now,
  now
];

const testStmt = db.prepare(`
  INSERT OR IGNORE INTO product_variants 
  (id, productId, sku, name, price, comparePrice, stock, images, size, color, material, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log('Variant array length:', testVariant.length);
console.log('Array:', testVariant);

try {
  testStmt.run(testVariant);
  console.log('Test insert successful!');
} catch (e) {
  console.error('Test insert error:', e);
}

// Update products to mark them as having variants
const updateProducts = db.prepare('UPDATE products SET hasVariants = 1 WHERE id IN (?, ?, ?, ?, ?, ?)');
const productIds = ['prod-lh-001', 'prod-sa-001', 'prod-sw-001', 'prod-ku-001', 'prod-to-001', 'prod-me-001'];
updateProducts.run(...productIds);

db.exec('PRAGMA foreign_keys = ON;');

console.log('Done!');
