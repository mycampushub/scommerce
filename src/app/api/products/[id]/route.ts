import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { ProductRepository } from '@/db/product.repository';
import { CategoryRepository } from '@/db/category.repository';
import { numberToBool, parseJSON, queryFirst } from '@/db/db';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    const productId = params.id;

    // Try to find by ID first
    let product = await ProductRepository.findById(env, productId);

    // If not found by ID, try by slug
    if (!product) {
      product = await ProductRepository.findBySlug(env, productId);
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get category
    const category = await CategoryRepository.findById(env, product.categoryId);

    // Parse images
    const images = parseJSON<string[]>(product.images) || [];

    // Transform to match frontend format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.basePrice,
      comparePrice: product.comparePrice,
      originalPrice: product.comparePrice || undefined,
      image: images[0] || category?.image || '',
      images: images,
      rating: 4.5, // Default rating - in production, calculate from reviews
      reviews: Math.floor(Math.random() * 500) + 10, // Random reviews - in production, use real count
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
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
