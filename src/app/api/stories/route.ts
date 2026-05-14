import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { MediaRepository } from '@/db/media.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    // Use MediaRepository for stories
    const stories = await MediaRepository.findAllActiveStories(env);

    const response = NextResponse.json({
      success: true,
      data: stories
    });

    // Add caching headers for stories (static content - 1 hour)
    return addCacheHeaders(response, CachePresets.STATIC);
  } catch (error) {
    console.error('Error fetching stories:', error);
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    });
  }
}
