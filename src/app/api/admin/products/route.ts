import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { productSchema } from '@/lib/validations'
import {
  queryAll,
  count,
  boolToNumber,
  numberToBool,
  generateId,
  now,
  parseJSON,
  stringifyJSON
} from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'
import { generateUniqueSlug, isValidSlug } from '@/lib/slug'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv(request)

    // Debug: Log binding status
    console.log('[Products GET] Environment:', {
      hasDB: !!env?.DB,
      hasKV: !!env?.KV,
      hasBUCKET: !!env?.BUCKET,
      nodeEnv: process.env.NODE_ENV
    })

    if (!env?.DB) {
      console.error('[Products GET] Database binding not available!')
      return NextResponse.json(
        {
          success: false,
          error: 'Database binding not available',
          debug: { hasDB: false, env: !!env }
        },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const categorySlug = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build WHERE clause dynamically
    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      conditions.push('(p.name LIKE ? OR p.slug LIKE ?)')
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`)
    }

    let categoryObj: any = null
    if (categorySlug) {
      categoryObj = await CategoryRepository.findBySlug(env, categorySlug)
      if (categoryObj) {
        conditions.push('p.categoryId = ?')
        params.push(categoryObj.id)
      }
    }

    if (status === 'active') {
      conditions.push('p.isActive = 1')
    } else if (status === 'inactive') {
      conditions.push('p.isActive = 0')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get products with category
    const products = await queryAll<any>(
      env,
      `SELECT p.*, c.name as categoryName, c.slug as categorySlug
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       ${whereClause}
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    // Parse images JSON field and alias basePrice to price for frontend compatibility
    const productsWithImages = products.map((p: any) => ({
      ...p,
      images: parseJSON<string[]>(p.images) || [],
      isActive: numberToBool(p.isActive),
      isFeatured: numberToBool(p.isFeatured),
      hasVariants: numberToBool(p.hasVariants),
      // Alias basePrice to price for frontend compatibility
      price: p.basePrice || 0,
      // Alias price field if it exists (for compatibility)
      comparePrice: p.comparePrice || null,
    }))

    // Get total count for pagination
    const totalCount = await count(
      env,
      'products p LEFT JOIN categories c ON p.categoryId = c.id',
      whereClause,
      ...params
    )
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: productsWithImages,
      total: productsWithImages.length,
      totalCount,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Check CSRF protection
  const env = getEnv(request)
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle multipart/form-data for image uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Validate required fields manually for multipart
      const name = formData.get('name') as string
      const slug = formData.get('slug') as string
      const description = formData.get('description') as string | null
      const basePrice = formData.get('price') as string
      const comparePrice = formData.get('comparePrice') as string | null
      const categoryId = formData.get('categoryId') as string | null
      const stock = formData.get('stock') as string
      const lowStockAlert = formData.get('lowStockAlert') as string | null
      const isActive = formData.get('isActive') === 'true'
      const isFeatured = formData.get('isFeatured') === 'true'

      // Manual validation for multipart
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product name is required' },
          { status: 400 }
        )
      }
      if (!slug || slug.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product slug is required' },
          { status: 400 }
        )
      }
      if (!description || description.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Description is required' },
          { status: 400 }
        )
      }
      const price = parseFloat(basePrice)
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { success: false, error: 'Price must be a positive number' },
          { status: 400 }
        )
      }
      if (!categoryId) {
        return NextResponse.json(
          { success: false, error: 'Category ID is required' },
          { status: 400 }
        )
      }
      const stockNum = parseInt(stock)
      if (isNaN(stockNum) || stockNum < 0) {
        return NextResponse.json(
          { success: false, error: 'Stock must be a non-negative integer' },
          { status: 400 }
        )
      }

      // Validate slug format
      if (!isValidSlug(slug)) {
        return NextResponse.json(
          { success: false, error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
          { status: 400 }
        )
      }

      // Check for unique slug
      const existingProduct = await ProductRepository.findBySlug(env, slug)
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'A product with this URL slug already exists. Please use a different name or slug.' },
          { status: 409 }
        )
      }

      // Handle image uploads
      const imagesJson = formData.get('images') as string | null
      let images: string[] = []
      if (imagesJson) {
        try {
          images = JSON.parse(imagesJson)
        } catch (e) {
          console.error('Failed to parse images JSON:', e)
        }
      }

      // Handle file uploads
      const files = formData.getAll('files') as File[]
      for (const file of files) {
        if (file && file.size > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload`, {
            method: 'POST',
            body: uploadFormData,
          })

          const uploadResult = await uploadResponse.json() as any
          if (uploadResult.success) {
            images.push(uploadResult.data.url)
          }
        }
      }

      const product = await ProductRepository.create(env, {
        name,
        slug,
        description: description || undefined,
        categoryId: categoryId || '',
        basePrice: parseFloat(basePrice),
        comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
        images,
        stock: parseInt(stock),
        lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : undefined,
        isActive,
        isFeatured,
      })

      // Fetch category for response
      let category: any = null
      if (product.categoryId) {
        category = await CategoryRepository.findById(env, product.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...product,
          category,
        },
      })
    }

    // Handle JSON payload
    const body = await request.json() as any

    // Validate with Zod
    const validation = productSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Validate slug format
    if (!isValidSlug(validatedData.slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      )
    }

    // Check for unique slug
    const existingProduct = await ProductRepository.findBySlug(env, validatedData.slug)
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'A product with this URL slug already exists. Please use a different name or slug.' },
        { status: 409 }
      )
    }

    const product = await ProductRepository.create(env, {
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      basePrice: validatedData.price,
      comparePrice: validatedData.comparePrice,
      images: validatedData.images,
      stock: validatedData.stock,
      lowStockAlert: validatedData.lowStockAlert,
      isActive: validatedData.isActive ?? true,
      isFeatured: validatedData.isFeatured ?? false,
      hasVariants: body.hasVariants ?? false,
    })

    // Fetch category for response
    let category: any = null
    if (product.categoryId) {
      category = await CategoryRepository.findById(env, product.categoryId)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        category,
      },
    })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
      },
      { status: 500 }
    )
  }
}
