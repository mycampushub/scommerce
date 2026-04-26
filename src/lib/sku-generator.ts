/**
 * SKU Generation Utility
 * Generates unique SKUs based on product category, name, and variant attributes
 */

/**
 * Generate SKU for a product variant
 * Format: CAT-PROD-SIZE-COLOR-RAND
 * Example: SAR-SILKREDDL-1234
 */
export function generateSKU(
  categorySlug: string,
  productName: string,
  variant?: { size?: string; color?: string; material?: string }
): string {
  // Category code: First 3 characters, uppercase
  const catCode = categorySlug.substring(0, 3).toUpperCase().padEnd(3, 'X')

  // Product code: First 6 alphanumeric characters, uppercase
  const prodCode = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 6)
    .toUpperCase()
    .padEnd(6, 'X')

  // Size code: First 2 characters, uppercase, no spaces
  const sizeCode = variant?.size
    ? variant.size.replace(/\s/g, '').substring(0, 2).toUpperCase()
    : ''

  // Color code: First 3 characters, uppercase
  const colorCode = variant?.color ? variant.color.substring(0, 3).toUpperCase() : ''

  // Material code: First 3 characters, uppercase
  const materialCode = variant?.material
    ? variant.material.substring(0, 3).toUpperCase()
    : ''

  // Random code: 4 character alphanumeric
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()

  // Combine all parts
  return `${catCode}-${prodCode}${sizeCode}${colorCode}${materialCode}-${random}`
}

/**
 * Generate SKU for a product (without variants)
 * Format: CAT-PROD-0000
 */
export function generateProductSKU(
  categorySlug: string,
  productName: string
): string {
  return generateSKU(categorySlug, productName)
}

/**
 * Validate SKU format
 * Expected format: XXX-XXXXXX-XXXX (12-16 characters)
 */
export function validateSKU(sku: string): boolean {
  // Basic validation: 3 parts separated by hyphens
  const parts = sku.split('-')

  if (parts.length !== 3) {
    return false
  }

  const [catCode, prodCode, random] = parts

  // Category code: 3 uppercase letters
  if (!/^[A-Z]{3}$/.test(catCode)) {
    return false
  }

  // Product code: 6+ alphanumeric characters
  if (!/^[A-Z0-9]{6,}$/.test(prodCode)) {
    return false
  }

  // Random code: 4 alphanumeric characters
  if (!/^[A-Z0-9]{4}$/.test(random)) {
    return false
  }

  return true
}

/**
 * Check if SKU conflicts with existing SKU in database
 * This should be called from backend only
 */
export async function checkSKUConflict(
  sku: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const { db } = await import('./db')

    const existing = await db.productVariant.findFirst({
      where: {
        sku,
        id: excludeId ? { not: excludeId } : undefined,
      },
    })

    return !!existing
  } catch (error) {
    console.error('Error checking SKU conflict:', error)
    return false
  }
}

/**
 * Generate multiple SKUs for a product variant matrix
 * Useful for bulk SKU generation
 */
export function generateSKUMatrix(
  categorySlug: string,
  productName: string,
  variants: Array<{ size?: string; color?: string; material?: string }>
): string[] {
  return variants.map((variant) =>
    generateSKU(categorySlug, productName, variant)
  )
}

/**
 * Parse SKU to extract information
 * Reverse of generateSKU function
 */
export function parseSKU(sku: string): {
  categoryCode: string
  productCode: string
  variantCode: string
  randomCode: string
} | null {
  if (!validateSKU(sku)) {
    return null
  }

  const parts = sku.split('-')

  return {
    categoryCode: parts[0],
    productCode: parts[1].substring(0, 6),
    variantCode: parts[1].substring(6),
    randomCode: parts[2],
  }
}

/**
 * Format SKU for display
 * Makes it more readable for users
 */
export function formatSKUForDisplay(sku: string): string {
  // Already formatted with hyphens, just return as is
  return sku
}

/**
 * Generate a simplified SKU for display purposes
 * Format: CAT-XXXX-XX (shorter version)
 */
export function generateDisplaySKU(sku: string): string {
  const parts = sku.split('-')

  if (parts.length !== 3) {
    return sku
  }

  const [catCode, prodCode, random] = parts

  // Shorten product code to first 4 characters
  return `${catCode}-${prodCode.substring(0, 4)}-${random}`
}

const skuGenerator = {
  generateSKU,
  generateProductSKU,
  validateSKU,
  checkSKUConflict,
  generateSKUMatrix,
  parseSKU,
  formatSKUForDisplay,
  generateDisplaySKU,
}

export default skuGenerator
