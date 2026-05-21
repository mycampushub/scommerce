import Database from 'bun:sqlite';

const db = new Database('/home/z/my-project/db/custom.db');

// Check if tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables:', tables.map(t => t.name));

// Check PO tables
try {
  const poCount = db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get();
  console.log('Purchase Orders count:', poCount?.count || 0);

  const poiCount = db.prepare('SELECT COUNT(*) as count FROM purchase_order_items').get();
  console.log('Purchase Order Items count:', poiCount?.count || 0);

  const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
  console.log('Suppliers count:', supplierCount?.count || 0);

  if (poCount.count > 0) {
    const pos = db.prepare(`
      SELECT po.id, po.orderNumber, po.supplierId, po.status, s.name as supplierName
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplierId = s.id
      LIMIT 5
    `).all();

    console.log('Sample POs:', JSON.stringify(pos, null, 2));
  }
} catch (error) {
  console.error('Error:', error.message);
}

db.close();
