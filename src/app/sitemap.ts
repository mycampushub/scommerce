import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // Product URLs
  const productUrls = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category URLs
  const categoryUrls = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Collection pages (fixed based on the collections folder)
  const collectionPages = ['saree', 'salwar', 'kurtas', 'gowns', 'lehengas', 'tops', 'menswear']
  const collectionUrls = collectionPages.map((collection) => ({
    url: `${SITE_URL}/collections/${collection}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...categoryUrls, ...productUrls, ...collectionUrls]
}
