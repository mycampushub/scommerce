import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with their priorities and change frequencies
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
  ]

  // Collection pages (fixed based on collections folder)
  const collectionPages = ['saree', 'salwar', 'kurtas', 'gowns', 'lehengas', 'tops', 'menswear']
  const collectionUrls = collectionPages.map((collection) => ({
    url: `${SITE_URL}/collections/${collection}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Only fetch from database if DATABASE_URL is available
  // This allows graceful degradation during static build when database is not available
  let productUrls: MetadataRoute.Sitemap = []
  let categoryUrls: MetadataRoute.Sitemap = []

  if (process.env.DATABASE_URL) {
    try {
      // Dynamic import to avoid build-time errors
      const { db } = await import('@/lib/db')

      // Get all active products
      const products = await db.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
        },
      })

      // Get all active categories
      const categories = await db.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          updatedAt: true,
        },
      })

      // Product URLs
      productUrls = products.map((product) => ({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      // Category URLs
      categoryUrls = categories.map((category) => ({
        url: `${SITE_URL}/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    } catch (error) {
      console.error('Error fetching data for sitemap:', error)
      // If database fails, continue with static pages only
    }
  }

  return [...staticPages, ...categoryUrls, ...productUrls, ...collectionUrls]
}
