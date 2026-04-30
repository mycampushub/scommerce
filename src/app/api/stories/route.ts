import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { StoryRepository } from '@/db/story.repository';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    const stories = await StoryRepository.findAllActive(env);

    return NextResponse.json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    });
  }
}
