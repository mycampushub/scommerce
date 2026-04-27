import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { ReelRepository } from '@/db/reel.repository';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    const reels = await ReelRepository.findAllActive(env);

    return NextResponse.json({
      success: true,
      data: reels
    });
  } catch (error) {
    console.error('Error fetching reels:', error);
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    });
  }
}
