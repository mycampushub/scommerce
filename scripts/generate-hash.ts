#!/usr/bin/env bun
/**
 * Generate a PBKDF2 password hash for testing or seeding
 * Usage: bun scripts/generate-hash.ts <password>
 */

async function generateHash(password: string) {
  const iterations = 100000;
  const hashLength = 64;
  const saltLength = 32;
  const algorithm = 'SHA-256';

  // Generate salt
  const salt = new Uint8Array(saltLength);
  crypto.getRandomValues(salt);

  // Derive key
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
      hash: algorithm,
    },
    baseKey,
    hashLength * 8
  );

  const hash = new Uint8Array(derivedBits);

  // Convert to hex
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const fullHash = `pbkdf2$${iterations}$${saltHex}$${hashHex}`;

  console.log('Password:', password);
  console.log('PBKDF2 Hash:', fullHash);
  console.log('');
  console.log('You can use this hash in seed.sql or database directly.');
}

const password = process.argv[2] || 'admin123';
await generateHash(password);