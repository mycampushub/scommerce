#!/usr/bin/env bun
import Database from 'bun:sqlite';

const db = new Database('./db/custom.db');

const columns = db.prepare("PRAGMA table_info(products)").all();
console.log('Products table columns:');
console.log(columns);
db.close();