#!/usr/bin/env bun
import Database from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'db/custom.db');
const schemaPath = join(process.cwd(), 'db/schema.sql');

const db = new Database(dbPath);
const schema = readFileSync(schemaPath, 'utf-8');

// Execute schema
db.exec(schema);

console.log('Schema created successfully!');
db.close();