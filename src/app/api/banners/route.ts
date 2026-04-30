import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { BannerRepository } from '@/db/banner.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    const banners = await BannerRepository.findAllActive(env);

    const response = NextResponse.json({
      success: true,
      data: banners
    });

    // Add caching headers for banners
    return addCacheHeaders(response, CachePresets.SEMI_STATIC);
  } catch (error) {
    console.error('Error fetching banners:', error);
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    });
  }
}
