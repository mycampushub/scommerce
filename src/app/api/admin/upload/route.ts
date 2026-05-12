import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv, getEnvVar } from '@/lib/cloudflare';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  console.log('[Upload POST] Request received');

  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
  if (userOrResponse instanceof NextResponse) {
    console.log('[Upload POST] Auth failed');
    return userOrResponse;
  }

  console.log('[Upload POST] Auth passed');

  const env = getEnv();
  console.log('[Upload POST] Env:', env ? 'exists' : 'null', 'Has R2:', env?.BUCKET ? 'yes' : 'no');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

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
          error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `${uniqueId}.${ext}`;

    let fileUrl: string;

    if (env?.BUCKET) {
      // Upload to R2 bucket (Cloudflare Workers)
      console.log('[Upload POST] Using R2 bucket');
      try {
        const arrayBuffer = await file.arrayBuffer();

        await env.BUCKET.put(filename, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
          },
        });

        // Get R2 public URL from environment variable or fallback to uploads path
        const r2PublicUrl = getEnvVar('R2_PUBLIC_URL') || '';
        if (r2PublicUrl) {
          fileUrl = `${r2PublicUrl}/${filename}`;
        } else {
          fileUrl = `/uploads/${filename}`;
        }
        console.log('[Upload POST] R2 upload successful:', fileUrl);
      } catch (r2Error) {
        console.error('[Upload POST] R2 upload error:', r2Error);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to upload to R2 storage. Please try again.'
          },
          { status: 500 }
        );
      }
    } else {
      // Local development: Use filesystem
      console.log('[Upload POST] Using filesystem (local development)');
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const { existsSync } = await import('fs');

      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        const filePath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filePath, buffer);
        fileUrl = `/uploads/${filename}`;
        console.log('[Upload POST] Filesystem upload successful:', fileUrl);
      } catch (fsError: any) {
        console.error('[Upload POST] Filesystem upload error:', fsError);
        return NextResponse.json(
          {
            success: false,
            error: `File upload failed: ${fsError?.message || 'Operation not permitted'}`
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        name: filename,
        size: file.size,
        type: file.type
      }
    });
  } catch (error: any) {
    console.error('[Upload API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to upload file${error instanceof Error ? `: ${error.message}` : ''}`,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('[Upload DELETE] Request received');

  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff']);
  if (userOrResponse instanceof NextResponse) {
    console.log('[Upload DELETE] Auth failed');
    return userOrResponse;
  }

  const env = getEnv();
  console.log('[Upload DELETE] Env:', env ? 'exists' : 'null', 'Has R2:', env?.BUCKET ? 'yes' : 'no');

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Security check: ensure path is within uploads directory
    if (!path.startsWith('/uploads/') && !path.startsWith('uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Extract filename from path
    const filename = path.replace('/uploads/', '').replace('uploads/', '');

    if (env?.BUCKET) {
      // Delete from R2 bucket (Cloudflare Workers)
      console.log('[Upload DELETE] Using R2 bucket');
      try {
        await env.BUCKET.delete(filename);
        console.log('[Upload DELETE] R2 delete successful:', filename);
      } catch (r2Error) {
        console.error('[Upload DELETE] R2 delete error:', r2Error);
        // Don't fail if file doesn't exist in R2
      }
    } else {
      // Local development: Use filesystem
      console.log('[Upload DELETE] Using filesystem (local development)');
      const { unlink } = await import('fs/promises');
      const { join } = await import('path');

      try {
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        const filePath = join(process.cwd(), 'public', cleanPath);

        await unlink(filePath);
        console.log('[Upload DELETE] Filesystem delete successful:', filePath);
      } catch (fsError: any) {
        // File doesn't exist, that's ok
        if (fsError.code !== 'ENOENT') {
          console.error('[Upload DELETE] Filesystem delete error:', fsError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: any) {
    console.error('[Delete API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
      },
      { status: 500 }
    );
  }
}
