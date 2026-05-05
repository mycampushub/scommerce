/**
 * Cryptographically secure random utilities
 * Replaces insecure Math.random() for security-sensitive operations
 */

/**
 * Generate a cryptographically secure random string
 * @param length - Length of the random string (default: 9)
 * @returns Secure random string using base36 encoding
 */
export function secureRandomString(length: number = 9): string {
  // Use crypto.getRandomValues for secure random number generation
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  // Convert to base36 string and ensure minimum length
  let randomString = array[0].toString(36);

  // Pad or trim to desired length
  while (randomString.length < length) {
    const moreArray = new Uint32Array(1);
    crypto.getRandomValues(moreArray);
    randomString += moreArray[0].toString(36);
  }

  return randomString.substring(0, length).toUpperCase();
}

/**
 * Generate a secure email verification token
 * @returns 32-character secure random token
 */
export function generateEmailToken(): string {
  return secureRandomString(16) + secureRandomString(16);
}

/**
 * Generate a secure ID with timestamp prefix
 * @returns Unique ID combining timestamp and secure random string
 */
export function generateSecureId(): string {
  const timestamp = Date.now().toString(36);
  const random = secureRandomString(9);
  return `${timestamp}-${random}`;
}

/**
 * Generate a secure order number
 * @returns Unique order number in format ORD-{timestamp}-{random}
 */
export function generateSecureOrderNumber(): string {
  const timestamp = Date.now();
  const random = secureRandomString(4).toLowerCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Generate a cryptographically secure random number within a range
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Secure random number in range [min, max)
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const cutoff = Math.floor((256 ** bytesNeeded) / range) * range;
  const array = new Uint8Array(bytesNeeded);

  let value;
  do {
    crypto.getRandomValues(array);
    value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) + array[i];
    }
  } while (value >= cutoff);

  return min + (value % range);
}

/**
 * Generate a cryptographically secure random percentage (0-100)
 * @returns Random integer between 0 and 100
 */
export function secureRandomPercentage(): number {
  return secureRandomInt(0, 101);
}

/**
 * Generate a cryptographically secure random float between 0 and 1
 * @returns Random float [0, 1)
 */
export function secureRandomFloat(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
}
