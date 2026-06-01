import { successResponse, errorResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/cloudflare';
import { CategoryRepository } from '@/db/category.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import { rateLimitMiddleware } from '@/lib/rate-limit';


export async function GET(request: Request) {
  // Apply rate limiting for public API
  const rateLimitResponse = await rateLimitMiddleware(request, 'public');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    // Check if hierarchical data is requested
    const url = new URL(request.url);
    const hierarchical = url.searchParams.get('hierarchical') === 'true';

    let categories;

    if (hierarchical) {
      // Fetch hierarchical categories with children
      categories = await CategoryRepository.getTree(env);

      // Transform to match expected frontend format
      const transformedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image || '',
        children: category.children && category.children.length > 0
          ? category.children.map(child => ({
              id: child.id,
              name: child.name,
              slug: child.slug,
              description: child.description,
              image: child.image || '',
            }))
          : undefined,
      }));

      const response = successResponse(transformedCategories);
      return addCacheHeaders(response, CachePresets.SEMI_STATIC);
    } else {
      // Fetch flat list of active categories
      categories = await CategoryRepository.findAllActive(env);

      // Transform categories to match expected frontend format
      const transformedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image || '',
      }));

      const response = successResponse(transformedCategories);
      return addCacheHeaders(response, CachePresets.SEMI_STATIC);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
}
