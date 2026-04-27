import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { CategoryRepository } from '@/db/category.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

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

    const response = NextResponse.json(transformedCategories);

    // Add caching headers for categories (very long cache as they rarely change)
    return addCacheHeaders(response, CachePresets.STATIC);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
