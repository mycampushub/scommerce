/**
 * Product Image Resolution Helper
 *
 * This module provides utilities to resolve product images with the following priority:
 * 1. Variant-specific images (if both size and color are selected)
 * 2. Color-specific images (if color is selected)
 * 3. Product images (fallback)
 */

import { parseImages } from '@/lib/images'

export interface ColorImage {
  id: string
  productId: string
  color: string
  images: string[] | null
}

export interface ImageResolutionOptions {
  productId: string
  selectedColor?: string
  selectedSize?: string
  variantImages?: string[] | null
  productImages?: string[] | null
  colorImages?: ColorImage[]
}

/**
 * Resolve product images with proper priority
 *
 * Priority order:
 * 1. Variant-specific images (if variant has images)
 * 2. Color-specific images (if color selected and color images exist)
 * 3. Product images (fallback)
 *
 * @param options - Image resolution options
 * @returns Array of image URLs
 */
export function resolveProductImages(
  options: ImageResolutionOptions
): string[] {
  const {
    variantImages,
    productImages,
    colorImages,
    selectedColor,
    selectedSize,
  } = options

  // Priority 1: Variant-specific images
  if (variantImages) {
    const parsedVariantImages = parseImages(variantImages)
    if (parsedVariantImages.length > 0) {
      return parsedVariantImages
    }
  }

  // Priority 2: Color-specific images
  if (selectedColor && colorImages && colorImages.length > 0) {
    const colorImage = colorImages.find(
      (ci) => ci.color.toLowerCase() === selectedColor.toLowerCase()
    )

    if (colorImage && colorImage.images) {
      const parsedColorImages = colorImage.images
      if (parsedColorImages.length > 0) {
        return parsedColorImages
      }
    }
  }

  // Priority 3: Product images (fallback)
  if (productImages) {
    const parsedProductImages = parseImages(productImages)
    if (parsedProductImages.length > 0) {
      return parsedProductImages
    }
  }

  // No images found
  return []
}

/**
 * Fetch color images for a product
 * This can be used on both client and server side
 *
 * @param productId - Product ID
 * @returns Array of color images
 */
export async function fetchColorImages(
  productId: string
): Promise<ColorImage[]> {
  try {
    const response = await fetch(`/api/products/${productId}/color-images`)

    if (!response.ok) {
      console.error('Failed to fetch color images:', response.statusText)
      return []
    }

    const data = await response.json()

    if (data.success && data.data?.colorImages) {
      return data.data.colorImages
    }

    return []
  } catch (error) {
    console.error('Error fetching color images:', error)
    return []
  }
}

/**
 * Get available sizes from a product
 * Parses the availableSizes JSON field if present
 *
 * @param product - Product object
 * @returns Array of available sizes
 */
export function getAvailableSizes(product: {
  availableSizes?: string | null
}): string[] {
  if (!product.availableSizes) {
    return []
  }

  try {
    const parsed = JSON.parse(product.availableSizes)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error parsing availableSizes:', error)
    return []
  }
}

/**
 * Get available colors from a product
 * Parses the availableColors JSON field if present
 *
 * @param product - Product object
 * @returns Array of available colors
 */
export function getAvailableColors(product: {
  availableColors?: string | null
}): string[] {
  if (!product.availableColors) {
    return []
  }

  try {
    const parsed = JSON.parse(product.availableColors)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error parsing availableColors:', error)
    return []
  }
}

/**
 * Check if a variant is out of stock
 *
 * @param stock - Stock quantity
 * @returns True if out of stock
 */
export function isOutOfStock(stock: number): boolean {
  return stock <= 0
}

/**
 * Get stock status message
 *
 * @param stock - Stock quantity
 * @returns Stock status message
 */
export function getStockStatus(stock: number): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  message: string
  colorClass: string
} {
  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      message: 'Out of Stock',
      colorClass: 'text-red-600'
    }
  }

  if (stock < 10) {
    return {
      status: 'low_stock',
      message: `Low Stock (${stock} available)`,
      colorClass: 'text-orange-600'
    }
  }

  return {
    status: 'in_stock',
    message: `In Stock (${stock} available)`,
    colorClass: 'text-green-600'
  }
}
