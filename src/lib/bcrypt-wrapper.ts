/**
 * Password hashing utilities (Edge Runtime compatible)
 * Uses Web Crypto API with PBKDF2 for Cloudflare Workers/Edge Runtime
 *
 * Migration Guide:
 * - New registrations automatically use PBKDF2 format
 * - Existing bcrypt hashes are detected and users are asked to reset password
 * - Run: bun scripts/migrate-passwords.ts --test to check migration status
 * - Run: bun scripts/migrate-passwords.ts --password=<old_password> to migrate hashes
 */

// Configuration for PBKDF2
const PBKDF2_ITERATIONS = 100000; // High iteration count for security
const PBKDF2_HASH_LENGTH = 64; // 512 bits (64 bytes)
const PBKDF2_ALGORITHM = 'SHA-256' as const;
const SALT_LENGTH = 32; // 256 bits (32 bytes)

// Hash format: pbkdf2$<iterations>$<salt>$<hash>
const PBKDF2_PREFIX = 'pbkdf2';

/**
 * Generate a cryptographically secure random salt
 */
async function generateSalt(length: number = SALT_LENGTH): Promise<Uint8Array> {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Derive a key from password using PBKDF2
 */
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
      salt: salt as BufferSource,
      iterations: iterations,
      hash: PBKDF2_ALGORITHM,
    },
    baseKey,
    PBKDF2_HASH_LENGTH * 8 // bits
  );

  return new Uint8Array(derivedBits);
}

/**
 * Convert Uint8Array to hex string
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2 (Cloudflare Workers/Edge Runtime compatible)
 * @param password - Plain text password
 * @returns Hash string in format: pbkdf2$<iterations>$<salt>$<hash>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt(SALT_LENGTH);
  const hash = await deriveKey(password, salt, PBKDF2_ITERATIONS);

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(hash);

  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Verify a password against a hash
 * Supports both PBKDF2 (new) and bcrypt (legacy) formats
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    return false;
  }

  // Check if it's our PBKDF2 format
  if (hashedPassword.startsWith(PBKDF2_PREFIX + '$')) {
    return verifyPBKDF2(password, hashedPassword);
  }

  // Legacy bcrypt hash - would need bcryptjs (not Edge Runtime compatible)
  // For now, we'll need to handle this case
  // In production, you should either:
  // 1. Use a bcrypt implementation compatible with Edge Runtime, or
  // 2. Use a Node.js runtime for routes that need bcrypt, or
  // 3. Require password reset for all users with bcrypt hashes

  // For this implementation, we'll return false to force password reset
  console.warn('Legacy bcrypt hash detected. User needs to reset password.');
  return false;
}

/**
 * Verify password against PBKDF2 hash
 */
async function verifyPBKDF2(
  password: string,
  hashString: string
): Promise<boolean> {
  try {
    const parts = hashString.split('$');
    if (parts.length !== 4) {
      console.error('Invalid PBKDF2 hash format');
      return false;
    }

    const [algorithm, iterationsStr, saltHex, expectedHashHex] = parts;

    if (algorithm !== PBKDF2_PREFIX) {
      console.error('Unexpected algorithm in hash');
      return false;
    }

    const iterations = parseInt(iterationsStr, 10);
    if (isNaN(iterations)) {
      console.error('Invalid iteration count in hash');
      return false;
    }

    const salt = hexToBuffer(saltHex);
    const expectedHash = hexToBuffer(expectedHashHex);

    const derivedHash = await deriveKey(password, salt, iterations);

    // Constant-time comparison to prevent timing attacks
    if (derivedHash.length !== expectedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < derivedHash.length; i++) {
      result |= derivedHash[i] ^ expectedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('Error verifying PBKDF2 hash:', error);
    return false;
  }
}

/**
 * Check if a hash is in the new PBKDF2 format
 */
export function isPBKDF2Hash(hash: string): boolean {
  return hash?.startsWith?.(PBKDF2_PREFIX + '$') || false;
}

/**
 * Migrate a bcrypt hash to PBKDF2 (requires password verification)
 * This should be called after a successful login
 * @param password - Plain text password
 * @param oldHash - Old bcrypt hash
 * @returns New PBKDF2 hash (throws if password doesn't match)
 */
export async function migrateHash(
  password: string,
  oldHash: string
): Promise<string> {
  // For now, since we can't verify bcrypt in Edge Runtime,
  // this function would require a Node.js runtime route
  throw new Error(
    'Hash migration requires Node.js runtime. ' +
    'Please create a dedicated migration route or use the API route.'
  );
}
