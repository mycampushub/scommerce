import { successResponse, errorResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/cloudflare';
import { BannerRepository } from '@/db/banner.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    const banners = await BannerRepository.findAllActive(env);

    const response = successResponse(banners, 'Banners fetched successfully');

    // Add caching headers for banners (static content - 1 hour)
    return addCacheHeaders(response, CachePresets.STATIC);
  } catch (error) {
    console.error('Error fetching banners:', error);
    // Return empty array on error instead of failing
    return errorResponse("Failed to fetch banners", 500, undefined, { data: [] });
  }
}
