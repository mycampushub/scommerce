'use client'

interface ProductStructuredDataProps {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    price: number
    comparePrice?: number | null
    images: string[]
    rating?: number
    reviews?: number
    stock?: number
    category?: string | null
  }
  siteUrl?: string
}

export function ProductStructuredData({ product, siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://scommerce.com' }: ProductStructuredDataProps) {
  if (!product) return null

  const productUrl = `${siteUrl}/product/${product.slug}`
  const mainImage = product.images?.[0] || ''
  const safePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0
  const safeComparePrice = (typeof product.comparePrice === 'number' && !isNaN(product.comparePrice)) ? product.comparePrice : null

  const lowPrice = safeComparePrice ? Math.min(safePrice, safeComparePrice) : safePrice
  const highPrice = safeComparePrice ? Math.max(safePrice, safeComparePrice) : safePrice

  // Ensure prices are valid numbers
  const validLowPrice = typeof lowPrice === 'number' && !isNaN(lowPrice) ? lowPrice : 0
  const validHighPrice = typeof highPrice === 'number' && !isNaN(highPrice) ? highPrice : 0

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: mainImage,
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: process.env.NEXT_PUBLIC_CURRENCY || 'INR',
      price: validLowPrice.toFixed(2),
      availability: (product.stock || 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceValidUntil: undefined, // Can be added if there's an expiration date
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews || 0,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    brand: {
      '@type': 'Brand',
      name: 'Modern E-commerce',
    },
    category: product.category || undefined,
  }

  // Add price range if compare price exists
  if (safeComparePrice && safeComparePrice > safePrice) {
    structuredData.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: process.env.NEXT_PUBLIC_CURRENCY || 'INR',
      lowPrice: parseFloat(validLowPrice.toFixed(2)),
      highPrice: parseFloat(validHighPrice.toFixed(2)),
      offerCount: 1,
      availability: (product.stock || 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: productUrl,
    } as any
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}

interface OrganizationStructuredDataProps {
  siteName?: string
  siteUrl?: string
  logo?: string
  description?: string
}

export function OrganizationStructuredData({
  siteName = 'SCommerce',
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://scommerce.com',
  logo = '/logo.svg',
  description = 'Modern e-commerce platform for fashion and lifestyle products'
}: OrganizationStructuredDataProps) {
  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}${logo}`,
    description: description,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+880XXXXXXXXXX',
      email: 'support@yourdomain.com',
    },
    sameAs: [
      'https://facebook.com/yourbrand',
      'https://twitter.com/yourbrand',
      'https://instagram.com/yourbrand',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(orgData),
      }}
    />
  )
}
