import { successResponse, errorResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/cloudflare';
import { CategoryRepository } from '@/db/category.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    // Fetch categories from database
    const categories = await CategoryRepository.findAllActive(env);

    // Transform categories to match expected frontend format
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image || '',
    }));

    const response = successResponse(transformedCategories);

    // Add caching headers for categories (semi-static - 10 minutes)
    return addCacheHeaders(response, CachePresets.SEMI_STATIC);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
}
