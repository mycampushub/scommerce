import Database from 'bun:sqlite';

const db = new Database('/home/z/my-project/db/custom.db');

// Enable foreign keys
db.exec('PRAGMA foreign_keys = OFF;');

const now = new Date().toISOString();

// Insert product variants
const variants = [
  // Red Bridal Lehenga Variants
  ['pv-lh-001-1', 'prod-lh-001', 'LH-RED-S', 'Red Bridal Lehenga - Size S', 15000, 18000, 3, '["/images/products/lehenga-1.svg"]', 'S', 'Red', 'Velvet', 1, 1, 5, 2, 5, now, now],
  ['pv-lh-001-2', 'prod-lh-001', 'LH-RED-M', 'Red Bridal Lehenga - Size M', 15000, 18000, 4, '["/images/products/lehenga-1.svg"]', 'M', 'Red', 'Velvet', 1, 0, 5, 2, 5, now, now],
  ['pv-lh-001-3', 'prod-lh-001', 'LH-RED-L', 'Red Bridal Lehenga - Size L', 15000, 18000, 3, '["/images/products/lehenga-1.svg"]', 'L', 'Red', 'Velvet', 1, 0, 5, 2, 5, now, now],

  // Silk Banarasi Saree Variants (Color variations)
  ['pv-sa-001-1', 'prod-sa-001', 'SA-SILK-RED', 'Silk Banarasi Saree - Red', 8000, 10000, 5, '["/images/products/saree-1.jpg"]', 'One Size', 'Red', 'Silk', 1, 1, 5, 2, 5, now, now],
  ['pv-sa-001-2', 'prod-sa-001', 'SA-SILK-GRN', 'Silk Banarasi Saree - Green', 8000, 10000, 4, '["/images/products/saree-1.jpg"]', 'One Size', 'Green', 'Silk', 1, 0, 5, 2, 5, now, now],
  ['pv-sa-001-3', 'prod-sa-001', 'SA-SILK-BLU', 'Silk Banarasi Saree - Blue', 8000, 10000, 3, '["/images/products/saree-1.jpg"]', 'One Size', 'Blue', 'Silk', 1, 0, 5, 2, 5, now, now],

  // Anarkali Suit Variants (Size variations)
  ['pv-sw-001-1', 'prod-sw-001', 'SW-ANA-S', 'Anarkali Suit - Size S', 4000, 5000, 8, '["/images/products/salwar-1.jpg"]', 'S', null, 'Cotton', 1, 0, 5, 3, 8, now, now],
  ['pv-sw-001-2', 'prod-sw-001', 'SW-ANA-M', 'Anarkali Suit - Size M', 4000, 5000, 7, '["/images/products/salwar-1.jpg"]', 'M', null, 'Cotton', 1, 1, 5, 3, 8, now, now],
  ['pv-sw-001-3', 'prod-sw-001', 'SW-ANA-L', 'Anarkali Suit - Size L', 4000, 5000, 6, '["/images/products/salwar-1.jpg"]', 'L', null, 'Cotton', 1, 0, 5, 3, 8, now, now],
  ['pv-sw-001-4', 'prod-sw-001', 'SW-ANA-XL', 'Anarkali Suit - Size XL', 4000, 5000, 5, '["/images/products/salwar-1.jpg"]', 'XL', null, 'Cotton', 1, 0, 5, 3, 8, now, now],

  // Embroidered Kurta Variants (Size and Color combinations)
  ['pv-ku-001-1', 'prod-ku-001', 'KU-EMB-BLK-S', 'Embroidered Kurta - Black S', 2000, 2500, 10, '["/images/products/kurta-1.jpg"]', 'S', 'Black', 'Cotton', 1, 1, 5, 3, 8, now, now],
  ['pv-ku-001-2', 'prod-ku-001', 'KU-EMB-BLK-M', 'Embroidered Kurta - Black M', 2000, 2500, 10, '["/images/products/kurta-1.jpg"]', 'M', 'Black', 'Cotton', 1, 0, 5, 3, 8, now, now],
  ['pv-ku-001-3', 'prod-ku-001', 'KU-EMB-WHT-S', 'Embroidered Kurta - White S', 2000, 2500, 8, '["/images/products/kurta-1.jpg"]', 'S', 'White', 'Cotton', 1, 0, 5, 3, 8, now, now],
  ['pv-ku-001-4', 'prod-ku-001', 'KU-EMB-WHT-M', 'Embroidered Kurta - White M', 2000, 2500, 9, '["/images/products/kurta-1.jpg"]', 'M', 'White', 'Cotton', 1, 0, 5, 3, 8, now, now],

  // Floral Top Variants (Size and Color combinations)
  ['pv-to-001-1', 'prod-to-001', 'TO-FLO-RED-S', 'Floral Top - Red S', 1200, 1500, 15, '["/images/products/top-1.jpg"]', 'S', 'Red', 'Cotton Blend', 1, 1, 8, 5, 15, now, now],
  ['pv-to-001-2', 'prod-to-001', 'TO-FLO-RED-M', 'Floral Top - Red M', 1200, 1500, 15, '["/images/products/top-1.jpg"]', 'M', 'Red', 'Cotton Blend', 1, 0, 8, 5, 15, now, now],
  ['pv-to-001-3', 'prod-to-001', 'TO-FLO-RED-L', 'Floral Top - Red L', 1200, 1500, 12, '["/images/products/top-1.jpg"]', 'L', 'Red', 'Cotton Blend', 1, 0, 8, 5, 15, now, now],
  ['pv-to-001-4', 'prod-to-001', 'TO-FLO-BLU-S', 'Floral Top - Blue S', 1200, 1500, 10, '["/images/products/top-1.jpg"]', 'S', 'Blue', 'Cotton Blend', 1, 0, 8, 5, 15, now, now],
  ['pv-to-001-5', 'prod-to-001', 'TO-FLO-BLU-M', 'Floral Top - Blue M', 1200, 1500, 12, '["/images/products/top-1.jpg"]', 'M', 'Blue', 'Cotton Blend', 1, 0, 8, 5, 15, now, now],
  ['pv-to-001-6', 'prod-to-001', 'TO-FLO-BLU-L', 'Floral Top - Blue L', 1200, 1500, 10, '["/images/products/top-1.jpg"]', 'L', 'Blue', 'Cotton Blend', 1, 0, 8, 5, 15, now, now],

  // Men Kurta Pyjama Variants (Size variations)
  ['pv-me-001-1', 'prod-me-001', 'ME-KUR-S', 'Men Kurta Pyjama - Size S', 3000, 3500, 12, '["/images/products/men-1.jpg"]', 'S', 'White', 'Cotton', 1, 0, 5, 4, 10, now, now],
  ['pv-me-001-2', 'prod-me-001', 'ME-KUR-M', 'Men Kurta Pyjama - Size M', 3000, 3500, 12, '["/images/products/men-1.jpg"]', 'M', 'White', 'Cotton', 1, 1, 5, 4, 10, now, now],
  ['pv-me-001-3', 'prod-me-001', 'ME-KUR-L', 'Men Kurta Pyjama - Size L', 3000, 3500, 10, '["/images/products/men-1.jpg"]', 'L', 'White', 'Cotton', 1, 0, 5, 4, 10, now, now],
  ['pv-me-001-4', 'prod-me-001', 'ME-KUR-XL', 'Men Kurta Pyjama - Size XL', 3000, 3500, 8, '["/images/products/men-1.jpg"]', 'XL', 'White', 'Cotton', 1, 0, 5, 4, 10, now, now],
];

const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO product_variants 
  (id, productId, sku, name, price, comparePrice, stock, images, size, color, material, isActive, isDefault, lowStockAlert, reorderLevel, reorderQty, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
for (const variant of variants) {
  try {
    const result = insertStmt.run(variant);
    if (result.changes > 0) {
      inserted++;
    }
  } catch (e) {
    console.error('Error inserting variant:', e);
  }
}

// Update products to mark them as having variants
const updateProducts = db.prepare('UPDATE products SET hasVariants = 1 WHERE id IN (?, ?, ?, ?, ?, ?)');
const productIds = ['prod-lh-001', 'prod-sa-001', 'prod-sw-001', 'prod-ku-001', 'prod-to-001', 'prod-me-001'];
updateProducts.run(...productIds);

db.exec('PRAGMA foreign_keys = ON;');

console.log(`Successfully added ${inserted} product variants to database!`);
