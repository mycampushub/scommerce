import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv, getEnvVar } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { productSchema } from '@/lib/validations'
import {
  queryAll,
  queryFirst,
  count,
  boolToNumber,
  numberToBool,
  generateId,
  now,
  parseJSON,
  stringifyJSON
} from '@/db/db'
import { generateUniqueSlug, isValidSlug, createSlug } from '@/lib/slug'
import { logAdminAction } from '@/lib/audit-logger'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { checkEnv } from '@/lib/api-helpers'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()

    // Check if database is available
    const envCheck = checkEnv(env)
    if (envCheck) {
      return envCheck
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
      ...(params || []),
      limit,
      offset
    )

    // Parse images JSON field and calculate stock for variant products
    const productsWithImages = await Promise.all(products.map(async (p: any) => {
      let calculatedStock = p.stock

      // For products with variants, calculate total stock from variants
      if (numberToBool(p.hasVariants)) {
        const variants = await queryAll<any>(
          env,
          'SELECT stock FROM product_variants WHERE productId = ? AND isActive = 1',
          p.id
        )
        // Sum up all variant stocks
        calculatedStock = variants.reduce((total: number, v: any) => total + (v.stock || 0), 0)
      }

      return {
        ...p,
        stock: calculatedStock,
        images: parseJSON<string[]>(p.images) || [],
        isActive: numberToBool(p.isActive),
        isFeatured: numberToBool(p.isFeatured),
        hasVariants: numberToBool(p.hasVariants),
      }
    }))

    // Get total count for pagination
    const countWhereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const countSql = `SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.categoryId = c.id ${countWhereClause}`
    const countResult = await queryFirst<{ count: number }>(env, countSql, ...params)
    const totalCount = Number(countResult?.count || 0)
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      products: productsWithImages,
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

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  // Get environment and check availability
  const env = await getEnv()

  // Check if database is available
  const envCheck = checkEnv(env)
  if (envCheck) {
    return envCheck
  }

  // Rate limiting: 30 products per minute per admin
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-product-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle multipart/form-data for image uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      console.log('[Products API] Creating product from multipart form data')

      // Extract form fields for validation
      const name = formData.get('name') as string
      const slug = formData.get('slug') as string
      const description = formData.get('description') as string | null
      const basePrice = formData.get('basePrice') as string
      const comparePrice = formData.get('comparePrice') as string | null
      const costPrice = formData.get('costPrice') as string | null
      const categoryId = formData.get('categoryId') as string
      const stock = formData.get('stock') as string
      const lowStockAlert = formData.get('lowStockAlert') as string | null
      const reorderLevel = formData.get('reorderLevel') as string | null
      const reorderQty = formData.get('reorderQty') as string | null
      const isActive = formData.get('isActive') === 'true'
      const isFeatured = formData.get('isFeatured') === 'true'
      const hasVariants = formData.get('hasVariants') === 'true'
      const brandId = formData.get('brandId') as string | null
      const brandName = formData.get('brandName') as string | null
      const brandLogo = formData.get('brandLogo') as string | null
      const sizeType = formData.get('sizeType') as 'unit' | 'label' | null
      const sizeValue = formData.get('sizeValue') as string | null
      const sizeUnit = formData.get('sizeUnit') as string | null
      const sizeLabel = formData.get('sizeLabel') as string | null
      const material = formData.get('material') as string | null
      const color = formData.get('color') as string | null
      const countryOfOrigin = formData.get('countryOfOrigin') as string | null
      const availableSizesStr = formData.get('availableSizes') as string | null
      const availableColorsStr = formData.get('availableColors') as string | null

      // Parse array fields
      let availableSizes: string[] | null = null
      let availableColors: string[] | null = null
      if (availableSizesStr) {
        try {
          availableSizes = JSON.parse(availableSizesStr)
        } catch (e) {
          console.error('[Products API] Failed to parse availableSizes:', e)
        }
      }
      if (availableColorsStr) {
        try {
          availableColors = JSON.parse(availableColorsStr)
        } catch (e) {
          console.error('[Products API] Failed to parse availableColors:', e)
        }
      }

      // Build data object for validation (mimicking the JSON structure)
      const productData: any = {
        name,
        slug: slug || undefined,
        description: description || undefined,
        basePrice: parseFloat(basePrice),
        comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
        costPrice: costPrice ? parseFloat(costPrice) : undefined,
        categoryId,
        stock: parseInt(stock),
        lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : undefined,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : undefined,
        reorderQty: reorderQty ? parseInt(reorderQty) : undefined,
        isActive,
        isFeatured,
        hasVariants,
        brandId: brandId || undefined,
        brandName: brandName || undefined,
        brandLogo: brandLogo || undefined,
        sizeType: sizeType || undefined,
        sizeValue: sizeValue ? parseFloat(sizeValue) : undefined,
        sizeUnit: sizeUnit || undefined,
        sizeLabel: sizeLabel || undefined,
        material: material || undefined,
        color: color || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
        availableSizes,
        availableColors,
      }

      // Validate using Zod schema (same as JSON endpoint)
      const validation = productSchema.safeParse(productData)
      if (!validation.success) {
        console.error('[Products API] Validation failed:', validation.error.issues)
        return NextResponse.json(
          { success: false, error: validation.error.issues[0].message, details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data
      console.log('[Products API] Validated data:', validatedData)

      // Auto-generate slug from name if not provided
      let finalSlug = validatedData.slug
      if (!finalSlug || finalSlug.trim().length === 0) {
        finalSlug = createSlug(validatedData.name)
      }

      console.log('[Products API] Generated slug from name:', finalSlug)

      // Validate slug format
      if (!isValidSlug(finalSlug)) {
        console.error('[Products API] Invalid slug format:', finalSlug)
        return NextResponse.json(
          { success: false, error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
          { status: 400 }
        )
      }

      // Check for unique slug and generate unique slug if needed
      let generatedSlug = finalSlug
      let counter = 1
      let existingProduct = await ProductRepository.findBySlug(env, generatedSlug)
      while (existingProduct) {
        generatedSlug = `${finalSlug}-${counter}`
        counter++
        existingProduct = await ProductRepository.findBySlug(env, generatedSlug)
      }

      console.log('[Products API] Final unique slug:', generatedSlug)

      // Handle image uploads
      const imagesJson = formData.get('images') as string | null
      let images: string[] = []
      if (imagesJson) {
        try {
          images = JSON.parse(imagesJson)
        } catch (e) {
          console.error('[Products API] Failed to parse images JSON:', e)
        }
      }

      // Handle file uploads
      const files = formData.getAll('files') as File[]

      for (const file of files) {
        if (file && file.size > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)

          // Secure: Use only configured base URL, never fall back to Host header (SSRF protection)
          const baseUrl = await getEnvVar('NEXT_PUBLIC_BASE_URL') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

          // Validate the baseUrl is a legitimate URL to prevent SSRF
          if (!baseUrl.startsWith('http://localhost:') && !baseUrl.startsWith('http://127.0.0.1:') && !baseUrl.startsWith('https://')) {
            console.error('[Products API] Invalid base URL configuration, using localhost fallback')
            throw new Error('Invalid base URL configuration')
          }

          const uploadUrl = `${baseUrl}/api/admin/upload`

          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('[Products API] Upload failed:', errorText)
            continue
          }

          const uploadResult = await uploadResponse.json() as any
          if (uploadResult.success) {
            images.push(uploadResult.data.url)
          }
        }
      }

      console.log('[Products API] Creating product with images:', images)

      const product = await ProductRepository.create(env, {
        name: validatedData.name,
        slug: generatedSlug,
        description: validatedData.description || undefined,
        categoryId: validatedData.categoryId,
        basePrice: validatedData.basePrice,
        comparePrice: validatedData.comparePrice ?? undefined,
        costPrice: validatedData.costPrice ?? undefined,
        images,
        stock: validatedData.stock,
        lowStockAlert: validatedData.lowStockAlert ?? undefined,
        reorderLevel: validatedData.reorderLevel ?? undefined,
        reorderQty: validatedData.reorderQty ?? undefined,
        isActive: validatedData.isActive,
        isFeatured: validatedData.isFeatured,
        hasVariants: validatedData.hasVariants,
        brandId: validatedData.brandId || undefined,
        brandName: validatedData.brandName || undefined,
        brandLogo: validatedData.brandLogo || undefined,
        sizeType: validatedData.sizeType || undefined,
        sizeValue: validatedData.sizeValue || undefined,
        sizeUnit: validatedData.sizeUnit || undefined,
        sizeLabel: validatedData.sizeLabel || undefined,
        material: validatedData.material || undefined,
        color: validatedData.color || undefined,
        countryOfOrigin: validatedData.countryOfOrigin || undefined,
        availableSizes: validatedData.availableSizes ?? undefined,
        availableColors: validatedData.availableColors ?? undefined,
      })

      if (!product) {
        console.error('[Products API] Failed to create product - no data returned')
        return NextResponse.json(
          { success: false, error: 'Failed to create product - no data returned' },
          { status: 500 }
        )
      }

      console.log('[Products API] Product created successfully:', product)

      // Log audit event
      try {
        await logAdminAction(
          env,
          request,
          admin.id,
          'CREATE',
          'Product',
          product.id,
          `Created product "${name}" (ID: ${product.id})`
        )
      } catch (error) {
        // Don't fail the request if audit logging fails
        console.error('[Products API] Failed to log audit event:', error)
      }

      // Fetch category for response
      let category: any = null
      if (product.categoryId) {
        category = await CategoryRepository.findById(env, product.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...product,
          hasVariants: numberToBool(product.hasVariants),
          category,
        },
      }, { status: 201 })
    }

    // Handle JSON content type (from admin panel)
    if (contentType.includes('application/json')) {
      const body = await request.json()

      console.log('[Products API] Creating product with body:', body)

      // Validate using Zod schema
      const validation = productSchema.safeParse(body)
      if (!validation.success) {
        console.error('[Products API] Validation failed:', validation.error.issues)
        return NextResponse.json(
          { success: false, error: validation.error.issues[0].message, details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data
      console.log('[Products API] Validated data:', validatedData)

      // Auto-generate slug from name if not provided
      let finalSlug = validatedData.slug
      if (!finalSlug || finalSlug.trim().length === 0) {
        finalSlug = createSlug(validatedData.name)
      }

      console.log('[Products API] Generated slug:', finalSlug)

      // Check for unique slug and generate unique slug if needed
      let generatedSlug = finalSlug
      let counter = 1
      let existingProduct = await ProductRepository.findBySlug(env, generatedSlug)
      while (existingProduct) {
        generatedSlug = `${finalSlug}-${counter}`
        counter++
        existingProduct = await ProductRepository.findBySlug(env, generatedSlug)
      }

      console.log('[Products API] Final unique slug:', generatedSlug)

      // Validate required categoryId
      if (!validatedData.categoryId) {
        console.error('[Products API] Category ID is required')
        return NextResponse.json(
          { success: false, error: 'Category ID is required' },
          { status: 400 }
        )
      }

      // Convert null values to undefined for repository
      const productData = {
        ...validatedData,
        slug: generatedSlug,
        description: validatedData.description ?? undefined,
        images: validatedData.images ?? undefined,
        comparePrice: validatedData.comparePrice ?? undefined,
        costPrice: validatedData.costPrice ?? undefined,
        brandId: validatedData.brandId ?? undefined,
        brandName: validatedData.brandName ?? undefined,
        brandLogo: validatedData.brandLogo ?? undefined,
        sizeType: validatedData.sizeType ?? undefined,
        sizeValue: validatedData.sizeValue ?? undefined,
        sizeUnit: validatedData.sizeUnit ?? undefined,
        sizeLabel: validatedData.sizeLabel ?? undefined,
        material: validatedData.material ?? undefined,
        color: validatedData.color ?? undefined,
        countryOfOrigin: validatedData.countryOfOrigin ?? undefined,
        categoryId: validatedData.categoryId as string, // Ensure it's a string
        lowStockAlert: validatedData.lowStockAlert ?? undefined,
        reorderLevel: validatedData.reorderLevel ?? undefined,
        reorderQty: validatedData.reorderQty ?? undefined,
        availableSizes: validatedData.availableSizes ?? undefined,
        availableColors: validatedData.availableColors ?? undefined,
      }

      console.log('[Products API] Creating product with data:', productData)

      const product = await ProductRepository.create(env, productData)

      if (!product) {
        console.error('[Products API] Failed to create product - no data returned')
        return NextResponse.json(
          { success: false, error: 'Failed to create product - no data returned' },
          { status: 500 }
        )
      }

      console.log('[Products API] Product created successfully:', product)

      // Log audit event
      try {
        await logAdminAction(
          env,
          request,
          admin.id,
          'CREATE',
          'Product',
          product.id,
          `Created product "${validatedData.name}" (ID: ${product.id})`
        )
      } catch (error) {
        // Don't fail the request if audit logging fails
        console.error('[Products API] Failed to log audit event:', error)
      }

      // Fetch category for response
      let category: any = null
      if (product.categoryId) {
        category = await CategoryRepository.findById(env, product.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...product,
          hasVariants: numberToBool(product.hasVariants),
          category,
        },
      }, { status: 201 })
    }

    // Unsupported content type
    return NextResponse.json(
      { success: false, error: 'Unsupported content type. Use application/json or multipart/form-data' },
      { status: 415 }
    )
  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log additional details for debugging
    console.error('[Products API] Error details:', {
      message: errorMessage,
      name: error instanceof Error ? error.name : 'Unknown',
      stack: errorStack?.substring(0, 500) // First 500 chars of stack
    });

    // Check if it's a database constraint error
    if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A product with this slug already exists',
          details: 'Please use a different product name or slug'
        },
        { status: 409 }
      );
    }

    // Return more detailed error even in production for now to debug
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
