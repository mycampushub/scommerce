import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/db/unified-db'

/**
 * GET /api/seo/product/[slug] - Get dynamic SEO for a product
 * This generates SEO metadata on-the-fly based on product data
 * and overrides with any custom SEO settings from the database
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const pagePath = `/product/${slug}`

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
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
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
      'fashion',
      'ethnic wear',
      'traditional'
    ].filter(Boolean).join(', ')

    // Open Graph values
    const ogTitle = customSeo?.ogTitle || title
    const ogDescription = customSeo?.ogDescription || description
    const ogImage = customSeo?.ogImage || firstImage

    // Price display for OG
    const priceDisplay = product.comparePrice && Number(product.comparePrice) > Number(product.price)
      ? `${product.price}৳ (was ${product.comparePrice}৳)`
      : `${product.price}৳`

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
          type: 'product',
          url: `/product/${slug}`,
          product: {
            availability: Number(product.stock) > 0 ? 'in stock' : 'out of stock',
            condition: 'new',
            price: priceDisplay,
            currency: 'BDT',
          }
        },
        product: {
          name: product.name,
          description: product.description,
          price: product.price,
          comparePrice: product.comparePrice,
          image: firstImage,
          brand: product.brandName,
          category: product.categories.name,
          sku: product.name.toLowerCase().replace(/\s+/g, '-'),
        }
      }
    })
  } catch (error) {
    console.error('Error generating product SEO:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate SEO data' },
      { status: 500 }
    )
  }
}