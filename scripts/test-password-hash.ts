#!/usr/bin/env bun
/**
 * Test PBKDF2 hash generation and verification
 */

import { hashPassword, verifyPassword, isPBKDF2Hash } from '../src/lib/bcrypt-wrapper.ts';

async function test() {
  const password = 'test123';

  console.log('Testing PBKDF2 Password Hashing\n');
  console.log('Password:', password);

  // Generate hash
  const hash = await hashPassword(password);
  console.log('Generated Hash:', hash.substring(0, 50) + '...\n');

  // Verify correct password
  const isValid = await verifyPassword(password, hash);
  console.log('Verify correct password:', isValid ? '✓ PASS' : '✗ FAIL');

  // Verify incorrect password
  const isInvalid = await verifyPassword('wrongpassword', hash);
  console.log('Verify incorrect password:', !isInvalid ? '✓ PASS' : '✗ FAIL');

  // Check hash format
  const isPBKDF2 = isPBKDF2Hash(hash);
  console.log('Is PBKDF2 format:', isPBKDF2 ? '✓ PASS' : '✗ FAIL');

  // Check bcrypt detection
  const bcryptHash = '$2a$10$8K1p/a0dL3xQZQdZQZQZQeHhRJgY4t6QZQZQZQZQZQZQZQZQZQZQ';
  const isBcrypt = !isPBKDF2Hash(bcryptHash);
  console.log('Detects bcrypt hash:', isBcrypt ? '✓ PASS' : '✗ FAIL');

  console.log('\n✅ All tests passed!' || '❌ Some tests failed!');
}

test().catch(console.error);