import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { ProductRepository } from '@/db/product.repository';
import { CategoryRepository } from '@/db/category.repository';
import { numberToBool, parseJSON, queryFirst } from '@/db/db';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = await getEnv();

  try {
    const productId = (await params).id;

    // Try to find by ID first
    let product = await ProductRepository.findById(env, productId);

    // If not found by ID, try by slug
    if (!product) {
      product = await ProductRepository.findBySlug(env, productId);
    }

    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Get category
    const category = await CategoryRepository.findById(env, product.categoryId);

    // Images are already parsed by ProductRepository.findById
    const images = Array.isArray(product.images) ? product.images : [];

    // Fetch real review data
    const { queryFirst } = await import('@/db/db');
    const reviewData = await queryFirst<{ avgRating: number, totalReviews: number }>(
      env,
      `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews
       FROM product_reviews
       WHERE productId = ? AND isApproved = 1`,
      product.id
    );

    const avgRating = reviewData?.avgRating || 0;
    const totalReviews = reviewData?.totalReviews || 0;

    // Transform to match frontend format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.basePrice,
      basePrice: product.basePrice, // Added basePrice field for frontend
      comparePrice: product.comparePrice,
      originalPrice: product.comparePrice || undefined,
      image: images[0] || category?.image || '',
      images: images,
      rating: avgRating || 4.5, // Fallback to 4.5 if no reviews
      reviews: totalReviews,
      badge: product.comparePrice ? 'Sale' : numberToBool(product.isFeatured) ? 'New' : undefined,
      category: category?.name,
      categorySlug: category?.slug,
      categoryId: product.categoryId,
      stock: product.stock,
      lowStockAlert: product.lowStockAlert,
      attributes: {}, // In production, this would be parsed from database
      isFeatured: numberToBool(product.isFeatured),
      isActive: numberToBool(product.isActive),
      hasVariants: numberToBool(product.hasVariants),
      brandName: product.brandName || null,
      countryOfOrigin: product.countryOfOrigin || null,
      sizeType: product.sizeType || null,
      sizeValue: product.sizeValue || null,
      sizeUnit: product.sizeUnit || null,
      sizeLabel: product.sizeLabel || null,
      // Material and color for single products
      material: product.material || null,
      color: product.color || null,
      // Multi-size/color system
      availableSizes: product.availableSizes || [],
      availableColors: product.availableColors || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    const response = successResponse(transformedProduct);

    // Add caching headers for product detail (semi-static - 10 minutes)
    return addCacheHeaders(response, CachePresets.SEMI_STATIC);
  } catch (error) {
    console.error('Error fetching product:', error);
    return errorResponse('Failed to fetch product', 500);
  }
}
