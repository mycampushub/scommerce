#!/usr/bin/env bun
import Database from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'db/custom.db');
const seedPath = join(process.cwd(), 'db/seed.sql');

const db = new Database(dbPath);
const seed = readFileSync(seedPath, 'utf-8');

// Execute seed
db.exec(seed);

console.log('Database seeded successfully!');

// Get counts
const cats = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
const prods = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

console.log(`Categories: ${cats.count}`);
console.log(`Products: ${prods.count}`);
console.log(`Users: ${users.count}`);

db.close();