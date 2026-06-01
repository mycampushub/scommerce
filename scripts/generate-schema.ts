#!/usr/bin/env bun
import Database from 'bun:sqlite';

const db = new Database('./db/custom.db');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];

console.log('-- Database Schema Generated from Prisma db push');
console.log('-- DO NOT EDIT MANUALLY - Generated at:', new Date().toISOString());
console.log('--');

// For each table, get its schema
for (const table of tables) {
  const schema = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[];
  const indexes = db.prepare(`PRAGMA index_list(${table.name})`).all() as any[];

  console.log(`-- Table: ${table.name}`);
  console.log(`CREATE TABLE IF NOT EXISTS ${table.name} (`);

  const columns = schema.map(col => {
    const notNull = col.notnull ? 'NOT NULL' : '';
    const dflt = col.dflt_value !== null ? `DEFAULT ${col.dflt_value}` : '';
    const pk = col.pk > 0 ? 'PRIMARY KEY' : '';
    return `  ${col.name} ${col.type} ${notNull} ${dflt} ${pk}`.trim();
  });

  console.log(columns.join(',\n'));

  // Add foreign keys
  const fks = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all() as any[];
  if (fks.length > 0) {
    fks.forEach(fk => {
      console.log(`,`);
      console.log(`  FOREIGN KEY (${fk.from}) REFERENCES ${fk.table}(${fk.to}) ON DELETE ${fk.on_delete} ON UPDATE ${fk.on_update}`);
    });
  }

  console.log(');\n');

  // Add indexes
  for (const index of indexes) {
    if (!index.origin.startsWith('u')) { // Skip unique constraints from indexes, they're already handled
      const indexInfo = db.prepare(`PRAGMA index_info(${index.name})`).all() as any[];
      const columns = indexInfo.map(col => col.name).join(', ');
      console.log(`CREATE INDEX IF NOT EXISTS ${index.name} ON ${table.name}(${columns});`);
    }
  }
  console.log('');
}

db.close();