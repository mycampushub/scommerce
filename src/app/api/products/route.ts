import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { searchProductsSchema } from '@/lib/validations'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryParams: any = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === 'page' || key === 'limit' || key === 'minPrice' || key === 'maxPrice') {
        queryParams[key] = value ? parseInt(value) : undefined
      } else if (key === 'sortBy' || key === 'sortOrder') {
        queryParams[key] = value
      } else {
        queryParams[key] = value
      }
    }

    // Validate using Zod schema
    const validation = searchProductsSchema.safeParse(queryParams)
    const validatedParams = validation.success ? validation.data : queryParams

    const page = validatedParams.page || 1
    const limit = validatedParams.limit || 12
    const skip = (page - 1) * limit

    const type = searchParams.get('type') || 'all'
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = validatedParams.sortBy || 'createdAt'
    const sortOrder = validatedParams.sortOrder || 'desc'
    const minPrice = validatedParams.minPrice
    const maxPrice = validatedParams.maxPrice

    // Build where clause
    const where: any = {
      isActive: true,
    }

    // Filter by type
    if (type === 'featured') {
      where.isFeatured = true
    } else if (type === 'sale') {
      where.discount = { gt: 0 }
    } else if (type === 'trending') {
      where.isFeatured = true
    } else if (type === 'new') {
      // Newest products by createdAt
    }

    // Filter by category
    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      }
    }

    // Search by name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) {
        where.price.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice
      }
    }

    // Get total count for pagination
    const totalCount = await db.product.count({ where })

    // Fetch products from database with pagination
    const products = await db.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Transform products to match expected frontend format
    const transformedProducts = products.map(product => {
      const images = product.images ? JSON.parse(product.images) : []
      let attributes: any = {}

      // If product has variants, include that information
      if (product.hasVariants) {
        attributes.hasVariants = true
      }

      // Calculate badge based on discount
      let badge: string | undefined
      if (product.discount && product.discount > 0) {
        badge = 'Sale'
      } else if (product.isFeatured) {
        badge = 'New'
      }

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.basePrice || product.price,
        originalPrice: product.comparePrice || undefined,
        image: images[0] || product.category?.image || '',
        images: images,
        rating: 4.5, // Default rating - in production, this would come from reviews
        reviews: Math.floor(Math.random() * 500) + 10, // Random review count - in production, this would be real
        badge,
        category: product.category?.name,
        categorySlug: product.category?.slug,
        categoryId: product.categoryId,
        stock: product.stock,
        hasVariants: product.hasVariants,
        basePrice: product.basePrice || product.price,
        attributes,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        lowStockAlert: product.lowStockAlert,
      }
    })

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
