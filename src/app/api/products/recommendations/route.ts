import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, queryAll } from '@/db/db'
import { parseJSON } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = getEnv(request)
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '8')
    const type = searchParams.get('type') || 'mixed' // 'category', 'popular', 'mixed'

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    let recommendedProducts: any[] = []

    // Get current product to determine category
    const currentProduct = await queryFirst(
      env,
      'SELECT categoryId, basePrice, price, hasVariants FROM products WHERE id = ? LIMIT 1',
      productId
    )

    const targetCategoryId = categoryId || currentProduct?.categoryId

    // Get product ratings and reviews count from ProductReview table
    const allReviews = await queryAll(
      env,
      'SELECT productId, AVG(rating) as rating, COUNT(rating) as reviews FROM product_reviews WHERE isApproved = 1 GROUP BY productId'
    )

    // Create a map for quick lookup
    const reviewsMap = new Map(
      allReviews.map((review: any) => [
        review.productId,
        {
          rating: review.rating || 0,
          reviews: review.reviews || 0,
        },
      ])
    )

    // Helper function to get product rating and reviews count
    const getProductRating = (productId: string) => {
      return reviewsMap.get(productId) || { rating: 0, reviews: 0 }
    }

    // Strategy 1: Category-based recommendations
    if (type === 'category' || type === 'mixed') {
      const categoryProducts = await queryAll(
        env,
        `SELECT p.id, p.name, p.slug, p.price, p.basePrice, p.comparePrice, p.images, p.stock, p.categoryId, c.name as categoryName, c.slug as categorySlug
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id != ? AND p.categoryId = ? AND p.isActive = 1 AND p.hasVariants = ?
         ORDER BY p.createdAt DESC
         LIMIT ?`,
        productId,
        targetCategoryId || '',
        currentProduct?.hasVariants || 0,
        Math.ceil(limit / 2)
      )
      recommendedProducts.push(...categoryProducts)
    }

    // Strategy 2: Price-based recommendations (similar price range)
    if (type === 'popular' || type === 'mixed') {
      const priceRange = currentProduct?.price || currentProduct?.basePrice || 0
      const minPrice = priceRange * 0.5
      const maxPrice = priceRange * 1.5

      const priceSimilarProducts = await queryAll(
        env,
        `SELECT p.id, p.name, p.slug, p.price, p.basePrice, p.comparePrice, p.images, p.stock, p.categoryId, c.name as categoryName, c.slug as categorySlug
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id != ? AND p.isActive = 1 AND (p.basePrice >= ? AND p.basePrice <= ? OR p.price >= ? AND p.price <= ?)
         ORDER BY p.createdAt DESC
         LIMIT ?`,
        productId,
        minPrice,
        maxPrice,
        minPrice,
        maxPrice,
        Math.ceil(limit / 2)
      )
      recommendedProducts.push(...priceSimilarProducts)
    }

    // Strategy 3: Popular/Best-selling products (high rating + more reviews)
    if (type === 'popular' || type === 'mixed') {
      const popularProducts = await queryAll(
        env,
        `SELECT p.id, p.name, p.slug, p.price, p.basePrice, p.comparePrice, p.images, p.stock, p.categoryId, c.name as categoryName, c.slug as categorySlug
         FROM products p
         LEFT JOIN categories c ON p.categoryId = c.id
         WHERE p.id != ? AND p.isActive = 1
         ORDER BY p.createdAt DESC
         LIMIT ?`,
        productId,
        Math.ceil(limit / 2)
      )
      recommendedProducts.push(...popularProducts)
    }

    // Remove duplicates and limit results
    const uniqueProducts = Array.from(
      new Map(
        recommendedProducts.map((product) => [product.id, product])
      ).values()
    )

    // Calculate recommendation score and sort
    const scoredProducts = uniqueProducts.map((product) => {
      const { rating, reviews } = getProductRating(product.id)
      let score = 0

      // Category match bonus
      if (product.categoryId === targetCategoryId) {
        score += 10
      }

      // Rating bonus
      score += rating * 2

      // Reviews bonus (social proof)
      score += Math.min(reviews / 10, 10)

      // Price similarity bonus
      const productPrice = product.basePrice || product.price
      const currentPrice = currentProduct?.price || currentProduct?.basePrice || 0
      const priceDiff = Math.abs(productPrice - currentPrice)
      const priceRatio = currentPrice > 0 ? priceDiff / currentPrice : 1
      if (priceRatio < 0.3) {
        score += 5
      }

      return {
        ...product,
        rating,
        reviews,
        recommendationScore: score,
      }
    })

    // Sort by recommendation score and limit
    scoredProducts.sort((a, b) => b.recommendationScore - a.recommendationScore)
    const finalProducts = scoredProducts.slice(0, limit)

    // Format product data
    const formattedProducts = finalProducts.map((product: any) => {
      const images = product.images ? parseJSON<string[]>(product.images) : []
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice || product.price,
        comparePrice: product.comparePrice,
        image: images[0] || '',
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        stock: product.stock || 0,
        categoryId: product.categoryId,
        category: product.categoryName || null,
        categorySlug: product.categorySlug || null,
        recommendationScore: product.recommendationScore,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts,
        count: formattedProducts.length,
        type,
      },
    })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
