import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Get the current product to determine category
    const currentProduct = await db.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, basePrice: true, price: true, hasVariants: true },
    })

    const targetCategoryId = categoryId || currentProduct?.categoryId

    // Get product ratings and reviews count from ProductReview table
    const allReviews = await db.productReview.groupBy({
      by: ['productId'],
      where: { isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    })

    // Create a map for quick lookup
    const reviewsMap = new Map(
      allReviews.map((review) => [
        review.productId,
        {
          rating: review._avg.rating || 0,
          reviews: review._count.rating || 0,
        },
      ])
    )

    // Helper function to get product rating and reviews count
    const getProductRating = (productId: string) => {
      return reviewsMap.get(productId) || { rating: 0, reviews: 0 }
    }

    // Strategy 1: Category-based recommendations
    if (type === 'category' || type === 'mixed') {
      const categoryProducts = await db.product.findMany({
        where: {
          id: { not: productId },
          categoryId: targetCategoryId || undefined,
          isActive: true,
          hasVariants: currentProduct?.hasVariants || false,
        },
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          basePrice: true,
          comparePrice: true,
          images: true,
          stock: true,
          categoryId: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      })
      recommendedProducts.push(...categoryProducts)
    }

    // Strategy 2: Price-based recommendations (similar price range)
    if (type === 'popular' || type === 'mixed') {
      const priceRange = currentProduct?.price || currentProduct?.basePrice || 0
      const minPrice = priceRange * 0.5
      const maxPrice = priceRange * 1.5

      const priceSimilarProducts = await db.product.findMany({
        where: {
          id: { not: productId },
          isActive: true,
          OR: [
            {
              basePrice: {
                gte: minPrice,
                lte: maxPrice,
              },
            },
            {
              price: {
                gte: minPrice,
                lte: maxPrice,
              },
            },
          ],
        },
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          basePrice: true,
          comparePrice: true,
          images: true,
          stock: true,
          categoryId: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      })
      recommendedProducts.push(...priceSimilarProducts)
    }

    // Strategy 3: Popular/Best-selling products (high rating + more reviews)
    if (type === 'popular' || type === 'mixed') {
      const popularProducts = await db.product.findMany({
        where: {
          id: { not: productId },
          isActive: true,
        },
        take: Math.ceil(limit / 2),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          basePrice: true,
          comparePrice: true,
          images: true,
          stock: true,
          categoryId: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      })
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
    const formattedProducts = finalProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.basePrice || product.price,
      comparePrice: product.comparePrice,
      image: product.images ? JSON.parse(product.images)[0] : '',
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      stock: product.stock || 0,
      categoryId: product.categoryId,
      category: product.category?.name || null,
      categorySlug: product.category?.slug || null,
      recommendationScore: product.recommendationScore,
    }))

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
