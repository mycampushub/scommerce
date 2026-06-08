import { Metadata } from 'next'
import { getPrisma } from '@/db/unified-db'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

/**
 * Layout for product pages that generates dynamic SEO metadata
 * This is a server component that can export metadata
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pagePath = `/product/${slug}`

  try {
    // Fetch product data
    const prisma = getPrisma()

    // Get product by slug
    const product = await prisma.products.findUnique({
      where: { slug },
      include: {
        categories: true,
      }
    })

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The product you are looking for does not exist.',
      }
    }

    // Check if there's custom SEO for this page
    const customSeo = await prisma.page_seo.findUnique({
      where: { pagePath }
    })

    // Parse product images
    const images = product.images ? JSON.parse(product.images) : []
    const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null

    // Generate dynamic SEO values
    const title = customSeo?.metaTitle ||
      `${product.name}${product.brandName ? ` by ${product.brandName}` : ''} | Shop Online in Bangladesh`

    const description = customSeo?.metaDescription || product.description ||
      `Buy ${product.name} online at best price in Bangladesh. ` +
      `${product.brandName ? `Premium ${product.brandName} collection. ` : ''}` +
      `${product.categories.name ? `Part of our ${product.categories.name} collection. ` : ''}` +
      `Free shipping on orders above ৳5,000. Easy returns and secure payment.`

    // Build keywords dynamically
    const keywords = customSeo?.keywords || [
      product.name,
      product.brandName,
      product.categories.name,
      'online shopping',
      'Bangladesh',
      'buy online',
      'best price',
      'free shipping',
      'beauty products',
      'skincare',
      'hair care',
      'body care',
      'baby care'
    ].filter(Boolean).join(', ')

    // Price display for OG
    const priceValue = Number(product.basePrice || product.price)
    const comparePriceValue = product.comparePrice ? Number(product.comparePrice) : 0
    const priceDisplay = comparePriceValue > priceValue
      ? `${priceValue}৳ (was ${comparePriceValue}৳)`
      : `${priceValue}৳`

    // Open Graph values
    const ogTitle = customSeo?.ogTitle || title
    const ogDescription = customSeo?.ogDescription || description
    const ogImage = customSeo?.ogImage || firstImage

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: product.name }] : [],
        type: 'website',
        url: `/product/${slug}`,
        siteName: 'Beauty & Personal Care',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [ogImage] : [],
      },
      robots: customSeo?.robots || 'index, follow',
      alternates: {
        canonical: customSeo?.canonicalUrl || `/product/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating product metadata:', error)
    return {
      title: 'Product | Beauty & Personal Care',
      description: 'Shop premium beauty and personal care products online in Bangladesh.',
    }
  }
}

export default function ProductLayout({ children }: Props) {
  return children
}