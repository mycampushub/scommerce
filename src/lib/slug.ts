/**
 * Slug utility functions for creating and managing URL slugs
 */

/**
 * Convert a string to a URL-friendly slug
 * @param text The text to convert to slug
 * @returns URL-friendly slug string
 */
export function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * Generate a unique slug, appending a number if duplicate
 * @param baseSlug The base slug to use
 * @param existingSlugs Array of existing slugs to check against
 * @returns Unique slug string
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  const normalizedBaseSlug = baseSlug.toLowerCase()
  
  // Check if base slug is unique
  if (!existingSlugs.includes(normalizedBaseSlug)) {
    return normalizedBaseSlug
  }

  // Find next available number
  let counter = 1
  let uniqueSlug = `${normalizedBaseSlug}-${counter}`

  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${normalizedBaseSlug}-${counter}`
  }

  return uniqueSlug
}

/**
 * Check if a slug is valid (non-empty and contains valid characters)
 * @param slug The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0) {
    return false
  }

  // Check if slug contains only valid characters (lowercase letters, numbers, and hyphens)
  const validSlugRegex = /^[a-z0-9-]+$/
  return validSlugRegex.test(slug) && !slug.startsWith('-') && !slug.endsWith('-') && !slug.includes('--')
}

/**
 * Normalize a slug for comparison
 * @param slug The slug to normalize
 * @returns Normalized slug (lowercase, trimmed)
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim()
}

/**
 * Compare two slugs (case-insensitive)
 * @param slug1 First slug
 * @param slug2 Second slug
 * @returns true if slugs are equal (case-insensitive)
 */
export function slugsEqual(slug1: string, slug2: string): boolean {
  return normalizeSlug(slug1) === normalizeSlug(slug2)
}
