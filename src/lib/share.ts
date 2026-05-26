/**
 * Share utility functions for sharing products and content
 */

export interface ShareOptions {
  title: string
  text?: string
  url?: string
}

/**
 * Share content using Web Share API or fallback to clipboard
 */
export async function shareContent(options: ShareOptions): Promise<void | 'clipboard'> {
  const { title, text, url } = options
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  // Try native share API first (mobile support)
  if (typeof window !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl
      })
      return
    } catch (err) {
      // User cancelled share
      if ((err as Error).name === 'AbortError') {
        console.log('Share canceled by user')
        return
      }
      // Other error, fall through to clipboard
      console.warn('Native share failed, falling back to clipboard:', err)
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl)
    return 'clipboard'
  } catch (err) {
    console.error('Error copying to clipboard:', err)
    throw new Error('Failed to share content')
  }
}

/**
 * Check if Web Share API is available
 */
export function isNativeShareAvailable(): boolean {
  return typeof window !== 'undefined' && 'share' in navigator
}

/**
 * Generate share URL for a product
 */
export function getProductShareUrl(slug: string): string {
  if (typeof window === 'undefined') {
    // Use environment variable for server-side URL generation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    return `${baseUrl}/product/${slug}`;
  }
  return `${window.location.origin}/product/${slug}`;
}

/**
 * Generate share data for a product
 */
export function getProductShareData(product: {
  name: string
  slug: string
  description?: string
  price?: number
  image?: string
}): ShareOptions {
  return {
    title: product.name,
    text: product.description || `Check out ${product.name} - $${product.price?.toFixed(2) || '0.00'}`,
    url: getProductShareUrl(product.slug)
  }
}
