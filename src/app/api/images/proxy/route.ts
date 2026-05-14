import { NextRequest, NextResponse } from 'next/server';
import { getEnv, getEnvVar } from '@/lib/cloudflare';

/**
 * GET /api/images/proxy
 * Proxy image requests from /uploads/* path to R2 bucket
 * This fixes 404 errors for old product images with relative paths
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { success: false, error: 'No path provided' },
      { status: 400 }
    );
  }

  // Get R2 public URL from environment
  const r2PublicUrl = await getEnvVar('R2_PUBLIC_URL');

  if (!r2PublicUrl) {
    return NextResponse.json(
      { success: false, error: 'R2 public URL not configured' },
      { status: 500 }
    );
  }

  // Remove /uploads/ prefix from path
  const cleanPath = path.replace(/^\/uploads\//, '').replace(/^uploads\//, '');

  // Construct R2 URL
  const r2Url = `${r2PublicUrl}/${cleanPath}`;

  try {
    // Fetch the image from R2
    const response = await fetch(r2Url);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: response.status }
      );
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Cache for 1 hour
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'CDN-Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
