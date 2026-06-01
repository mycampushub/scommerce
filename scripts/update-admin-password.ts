#!/usr/bin/env bun
import Database from 'bun:sqlite';

const db = new Database('./db/custom.db');

// Update admin password to PBKDF2
const newHash = 'pbkdf2$100000$245cfd1a81687a32a2c548503b960472c1ca4092a3ca9c059b9f6d047fe70884$19674afc0599cdfe8e9fc3e9ce3d498b02cf29133e4c88f266553bd7c7e5ac7d11f993e5dca14ab2207b5d23a491b935f3b24855a7d21e927b9d222c5b479733';

const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(newHash, 'admin@scommerce.com');

console.log(`Updated ${result.changes} user(s)`);
db.close();