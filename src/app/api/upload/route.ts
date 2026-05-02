import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${randomString}.${extension}`;
}

export async function POST(request: Request) {
  try {
    // Get Cloudflare environment
    const env = getEnv();

    if (!env || !env.BUCKET) {
      return NextResponse.json(
        { success: false, error: 'Storage service not available' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is 5MB`
        },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const filename = generateFilename(file.name);
    const key = `uploads/${filename}`;

    // Upload to R2 bucket
    try {
      await env.BUCKET.put(key, buffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });
    } catch (uploadError: any) {
      console.error('Error uploading to R2:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Return the public URL
    // Note: The URL will be served through the worker at /uploads/{filename}
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: url,
        filename: filename,
        size: file.size,
        type: file.type,
      },
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process upload' },
      { status: 500 }
    );
  }
}
