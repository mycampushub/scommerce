import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
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

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv(request)
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

    let categoryObj = null
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

    // Parse images JSON field
    const productsWithImages = products.map((p: any) => ({
      ...p,
      images: parseJSON<string[]>(p.images) || [],
      isActive: numberToBool(p.isActive),
      isFeatured: numberToBool(p.isFeatured),
      hasVariants: numberToBool(p.hasVariants),
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

  try {
    const env = getEnv(request)
    const contentType = request.headers.get('content-type') || ''

    // Handle multipart/form-data for image uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

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

          const uploadResult = await uploadResponse.json()
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
      let category = null
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
    const body = await request.json()

    const product = await ProductRepository.create(env, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      categoryId: body.categoryId || '',
      basePrice: parseFloat(body.price),
      comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : undefined,
      images: Array.isArray(body.images) ? body.images : (body.images ? JSON.parse(body.images) : []),
      stock: parseInt(body.stock),
      lowStockAlert: parseInt(body.lowStockAlert) || 10,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      hasVariants: body.hasVariants ?? false,
    })

    // Fetch category for response
    let category = null
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
