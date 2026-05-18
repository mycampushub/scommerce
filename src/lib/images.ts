/**
 * Centralized image parsing utility
 * Handles various image data formats consistently across the application
 */

/**
 * Parse image data from various formats into a consistent array of strings
 * Supports:
 * - Array of strings (already parsed)
 * - JSON string containing array
 * - Single string URL
 * - Null/undefined (returns empty array)
 */
export function parseImages(
  imgData: string | string[] | null | undefined
): string[] {
  // If already an array, return it
  if (Array.isArray(imgData)) {
    return imgData.filter(img => img && typeof img === 'string')
  }

  // If null or undefined, return empty array
  if (!imgData) {
    return []
  }

  // If string, try to parse as JSON or treat as single URL
  if (typeof imgData === 'string') {
    // If already a URL (starts with http, https, or /)
    if (imgData.startsWith('http://') ||
        imgData.startsWith('https://') ||
        imgData.startsWith('/')) {
      return [imgData]
    }

    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(imgData)
      if (Array.isArray(parsed)) {
        return parsed.filter((img: any) => img && typeof img === 'string')
      }
      // If parsed but not array, treat as single value
      if (parsed && typeof parsed === 'string') {
        return [parsed]
      }
    } catch (e) {
      // Not valid JSON, treat as single URL
      return [imgData]
    }
  }

  return []
}

/**
 * Convert image array back to storage format
 * Stores as JSON string for database compatibility
 */
export function stringifyImages(images: string[] | null | undefined): string | null {
  if (!images || images.length === 0) {
    return null
  }

  // Filter out invalid entries
  const validImages = images.filter(img => img && typeof img === 'string')

  if (validImages.length === 0) {
    return null
  }

  return JSON.stringify(validImages)
}

/**
 * Validate if a string is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Allow relative URLs starting with /
  if (url.startsWith('/')) {
    return true
  }

  // Validate full URLs
  try {
    const parsed = new URL(url)
    // Check for valid image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
    const pathname = parsed.pathname.toLowerCase()
    return imageExtensions.some(ext => pathname.endsWith(ext))
  } catch {
    return false
  }
}

/**
 * Get the first image from image data
 */
export function getFirstImage(
  imgData: string | string[] | null | undefined,
  fallback: string = ''
): string {
  const images = parseImages(imgData)
  return images.length > 0 ? images[0] : fallback
}

/**
 * Check if image data has any images
 */
export function hasImages(
  imgData: string | string[] | null | undefined
): boolean {
  return parseImages(imgData).length > 0
}

/**
 * Add an image to image data
 */
export function addImage(
  imgData: string | string[] | null | undefined,
  newImage: string
): string {
  const images = parseImages(imgData)
  if (!images.includes(newImage)) {
    images.push(newImage)
  }
  return stringifyImages(images) || ''
}

/**
 * Remove an image from image data
 */
export function removeImage(
  imgData: string | string[] | null | undefined,
  imageToRemove: string
): string {
  const images = parseImages(imgData)
  const filtered = images.filter(img => img !== imageToRemove)
  return stringifyImages(filtered) || ''
}
