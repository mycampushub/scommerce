import { NextResponse } from 'next/server';
import { getEnv, isCloudflareEnv } from '@/lib/cloudflare';
import { StoryRepositoryPrisma } from '@/db/story-prisma.repository';
import { StoryRepository } from '@/db/story.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv();

  try {
    // Use Prisma for local development, D1 for Cloudflare
    const stories = isCloudflareEnv()
      ? await StoryRepository.findAllActive(env)
      : await StoryRepositoryPrisma.findAllActive(env);

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
