import { Metadata } from 'next'
import { getPrisma } from '@/db/unified-db'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

/**
 * Layout for collection pages that generates dynamic SEO metadata
 * This is a server component that can export metadata
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pagePath = `/collections/${slug}`

  try {
    // Fetch category data
    const prisma = getPrisma()

    // Get category by slug
    const category = await prisma.categories.findUnique({
      where: { slug },
      include: {
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      return {
        title: 'Collection Not Found',
        description: 'The collection you are looking for does not exist.',
        robots: 'noindex, nofollow',
      }
    }

    // Check if there's custom SEO for this page
    const customSeo = await prisma.page_seo.findUnique({
      where: { pagePath }
    })

    const productCount = category._count.products || 0

    // Generate dynamic SEO values
    const title = customSeo?.metaTitle ||
      `${category.name}${category.parent ? ` - ${category.parent.name}` : ''} Collection | Beauty & Personal Care Bangladesh`

    const description = customSeo?.metaDescription || category.description ||
      `Explore our exclusive ${category.name} collection. ` +
      `${productCount > 0 ? `${productCount}+ premium ${category.name.toLowerCase()} products available.` : 'Latest products available.'} ` +
      `Best prices, premium quality from trusted brands like Aveeno and CeraVe. ` +
      `Free shipping across Bangladesh on orders above ৳5,000.`

    // Build keywords dynamically
    const keywords = customSeo?.keywords || [
      category.name,
      category.parent?.name,
      'collection',
      'online shop',
      'Bangladesh',
      'beauty products',
      'skincare',
      'hair care',
      'body care',
      'baby care',
      'Aveeno',
      'CeraVe',
      'buy online',
      'best price',
      'free shipping',
      'original products'
    ].filter(Boolean).join(', ')

    // Open Graph values
    const ogTitle = customSeo?.ogTitle || title
    const ogDescription = customSeo?.ogDescription || description
    const ogImage = customSeo?.ogImage || category.image

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: `${category.name} Collection` }] : [],
        type: 'website',
        url: `/collections/${slug}`,
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
        canonical: customSeo?.canonicalUrl || `/collections/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating collection metadata:', error)
    return {
      title: 'Collection | Beauty & Personal Care',
      description: 'Shop premium beauty and personal care collections online in Bangladesh.',
    }
  }
}

export default function CollectionLayout({ children }: Props) {
  return children
}