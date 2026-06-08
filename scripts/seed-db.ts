#!/usr/bin/env bun
import Database from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const dbPath = join(import.meta.dir, '../db/custom.db');
  const sqlPath = join(import.meta.dir, '../db/seed.sql');

  console.log('🌱 Seeding database from seed.sql...');

  const db = new Database(dbPath);
  const sql = readFileSync(sqlPath, 'utf-8');

  // Execute the entire seed file
  db.exec(sql);

  console.log('✅ Database seeded successfully!');

  // Get counts
  const cats = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  const activeCats = db.prepare('SELECT COUNT(*) as count FROM categories WHERE isActive = 1').get() as { count: number };
  const brands = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
  const activeBrands = db.prepare('SELECT COUNT(*) as count FROM brands WHERE isActive = 1').get() as { count: number };
  const prods = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const activeProds = db.prepare('SELECT COUNT(*) as count FROM products WHERE isActive = 1').get() as { count: number };
  const variants = db.prepare('SELECT COUNT(*) as count FROM product_variants').get() as { count: number };
  const activeVariants = db.prepare('SELECT COUNT(*) as count FROM product_variants WHERE isActive = 1').get() as { count: number };
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  console.log('\n📊 Seed Summary:');
  console.log(`  Categories: ${activeCats.count}/${cats.count} active`);
  console.log(`  Brands: ${activeBrands.count}/${brands.count} active`);
  console.log(`  Products: ${activeProds.count}/${prods.count} active`);
  console.log(`  Variants: ${activeVariants.count}/${variants.count} active`);
  console.log(`  Users: ${users.count}`);
}

main().catch(console.error);