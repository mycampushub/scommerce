import { NextResponse } from 'next/server';
import { getEnv, isCloudflareEnv } from '@/lib/cloudflare';
import { ReelRepositoryPrisma } from '@/db/reel-prisma.repository';
import { ReelRepository } from '@/db/reel.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv();

  try {
    // Use Prisma for local development, D1 for Cloudflare
    const reels = isCloudflareEnv()
      ? await ReelRepository.findAllActive(env)
      : await ReelRepositoryPrisma.findAllActive(env);

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
