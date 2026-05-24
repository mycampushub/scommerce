/**
 * Image Optimization Utilities
 * Helper functions for image optimization and manipulation
 */

/**
 * Get optimized image URL with parameters
 * Note: This is a placeholder. In production, you'd integrate with
 * your image CDN or optimization service (e.g., Cloudinary, Vercel, etc.)
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png' | 'auto'
  } = {}
): string {
  if (!url) {
    return '/placeholder-image.jpg'
  }

  // If it's an external URL, return as-is (in production, use your CDN)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // For local images, we can add query params for optimization
  const params = new URLSearchParams()

  if (options.width) params.append('w', options.width.toString())
  if (options.height) params.append('h', options.height.toString())
  if (options.quality) params.append('q', options.quality.toString())
  if (options.format && options.format !== 'auto') {
    params.append('f', options.format)
  }

  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * Generate a blur data URL for progressive loading
 * Note: In production, this would generate an actual blur hash
 */
export function generateBlurDataUrl(
  imageUrl: string,
  width: number = 10,
  height: number = 10
): string {
  // This is a placeholder. In production, you'd generate actual blur data
  // using a library like `blurhash` or `sharp`
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3C/svg%3E`
}

/**
 * Preload images for better performance
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    if (typeof window === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url

    document.head.appendChild(link)
  })
}

/**
 * Get responsive image srcset
 */
export function getResponsiveSrcSet(
  baseUrl: string,
  sizes: number[],
  format: 'webp' | 'jpg' | 'png' = 'webp'
): string {
  return sizes
    .map(size => `${getOptimizedImageUrl(baseUrl, { width: size, format })} ${size}w`)
    .join(', ')
}

/**
 * Common image sizes for responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: [150, 200, 300],
  small: [300, 400, 500],
  medium: [600, 800, 1000],
  large: [1200, 1600, 2000],
  xlarge: [2400, 3200, 4000]
} as const

/**
 * Get image size category
 */
export function getImageSizeCategory(width: number): keyof typeof IMAGE_SIZES {
  if (width <= 300) return 'thumbnail'
  if (width <= 600) return 'small'
  if (width <= 1200) return 'medium'
  if (width <= 2400) return 'large'
  return 'xlarge'
}
