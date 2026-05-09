import Database from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbPath = join(__dirname, '../db/custom.db');
  const sqlPath = join(__dirname, '../db/seed.sql');

  const db = new Database(dbPath);
  const sql = readFileSync(sqlPath, 'utf-8');

  // Execute the entire seed file
  db.exec(sql);

  console.log('Database seeded successfully!');

  // Get counts
  const cats = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  const prods = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const variants = db.prepare('SELECT COUNT(*) as count FROM product_variants').get() as { count: number };
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  console.log(`Users: ${users.count}`);
  console.log(`Categories: ${cats.count}`);
  console.log(`Products: ${prods.count}`);
  console.log(`Product Variants: ${variants.count}`);
}

main().catch(console.error);
