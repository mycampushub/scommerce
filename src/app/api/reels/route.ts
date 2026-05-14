import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { MediaRepository } from '@/db/media.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    // Use MediaRepository for reels
    const reels = await MediaRepository.findAllActiveReels(env);

    const response = NextResponse.json({
      success: true,
      data: reels
    });

    // Add caching headers for reels (static content - 1 hour)
    return addCacheHeaders(response, CachePresets.STATIC);
  } catch (error) {
    console.error('Error fetching reels:', error);
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    });
  }
}
