import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/db/unified-db'

/**
 * GET /api/seo/category/[slug] - Get dynamic SEO for a category/collection
 * This generates SEO metadata on-the-fly based on category data
 * and overrides with any custom SEO settings from the database
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const pagePath = `/collections/${slug}`

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
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if there's custom SEO for this page
    const customSeo = await prisma.page_seo.findUnique({
      where: { pagePath }
    })

    const productCount = category._count.products || 0

    // Generate dynamic SEO values
    const title = customSeo?.metaTitle ||
      `${category.name}${category.parent ? ` - ${category.parent.name}` : ''} Collection | Shop Online in Bangladesh`

    const description = customSeo?.metaDescription || category.description ||
      `Explore our exclusive ${category.name} collection. ` +
      `${productCount > 0 ? `${productCount}+ products available.` : 'Latest designs and styles available.'} ` +
      `Best prices, premium quality, and free shipping across Bangladesh.`

    // Build keywords dynamically
    const keywords = customSeo?.keywords || [
      category.name,
      category.parent?.name,
      'collection',
      'online shop',
      'Bangladesh',
      'fashion',
      'ethnic wear',
      'traditional',
      'designer',
      'buy online',
      'best price',
      'free shipping'
    ].filter(Boolean).join(', ')

    // Open Graph values
    const ogTitle = customSeo?.ogTitle || title
    const ogDescription = customSeo?.ogDescription || description
    const ogImage = customSeo?.ogImage || category.image

    // Return SEO data
    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
        keywords,
        ogTitle,
        ogDescription,
        ogImage,
        canonicalUrl: customSeo?.canonicalUrl,
        robots: customSeo?.robots || 'index, follow',
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          image: ogImage,
          type: 'website',
          url: `/collections/${slug}`,
        },
        category: {
          name: category.name,
          description: category.description,
          image: category.image,
          productCount,
          parent: category.parent?.name,
        }
      }
    })
  } catch (error) {
    console.error('Error generating category SEO:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate SEO data' },
      { status: 500 }
    )
  }
}