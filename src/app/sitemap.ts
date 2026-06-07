import { MetadataRoute } from 'next'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst } from '@/db/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const env = await getEnv()

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

  // Collection pages (static list)
  const collectionPages = ['saree', 'salwar', 'kurtas', 'gowns', 'lehengas', 'tops', 'menswear', 'accessories']
  const collectionUrls = collectionPages.map((collection) => ({
    url: `${SITE_URL}/collections/${collection}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic product URLs
  let productUrls: MetadataRoute.Sitemap = []
  try {
    const products = await queryAll<{ slug: string; updatedAt: string }>(
      env,
      `SELECT slug, updatedAt FROM products WHERE isActive = 1 ORDER BY updatedAt DESC`
    )

    productUrls = products.map((product) => ({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  // Dynamic category URLs
  let categoryUrls: MetadataRoute.Sitemap = []
  try {
    const categories = await queryAll<{ slug: string; updatedAt: string }>(
      env,
      `SELECT slug, updatedAt FROM categories WHERE isActive = 1 ORDER BY sortOrder ASC, name ASC`
    )

    categoryUrls = categories.map((category) => ({
      url: `${SITE_URL}/categories/${category.slug}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error)
  }

  // Dynamic brand URLs (if brands are public pages)
  let brandUrls: MetadataRoute.Sitemap = []
  try {
    const brands = await queryAll<{ slug: string; updatedAt: string }>(
      env,
      `SELECT slug, updatedAt FROM brands WHERE isActive = 1 ORDER BY sortOrder ASC, name ASC`
    )

    brandUrls = brands.map((brand) => ({
      url: `${SITE_URL}/brands/${brand.slug}`,
      lastModified: brand.updatedAt ? new Date(brand.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error fetching brands for sitemap:', error)
  }

  return [...staticPages, ...collectionUrls, ...productUrls, ...categoryUrls, ...brandUrls]
}