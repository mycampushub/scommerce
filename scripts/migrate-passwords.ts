#!/usr/bin/env bun
/**
 * Migrate existing bcrypt hashes to PBKDF2 format
 * Usage: bun scripts/migrate-passwords.ts [--test]
 *
 * --test: Test with a specific password without updating database
 */

import Database from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

// PBKDF2 Configuration
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH_LENGTH = 64;
const PBKDF2_ALGORITHM = 'SHA-256' as const;
const SALT_LENGTH = 32;

async function generateSalt(length: number = SALT_LENGTH): Promise<Uint8Array> {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = PBKDF2_ITERATIONS
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: PBKDF2_ALGORITHM,
    },
    baseKey,
    PBKDF2_HASH_LENGTH * 8
  );

  return new Uint8Array(derivedBits);
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt(SALT_LENGTH);
  const hash = await deriveKey(password, salt, PBKDF2_ITERATIONS);

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(hash);

  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

function isPBKDF2Hash(hash: string): boolean {
  return hash?.startsWith?.('pbkdf2$') || false;
}

async function main() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');
  const testPassword = args.find(arg => arg.startsWith('--password='))?.split('=')[1];

  const dbPath = join(process.cwd(), 'db/custom.db');

  if (!testPassword && !testMode) {
    console.log('Password Migration Script');
    console.log('=========================\n');
    console.log('This script will migrate all bcrypt password hashes to PBKDF2 format.');
    console.log('Please provide a password for each user to migrate their hash.\n');
    console.log('To test without updating, use: bun scripts/migrate-passwords.ts --test');
    console.log('To migrate a specific password, use: bun scripts/migrate-passwords.ts --password=yourpassword\n');
    process.exit(0);
  }

  if (testMode && !testPassword) {
    // Just show status without migrating
    try {
      const db = new Database(dbPath, { readonly: true });

      const users = db.prepare('SELECT id, email, password FROM users WHERE password IS NOT NULL').all();

      let pbkdf2Count = 0;
      let bcryptCount = 0;

      console.log('Password Hash Status');
      console.log('====================\n');

      for (const user of users as any[]) {
        const isPBKDF2 = isPBKDF2Hash(user.password);
        if (isPBKDF2) {
          pbkdf2Count++;
          console.log(`✓ ${user.email} (${user.id}) - PBKDF2`);
        } else {
          bcryptCount++;
          console.log(`✗ ${user.email} (${user.id}) - bcrypt (needs migration)`);
        }
      }

      console.log('\nSummary:');
      console.log(`Total users: ${users.length}`);
      console.log(`PBKDF2 hashes: ${pbkdf2Count}`);
      console.log(`Bcrypt hashes: ${bcryptCount}`);
      console.log(`Needs migration: ${bcryptCount > 0 ? 'YES' : 'NO'}`);

      db.close();

      if (bcryptCount > 0) {
        console.log('\nTo migrate, run: bun scripts/migrate-passwords.ts --password=<user_password>');
        console.log('Note: You will need to provide each user\'s password to verify and migrate.');
      }
    } catch (error: any) {
      console.error('Error checking database:', error.message);
      process.exit(1);
    }
    return;
  }

  // Migration mode
  if (!testPassword) {
    console.error('Error: --password is required for migration');
    process.exit(1);
  }

  try {
    const db = new Database(dbPath);

    const users = db.prepare('SELECT id, email, password FROM users WHERE password IS NOT NULL').all();

    console.log(`Found ${users.length} users with passwords\n`);

    // Import bcryptjs for verification
    const bcrypt = await import('bcryptjs');

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users as any[]) {
      // Skip if already PBKDF2
      if (isPBKDF2Hash(user.password)) {
        console.log(`⏭  Skipping ${user.email} - already PBKDF2`);
        skippedCount++;
        continue;
      }

      // Verify password against bcrypt hash
      const isValid = await bcrypt.compare(testPassword, user.password);

      if (!isValid) {
        console.error(`✗ Failed: ${user.email} - password verification failed`);
        errorCount++;
        continue;
      }

      // Generate new PBKDF2 hash
      const newHash = await hashPassword(testPassword);

      // Update database
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, user.id);

      console.log(`✓ Migrated: ${user.email} (${user.id})`);
      migratedCount++;
    }

    db.close();

    console.log('\nMigration Summary');
    console.log('==================');
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total: ${users.length}`);

    if (errorCount > 0) {
      console.log('\nNote: Errors occurred because the provided password did not match the bcrypt hash.');
      console.log('You may need to ask those users to reset their passwords.');
    }
  } catch (error: any) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);