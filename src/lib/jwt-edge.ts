/**
 * Edge-compatible JWT implementation using Web Crypto API
 * Works in Cloudflare Workers, Pages Functions, and all Edge runtimes
 */

export interface JWTPayload {
  userId: string
  email: string
  name: string | null
  role: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

/**
 * Convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

/**
 * Convert Uint8Array to string
 */
function uint8ArrayToString(arr: Uint8Array): string {
  const decoder = new TextDecoder()
  return decoder.decode(arr)
}

/**
 * Get JWT_SECRET (only when needed at runtime)
 */
function getJWTSecret(): Uint8Array {
  const JWT_SECRET_STRING = process.env.JWT_SECRET;
  if (!JWT_SECRET_STRING) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return stringToUint8Array(JWT_SECRET_STRING);
}

/**
 * Get ArrayBuffer from Uint8Array (handles both ArrayBuffer and SharedArrayBuffer)
 */
function getArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  const buffer = uint8Array.buffer;
  // Handle SharedArrayBuffer
  if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) {
    return new ArrayBuffer(buffer.byteLength);
  }
  return buffer as ArrayBuffer;
}

/**
 * Create a JWT token using Web Crypto API
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  const JWT_SECRET = getJWTSecret();
  
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // Create signature
  const data = `${encodedHeader}.${encodedPayload}`;
  const secretBuffer = JWT_SECRET.buffer as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    getArrayBuffer(stringToUint8Array(data))
  );
  
  const encodedSignature = base64UrlEncode(
    uint8ArrayToString(new Uint8Array(signature))
  );
  
  return `${data}.${encodedSignature}`;
}

/**
 * Verify a JWT token using Web Crypto API
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const JWT_SECRET = getJWTSecret();
    
    // Split token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const secretBuffer = JWT_SECRET.buffer as ArrayBuffer;
    const key = await crypto.subtle.importKey(
      'raw',
      secretBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureUint8 = stringToUint8Array(
      base64UrlDecode(encodedSignature)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      getArrayBuffer(signatureUint8),
      getArrayBuffer(stringToUint8Array(data))
    );
    
    if (!isValid) {
      return null;
    }
    
    // Decode payload
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadStr) as JWTPayload;
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Decode token without verification (for debugging only)
 * WARNING: Do not use this for authentication decisions!
 */
export function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const encodedPayload = parts[1];
    const payloadStr = base64UrlDecode(encodedPayload);
    return JSON.parse(payloadStr);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
