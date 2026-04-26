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

export function ProductStructuredData({ product, siteUrl = 'https://yourdomain.com' }: ProductStructuredDataProps) {
  if (!product) return null

  const productUrl = `${siteUrl}/product/${product.slug}`
  const mainImage = product.images?.[0] || ''
  const lowPrice = product.comparePrice ? Math.min(product.price, product.comparePrice) : product.price
  const highPrice = product.comparePrice ? Math.max(product.price, product.comparePrice) : product.price

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
      priceCurrency: 'BDT',
      price: lowPrice.toFixed(2),
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
  if (product.comparePrice && product.comparePrice > product.price) {
    structuredData.offers = {
      '@type': 'AggregateOffer',
      lowPrice: {
        '@type': 'Offer',
        priceCurrency: 'BDT',
        price: lowPrice.toFixed(2),
        availability: (product.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
      highPrice: {
        '@type': 'Offer',
        priceCurrency: 'BDT',
        price: highPrice.toFixed(2),
        availability: (product.stock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    }
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
  siteName = 'Modern E-commerce',
  siteUrl = 'https://yourdomain.com',
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
