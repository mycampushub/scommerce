import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { ReelRepository } from '@/db/reel.repository';
import { ProductRepository } from '@/db/product.repository';
import { parseJSON } from '@/db/db';

// Edge Runtime export for Cloudflare

export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  try {
    const reels = await ReelRepository.findAllActive(env);

    // Fetch products for all reels
    const allProductIds: string[] = [];
    const reelsWithProducts: any[] = [];

    for (const reel of reels) {
      const productIds = parseJSON<string[]>(reel.productIds) || [];
      allProductIds.push(...productIds);
    }

    // Get unique product IDs
    const uniqueProductIds = [...new Set(allProductIds)];

    // Fetch all products in one query
    const productsMap: Record<string, any> = {};
    if (uniqueProductIds.length > 0) {
      for (const productId of uniqueProductIds) {
        const product = await ProductRepository.findById(env, productId);
        if (product) {
          const images = parseJSON<string[]>(product.images) || [];
          productsMap[productId] = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.basePrice,
            comparePrice: product.comparePrice,
            image: images[0] || '',
            images: images,
            stock: product.stock,
            hasVariants: product.hasVariants === 1
          };
        }
      }
    }

    // Attach products to reels
    const enrichedReels = reels.map((reel: any) => {
      const productIds = parseJSON<string[]>(reel.productIds) || [];
      const products = productIds
        .map(id => productsMap[id])
        .filter(p => p !== undefined);

      return {
        ...reel,
        products
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedReels
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
