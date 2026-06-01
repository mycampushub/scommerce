#!/usr/bin/env bun
import Database from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'db/custom.db');
const seedPath = join(process.cwd(), 'db/seed.sql');

const db = new Database(dbPath);

try {
  const seed = readFileSync(seedPath, 'utf-8');

  // Execute each statement separately for better error reporting
  const statements = seed.split(';').filter(s => s.trim());

  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        db.exec(stmt);
      } catch (error: any) {
        console.error('Error in statement:');
        console.error(stmt.substring(0, 200));
        console.error('Error:', error.message);
      }
    }
  }

  console.log('Database seeded successfully!');

  // Get counts
  const cats = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  const prods = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  console.log(`Categories: ${cats.count}`);
  console.log(`Products: ${prods.count}`);
  console.log(`Users: ${users.count}`);
} catch (error: any) {
  console.error('Seeding error:', error.message);
} finally {
  db.close();
}