import { Metadata } from 'next'
import { getPrisma } from '@/db/unified-db'

interface SeoData {
  pageTitle?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  keywords?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  canonicalUrl?: string | null
  robots?: string | null
}

interface DefaultSeo {
  title: string
  description: string
  keywords?: string
  ogImage?: string
}

/**
 * Fetch SEO settings for a specific page path from the database
 */
export async function getPageSeo(pagePath: string): Promise<SeoData | null> {
  try {
    // Skip database queries during build time (when DATABASE_URL is not set)
    if (typeof window !== 'undefined' || process.env.NEXT_PHASE === 'phase-production-build') {
      return null
    }

    const prisma = getPrisma()
    const seo = await prisma.page_seo.findUnique({
      where: { pagePath }
    })

    return seo
  } catch (error) {
    // Silently return null during build - this is expected
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return null
    }
    console.error(`Error fetching SEO for ${pagePath}:`, error)
    return null
  }
}

/**
 * Generate SEO metadata for a page with fallback to default values
 */
export async function generateMetadata(
  pagePath: string,
  defaultSeo: DefaultSeo,
  customSeo?: Partial<SeoData>
): Promise<Metadata> {
  // Fetch SEO from database if not provided
  const dbSeo = !customSeo ? await getPageSeo(pagePath) : null
  const seoData = { ...dbSeo, ...customSeo }

  // Use database values or fall back to provided custom values or defaults
  const title = seoData.metaTitle || defaultSeo.title
  const description = seoData.metaDescription || defaultSeo.description
  const keywords = seoData.keywords || defaultSeo.keywords

  // Open Graph values
  const ogTitle = seoData.ogTitle || title
  const ogDescription = seoData.ogDescription || description
  const ogImage = seoData.ogImage || defaultSeo.ogImage

  // Build metadata object
  const metadata: Metadata = {
    title: title,
    description: description,
    keywords: keywords,
    robots: seoData.robots || 'index, follow',
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
    },
  }

  // Add OG image if available
  if (ogImage) {
    metadata.openGraph!.images = [{ url: ogImage, width: 1200, height: 630 }]
  }

  // Add canonical URL if provided
  if (seoData.canonicalUrl) {
    metadata.alternates = {
      canonical: seoData.canonicalUrl
    }
  }

  return metadata
}

/**
 * Generate SEO metadata for product pages
 */
export async function generateProductMetadata(
  product: {
    name: string
    slug: string
    description?: string | null
    price: number
    comparePrice?: number | null
    images?: string | null
    brandName?: string | null
    categoryName?: string | null
  },
  siteUrl: string = 'https://example.com'
): Promise<Metadata> {
  const pagePath = `/product/${product.slug}`
  const seoData = await getPageSeo(pagePath)

  // Parse product images
  const images = product.images ? JSON.parse(product.images) : []
  const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null

  // Dynamic SEO values
  const title = seoData?.metaTitle || `${product.name} | ${product.brandName || 'Premium'} Collection`
  const description = seoData?.metaDescription || product.description ||
    `Shop ${product.name} at best price. ${product.categoryName ? `Perfect for ${product.categoryName} collection.` : ''} Free shipping on orders above ৳5,000.`

  const priceDisplay = product.comparePrice && product.comparePrice > product.price
    ? `${product.price}৳ (was ${product.comparePrice}৳)`
    : `${product.price}৳`

  // Build keywords dynamically
  const keywords = seoData?.keywords || [
    product.name,
    product.brandName || 'premium',
    product.categoryName || 'fashion',
    'online shopping',
    'best price',
    'free shipping',
    'Bangladesh'
  ].filter(Boolean).join(', ')

  const metadata: Metadata = {
    title: title,
    description: description,
    keywords: keywords,
    robots: seoData?.robots || 'index, follow',
    openGraph: {
      title: seoData?.ogTitle || title,
      description: seoData?.ogDescription || description,
      type: 'website',
      url: `${siteUrl}${pagePath}`,
    },
  }

  // Add OG image
  const ogImage = seoData?.ogImage || firstImage
  if (ogImage) {
    metadata.openGraph!.images = [{ url: ogImage, width: 1200, height: 630 }]
  }

  // Add canonical URL
  metadata.alternates = {
    canonical: seoData?.canonicalUrl || `${siteUrl}${pagePath}`
  }

  return metadata
}

/**
 * Generate SEO metadata for category pages
 */
export async function generateCategoryMetadata(
  category: {
    name: string
    slug: string
    description?: string | null
    image?: string | null
    parentName?: string | null
  },
  siteUrl: string = 'https://example.com',
  productCount?: number
): Promise<Metadata> {
  const pagePath = `/collections/${category.slug}`
  const seoData = await getPageSeo(pagePath)

  // Dynamic SEO values
  const title = seoData?.metaTitle ||
    `${category.name}${category.parentName ? ` - ${category.parentName}` : ''} Collection | Shop Online in Bangladesh`

  const description = seoData?.metaDescription || category.description ||
    `Explore our exclusive ${category.name} collection. ${productCount ? `${productCount}+ products available.` : ''} Latest designs, best prices, and free shipping across Bangladesh.`

  // Build keywords dynamically
  const keywords = seoData?.keywords || [
    category.name,
    category.parentName || 'fashion',
    'collection',
    'online shop',
    'Bangladesh',
    'ethnic wear',
    'traditional',
    'free shipping'
  ].filter(Boolean).join(', ')

  const metadata: Metadata = {
    title: title,
    description: description,
    keywords: keywords,
    robots: seoData?.robots || 'index, follow',
    openGraph: {
      title: seoData?.ogTitle || title,
      description: seoData?.ogDescription || description,
      type: 'website',
      url: `${siteUrl}${pagePath}`,
    },
  }

  // Add OG image
  const ogImage = seoData?.ogImage || category.image
  if (ogImage) {
    metadata.openGraph!.images = [{ url: ogImage, width: 1200, height: 630 }]
  }

  // Add canonical URL
  metadata.alternates = {
    canonical: seoData?.canonicalUrl || `${siteUrl}${pagePath}`
  }

  return metadata
}

/**
 * Get page heading (H1) from SEO settings or default
 */
export function getPageHeading(seoData: SeoData | null, defaultHeading: string): string {
  return seoData?.pageTitle || defaultHeading
}

/**
 * Get SEO metadata for a page path (alias for getPageSeo for backward compatibility)
 */
export async function getSeoMetadata(pagePath: string): Promise<SeoData | null> {
  return getPageSeo(pagePath)
}

/**
 * Convert SeoData to Next.js Metadata object with null handling
 */
export function seoToMetadata(seo: SeoData | null, defaults: {
  title: string
  description: string
}): Metadata {
  return {
    title: seo?.metaTitle || defaults.title,
    description: seo?.metaDescription || defaults.description,
    keywords: seo?.keywords,
    openGraph: {
      title: seo?.ogTitle || seo?.metaTitle || defaults.title,
      description: seo?.ogDescription || seo?.metaDescription || defaults.description,
      images: seo?.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630 }] : undefined,
      type: 'website',
    },
    robots: seo?.robots || 'index, follow',
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
  }
}