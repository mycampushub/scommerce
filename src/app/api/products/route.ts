import { NextResponse } from 'next/server';
import { searchProductsSchema } from '@/lib/validations';
import { getEnv } from '@/lib/cloudflare';
import { ProductRepository } from '@/db/product.repository';
import { CategoryRepository } from '@/db/category.repository';
import { numberToBool, parseJSON, count } from '@/db/db';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import { errorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv();
  
  console.log('[products API] Environment check:', {
    hasEnv: !!env,
    hasDB: !!env?.DB,
    hasKV: !!env?.KV,
    hasBUCKET: !!env?.BUCKET,
    url: request.url
  });

  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams: any = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === 'page' || key === 'limit' || key === 'minPrice' || key === 'maxPrice') {
        queryParams[key] = value ? parseInt(value) : undefined;
      } else if (key === 'sortBy' || key === 'sortOrder') {
        queryParams[key] = value;
      } else {
        queryParams[key] = value;
      }
    }

    // Validate using Zod schema
    const validation = searchProductsSchema.safeParse(queryParams);
    const validatedParams = validation.success ? validation.data : queryParams;

    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 12;
    const offset = (page - 1) * limit;

    const type = searchParams.get('type') || 'all';
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = validatedParams.sortBy || 'createdAt';
    const sortOrder = validatedParams.sortOrder || 'desc';
    const minPrice = validatedParams.minPrice;
    const maxPrice = validatedParams.maxPrice;

    // Build WHERE clause conditions
    const conditions: string[] = ['isActive = 1'];
    const params: unknown[] = [];

    // Filter by type
    if (type === 'featured') {
      conditions.push('isFeatured = 1');
    } else if (type === 'sale') {
      conditions.push('(discount IS NOT NULL AND discount > 0)');
    } else if (type === 'trending') {
      conditions.push('isFeatured = 1');
    }
    // 'new' doesn't need a condition - we'll sort by createdAt desc

    // Filter by category
    let category: any = null;
    if (categorySlug) {
      category = await CategoryRepository.findBySlug(env, categorySlug);
      if (category) {
        conditions.push('categoryId = ?');
        params.push(category.id);
      } else {
        // Category not found, return empty results with standard format
        return NextResponse.json({
          success: true,
          data: {
            products: [],
            pagination: {
              page,
              limit,
              totalCount: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        });
      }
    }

    // Search by name
    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (minPrice !== undefined && maxPrice !== undefined) {
        conditions.push('basePrice >= ? AND basePrice <= ?');
        params.push(minPrice, maxPrice);
      } else if (minPrice !== undefined) {
        conditions.push('basePrice >= ?');
        params.push(minPrice);
      } else if (maxPrice !== undefined) {
        conditions.push('basePrice <= ?');
        params.push(maxPrice);
      }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count for pagination
    const totalCount = await count(
      env,
      `SELECT COUNT(*) as count FROM products ${whereClause}`,
      ...params
    );

    // Build ORDER BY clause
    const validSortColumns = ['createdAt', 'name', 'basePrice', 'comparePrice'];
    const validSortOrders = ['asc', 'desc'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';
    const orderByClause = `ORDER BY ${sortColumn} ${sortDirection.toUpperCase()}`;

    // Fetch products from database with pagination
    const { queryAll } = await import('@/db/db');
    const products = await queryAll(
      env,
      `SELECT * FROM products ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    );

    // Batch fetch rating data for all products to avoid N+1 queries
    const productIds = products.map((p: any) => p.id);
    const categoryIds = [...new Set(products.map((p: any) => p.categoryId))];

    let ratingsMap = new Map<string, { avgRating: number, totalReviews: number }>();
    let categoriesMap = new Map<string, { name: string, slug: string, image?: string }>();

    // Batch fetch categories
    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      const categoriesData = await queryAll<{ id: string, name: string, slug: string, image?: string }>(
        env,
        `SELECT id, name, slug, image FROM categories WHERE id IN (${placeholders}) AND isActive = 1`,
        ...categoryIds
      );
      categoriesData.forEach(c => categoriesMap.set(c.id, {
        name: c.name,
        slug: c.slug,
        image: c.image
      }));
    }

    // Batch fetch ratings
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const ratings = await queryAll<{ productId: string, avgRating: number, totalReviews: number }>(
        env,
        `SELECT productId, AVG(rating) as avgRating, COUNT(*) as totalReviews
         FROM product_reviews
         WHERE productId IN (${placeholders}) AND isApproved = 1
         GROUP BY productId`,
        ...productIds
      );
      ratings.forEach(r => ratingsMap.set(r.productId, {
        avgRating: r.avgRating || 0,
        totalReviews: r.totalReviews || 0
      }));
    }

    // Transform products to match expected frontend format
    const transformedProducts = products.map((product: any) => {
      const images = parseJSON<string[]>(product.images) || [];
      const productCategory = categoriesMap.get(product.categoryId);
      let attributes: any = {};

      // If product has variants, include that information
      if (numberToBool(product.hasVariants)) {
        attributes.hasVariants = true;
      }

      // Calculate badge based on discount
      let badge: string | undefined;
      if (product.discount && product.discount > 0) {
        badge = 'Sale';
      } else if (numberToBool(product.isFeatured)) {
        badge = 'New';
      }

      // Get real rating data from batch-fetched ratings
      const ratingData = ratingsMap.get(product.id) || { avgRating: null, totalReviews: 0 };

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.basePrice,
        originalPrice: product.comparePrice || undefined,
        image: images[0] || productCategory?.image || '',
        images: images,
        rating: ratingData.avgRating,
        reviews: ratingData.totalReviews,
        badge,
        category: productCategory?.name,
        categorySlug: productCategory?.slug,
        categoryId: product.categoryId,
        stock: product.stock,
        hasVariants: numberToBool(product.hasVariants),
        basePrice: product.basePrice,
        attributes,
        isFeatured: numberToBool(product.isFeatured),
        isActive: numberToBool(product.isActive),
        lowStockAlert: product.lowStockAlert,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });

    // Add caching headers for products (semi-static - 10 minutes)
    return addCacheHeaders(response, CachePresets.SEMI_STATIC);
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}
