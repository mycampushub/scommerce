import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv, getEnvVar } from '@/lib/cloudflare';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateId, now, execute } from '@/db/db';
import { randomUUID } from 'crypto';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_BATCH = 5; // Maximum files in one upload
// SECURITY: Removed SVG to prevent XSS attacks. SVG files can contain malicious JavaScript.
// If SVG support is needed, implement proper SVG sanitization (e.g., using DOMPurify with SVG support).
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// In-memory cache for duplicate detection (development mode)
const fileHashCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Response types
interface UploadSuccessResponse {
  success: true;
  data: {
    url: string;
    name: string;
    size: number;
    type: string;
    width?: number;
    height: number;
    hash: string;
  };
}

interface UploadErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}

interface DeleteSuccessResponse {
  success: true;
  message: string;
}

interface DeleteErrorResponse {
  success: false;
  error: string;
  code: string;
}

type UploadResponse = UploadSuccessResponse | UploadErrorResponse;
type DeleteResponse = DeleteSuccessResponse | DeleteErrorResponse;

/**
 * Simple hash function for duplicate detection
 */
async function computeHash(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate file type and extension
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  // Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension: ${ext}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions
 */
async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const uint8 = new Uint8Array(buffer);

    // PNG
    if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
      return {
        width: (uint8[16] << 24) | (uint8[17] << 16) | (uint8[18] << 8) | uint8[19],
        height: (uint8[20] << 24) | (uint8[21] << 16) | (uint8[22] << 8) | uint8[23],
      };
    }

    // JPEG
    if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
      let i = 2;
      while (i < uint8.length) {
        if (uint8[i] === 0xFF && uint8[i + 1] === 0xC0) {
          return {
            height: (uint8[i + 5] << 8) | uint8[i + 6],
            width: (uint8[i + 7] << 8) | uint8[i + 8],
          };
        }
        i += 2 + ((uint8[i + 2] << 8) | uint8[i + 3]);
      }
    }

    // WebP
    if (uint8[8] === 0x57 && uint8[9] === 0x45 && uint8[10] === 0x42 && uint8[11] === 0x50) {
      return {
        width: (uint8[24] << 8) | uint8[25],
        height: (uint8[26] << 8) | uint8[27],
      };
    }

    // GIF
    if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
      return {
        width: (uint8[6] << 8) | uint8[7],
        height: (uint8[8] << 8) | uint8[9],
      };
    }

    return { width: 0, height: 0 }; // Default for SVG or other formats
  } catch (error) {
    console.error('[Upload API] Error getting image dimensions:', error);
    return { width: 0, height: 0 };
  }
}

/**
 * Generate unique filename using cryptographically secure random
 */
function generateFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  // SECURITY: Use randomUUID() instead of Math.random() for cryptographically secure randomness
  const uniqueId = randomUUID().split('-').join('').substring(0, 12);
  
  // Sanitize original filename to extract extension safely
  const safeOriginalName = originalName.replace(/[^a-zA-Z0-9._-]/g, '');
  const ext = safeOriginalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Validate extension is in allowed list
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Invalid file extension: ${ext}`);
  }
  
  return `${userId}-${timestamp}-${uniqueId}.${ext}`;
}

/**
 * Sanitize file path to prevent directory traversal
 */
function sanitizePath(path: string): string {
  return path
    .replace(/\.\./g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .trim();
}

/**
 * Check for duplicate files
 */
async function checkDuplicate(hash: string): Promise<string | null> {
  // Clean up expired cache entries
  const now = Date.now();
  for (const [key, value] of fileHashCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      fileHashCache.delete(key);
    }
  }

  // Check if hash exists in cache
  const cached = fileHashCache.get(hash);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  return null;
}

/**
 * POST handler - Upload file
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  console.log('[Upload API] POST request received');

  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
  if (userOrResponse instanceof NextResponse) {
    console.log('[Upload API] Authentication failed');
    return userOrResponse as NextResponse<UploadErrorResponse>;
  }

  const userId = userOrResponse.id;
  console.log('[Upload API] Auth verified for user:', userId, userOrResponse.role);

  const env = await getEnv();

  // Rate limiting: 20 uploads per minute per user
  const rateLimitResult = await rateLimit(env, `upload:${userId}`, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  });

  if (!rateLimitResult.success) {
    console.log('[Upload API] Rate limit exceeded for user:', userId);
    return NextResponse.json(
      {
        success: false,
        error: 'Too many upload attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          resetTime: rateLimitResult.reset,
        },
      } as UploadErrorResponse,
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(((rateLimitResult.reset || 0) - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
          code: 'NO_FILE',
        } as UploadErrorResponse,
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      console.log('[Upload API] File validation failed:', validation.error);
      return NextResponse.json(
        {
          success: false,
          error: validation.error!,
          code: 'INVALID_FILE',
        } as UploadErrorResponse,
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE',
          details: {
            maxSize: MAX_FILE_SIZE,
            actualSize: file.size,
          },
        } as UploadErrorResponse,
        { status: 400 }
      );
    }

    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute hash for duplicate detection
    const hash = await computeHash(buffer);

    // Check for duplicate
    const duplicateUrl = await checkDuplicate(hash);
    if (duplicateUrl) {
      console.log('[Upload API] Duplicate file detected:', duplicateUrl);
      return NextResponse.json({
        success: true,
        data: {
          url: duplicateUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          width: 0,
          height: 0,
          hash,
        },
      } as UploadSuccessResponse);
    }

    // Get image dimensions
    const dims = await getImageDimensions(buffer);
    console.log('[Upload API] Image dimensions:', dims);

    // Generate unique filename
    const filename = generateFilename(file.name, userId);
    console.log('[Upload API] Generated filename:', filename);

    let fileUrl: string;

    // Upload to R2 or local filesystem
    if (env?.BUCKET) {
      // Upload to R2 bucket (Cloudflare Workers)
      console.log('[Upload API] Uploading to R2 bucket');
      try {
        await env.BUCKET.put(filename, buffer, {
          httpMetadata: {
            contentType: file.type,
          },
        });

        // Get R2 public URL from environment variable or fallback
        const r2PublicUrl = await getEnvVar('R2_PUBLIC_URL');
        if (r2PublicUrl) {
          fileUrl = `${r2PublicUrl}/${filename}`;
        } else {
          fileUrl = `/uploads/${filename}`;
        }

        console.log('[Upload API] R2 upload successful:', fileUrl);

        // Cache the file hash
        fileHashCache.set(hash, { url: fileUrl, timestamp: Date.now() });
      } catch (r2Error: any) {
        console.error('[Upload API] R2 upload error:', r2Error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to upload to R2 storage. Please try again.',
            code: 'R2_UPLOAD_FAILED',
            details: process.env.NODE_ENV === 'development' ? r2Error.message : undefined,
          } as UploadErrorResponse,
          { status: 500 }
        );
      }
    } else {
      // Local development: Use filesystem
      console.log('[Upload API] Uploading to local filesystem');
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');

      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
          console.log('[Upload API] Created uploads directory:', uploadsDir);
        }

        const filePath = join(uploadsDir, filename);
        await writeFile(filePath, buffer);
        fileUrl = `/uploads/${filename}`;

        console.log('[Upload API] Filesystem upload successful:', fileUrl);

        // Cache the file hash
        fileHashCache.set(hash, { url: fileUrl, timestamp: Date.now() });
      } catch (fsError: any) {
        console.error('[Upload API] Filesystem upload error:', fsError);
        return NextResponse.json(
          {
            success: false,
            error: `File upload failed: ${fsError?.message || 'Operation not permitted'}`,
            code: 'FS_UPLOAD_FAILED',
            details: process.env.NODE_ENV === 'development' ? fsError.message : undefined,
          } as UploadErrorResponse,
          { status: 500 }
        );
      }
    }

    // Save to media table for centralized management
    try {
      const mediaId = generateId();
      const currentTime = now();

      await execute(
        env || { DB: null },
        `INSERT INTO media (id, filename, originalName, url, mimeType, size, width, height, alt, tags, category, uploadedBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        mediaId,
        filename,
        file.name,
        fileUrl,
        file.type,
        file.size,
        dims?.width || 0,
        dims?.height || 0,
        '', // alt - can be added later via gallery edit
        '[]', // tags - empty array by default
        'product', // category - product images by default
        userId,
        currentTime,
        currentTime
      );

      console.log('[Upload API] Saved to media table with ID:', mediaId);
    } catch (mediaError) {
      console.error('[Upload API] Failed to save to media table:', mediaError);
      // Don't fail the upload if media table insertion fails
      // The file is already uploaded, just log the error
    }

    // Log admin action
    try {
      const { logAdminAction } = await import('@/lib/audit-logger');
      await logAdminAction(
        env || { DB: null },
        request,
        userId,
        'UPLOAD',
        'Product',
        filename,
        `Uploaded product image: ${filename} (${(file.size / 1024).toFixed(2)}KB, ${file.type}, ${dims?.width || 0}x${dims?.height || 0})`
      );
    } catch (logError) {
      console.error('[Upload API] Failed to log admin action:', logError);
      // Don't fail the upload if logging fails
    }

    console.log('[Upload API] Upload completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        name: filename,
        size: file.size,
        type: file.type,
        width: dims?.width || 0,
        height: dims?.height || 0,
        hash,
      },
    } as UploadSuccessResponse);
  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to upload file${error instanceof Error ? `: ${error.message}` : ''}`,
        code: 'UPLOAD_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } as UploadErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE handler - Delete file
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteResponse>> {
  console.log('[Upload API] DELETE request received');

  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
  if (userOrResponse instanceof NextResponse) {
    console.log('[Upload API] Authentication failed');
    return userOrResponse as NextResponse<DeleteErrorResponse>;
  }

  const userId = userOrResponse.id;
  console.log('[Upload API] Auth verified for user:', userId, userOrResponse.role);

  const env = await getEnv();
  console.log('[Upload API] Environment:', env ? 'Cloudflare' : 'Local', 'Has R2:', !!env?.BUCKET);

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file path provided',
          code: 'NO_PATH',
        } as DeleteErrorResponse,
        { status: 400 }
      );
    }

    // Sanitize path
    const sanitizedPath = sanitizePath(path);

    // Security check: ensure path is within uploads directory
    if (!sanitizedPath.startsWith('uploads/') && !sanitizedPath.startsWith('/uploads/')) {
      console.log('[Upload API] Invalid file path:', sanitizedPath);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file path',
          code: 'INVALID_PATH',
        } as DeleteErrorResponse,
        { status: 400 }
      );
    }

    // Extract filename from path
    const filename = sanitizedPath.replace(/^\/?uploads\//, '');
    const fileUrl = sanitizedPath.startsWith('/') ? sanitizedPath : `/${sanitizedPath}`;
    console.log('[Upload API] Deleting file:', filename, 'URL:', fileUrl);

    // Delete from R2 or local filesystem
    if (env?.BUCKET) {
      // Delete from R2 bucket
      console.log('[Upload API] Deleting from R2 bucket');
      try {
        await env.BUCKET.delete(filename);
        console.log('[Upload API] R2 delete successful:', filename);
      } catch (r2Error: any) {
        console.error('[Upload API] R2 delete error:', r2Error);
        // Don't fail if file doesn't exist in R2
        if (!r2Error.message?.includes('not found')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to delete file from R2 storage',
              code: 'R2_DELETE_FAILED',
              details: process.env.NODE_ENV === 'development' ? r2Error.message : undefined,
            } as DeleteErrorResponse,
            { status: 500 }
          );
        }
      }
    } else {
      // Local development: Use filesystem
      console.log('[Upload API] Deleting from local filesystem');
      const { unlink } = await import('fs/promises');
      const { join } = await import('path');

      try {
        const cleanPath = sanitizedPath.startsWith('/') ? sanitizedPath.slice(1) : sanitizedPath;
        const filePath = join(process.cwd(), 'public', cleanPath);

        await unlink(filePath);
        console.log('[Upload API] Filesystem delete successful:', filePath);
      } catch (fsError: any) {
        // File doesn't exist, that's ok
        if (fsError.code !== 'ENOENT') {
          console.error('[Upload API] Filesystem delete error:', fsError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to delete file',
              code: 'FS_DELETE_FAILED',
              details: process.env.NODE_ENV === 'development' ? fsError.message : undefined,
            } as DeleteErrorResponse,
            { status: 500 }
          );
        }
        console.log('[Upload API] File not found (already deleted):', fsError.code);
      }
    }

    // Remove from cache
    for (const [hash, value] of fileHashCache.entries()) {
      if (value.url.includes(filename)) {
        fileHashCache.delete(hash);
        break;
      }
    }

    // Delete from media table
    try {
      await execute(
        env || { DB: null },
        `DELETE FROM media WHERE url = ?`,
        fileUrl
      );
      console.log('[Upload API] Deleted from media table');
    } catch (mediaError) {
      console.error('[Upload API] Failed to delete from media table:', mediaError);
      // Don't fail the delete if media table deletion fails
    }

    // Log admin action
    try {
      const { logAdminAction } = await import('@/lib/audit-logger');
      await logAdminAction(
        env || { DB: null },
        request,
        userId,
        'DELETE',
        'Product',
        filename,
        `Deleted product image: ${filename}`
      );
    } catch (logError) {
      console.error('[Upload API] Failed to log admin action:', logError);
      // Don't fail the delete if logging fails
    }

    console.log('[Upload API] Delete completed successfully');

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    } as DeleteSuccessResponse);
  } catch (error: any) {
    console.error('[Upload API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        code: 'DELETE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } as DeleteErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
