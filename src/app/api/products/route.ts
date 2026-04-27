import { NextResponse } from 'next/server';
import { searchProductsSchema } from '@/lib/validations';
import { getEnv } from '@/lib/cloudflare';
import { ProductRepository } from '@/db/product.repository';
import { CategoryRepository } from '@/db/category.repository';
import { numberToBool, parseJSON, count } from '@/db/db';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function GET(request: Request) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

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
    let category = null;
    if (categorySlug) {
      category = await CategoryRepository.findBySlug(env, categorySlug);
      if (category) {
        conditions.push('categoryId = ?');
        params.push(category.id);
      } else {
        // Category not found, return empty results
        return NextResponse.json({
          products: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
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
      'products',
      whereClause,
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

    // Transform products to match expected frontend format
    const transformedProducts = products.map((product: any) => {
      const images = parseJSON<string[]>(product.images) || [];
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

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.basePrice,
        originalPrice: product.comparePrice || undefined,
        image: images[0] || category?.image || '',
        images: images,
        rating: 4.5, // Default rating - in production, this would come from reviews
        reviews: Math.floor(Math.random() * 500) + 10, // Random review count - in production, this would be real
        badge,
        category: category?.name,
        categorySlug: category?.slug,
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
      products: transformedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });

    // Add caching headers for products
    return addCacheHeaders(response, CachePresets.STATIC);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
