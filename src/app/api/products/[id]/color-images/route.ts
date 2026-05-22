import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { notFoundResponse, errorResponse, successResponse } from '@/lib/api-response'
import { addCacheHeaders, CachePresets } from '@/lib/http-cache'
import { parseImages } from '@/lib/images'

/**
 * GET /api/products/[id]/color-images
 * Get all color images for a product (public endpoint)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv()

  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return notFoundResponse('Product not found')
    }

    // Fetch all color images for this product
    const colorImages = await ProductRepository.getColorImages(env, id)

    // Transform color images to include parsed images
    const transformedColorImages = colorImages.map((ci) => ({
      id: ci.id,
      productId: id, // Include productId from URL parameter
      color: ci.color,
      images: parseImages(ci.images),
    }))

    const response = successResponse({
      colorImages: transformedColorImages,
    })

    // Add caching headers (semi-static - 5 minutes)
    return addCacheHeaders(response, CachePresets.SEMI_STATIC)
  } catch (error) {
    console.error('Error fetching color images:', error)
    return errorResponse('Failed to fetch color images', 500)
  }
}
