#!/usr/bin/env bun
import Database from 'bun:sqlite';

const db = new Database('./db/custom.db');
const users = db.prepare('SELECT id, email, password, role FROM users').all();

console.log('Users in database:');
console.log(users);
db.close();