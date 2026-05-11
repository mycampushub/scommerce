import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { updateProductSchema } from '@/lib/validations'
import { queryFirst, queryAll, execute, parseJSON, stringifyJSON, boolToNumber, numberToBool, now } from '@/db/db'
import { csrfMiddleware, getCSRFTokenFromRequest } from '@/lib/csrf'
import { isValidSlug } from '@/lib/slug'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = getEnv()
    const { id } = await params
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      )
    }

    // Fetch category
    let category: any = null
    if (product?.categoryId) {
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
    console.error('Error fetching product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  // Await params outside try block to avoid scope issues
  const { id: productId } = await params

  try {
    const contentType = request.headers.get('content-type') || ''
    const action = request.headers.get('x-action') || 'update'

    if (action === 'update') {
      // Handle JSON payload for normal update
      const body = await request.json() as any

      const updateData: any = {}
      if (body.stock !== undefined) {
        updateData.stock = parseInt(body.stock)
      }

      if (body.name !== undefined) updateData.name = body.name
      if (body.slug !== undefined) updateData.slug = body.slug
      if (body.description !== undefined) updateData.description = body.description
      if (body.price !== undefined) updateData.basePrice = parseFloat(body.price)
      if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice
      if (body.costPrice !== undefined) updateData.costPrice = body.costPrice
      if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
      if (body.lowStockAlert !== undefined) updateData.lowStockAlert = parseInt(body.lowStockAlert)
      if (body.reorderLevel !== undefined) updateData.reorderLevel = parseInt(body.reorderLevel)
      if (body.reorderQty !== undefined) updateData.reorderQty = parseInt(body.reorderQty)
      if (body.isActive !== undefined) updateData.isActive = body.isActive
      if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid fields to update' },
          { status: 400 }
        )
      }

      const updatedProduct = await ProductRepository.update(env, productId, updateData)

      let category: any = null
      if (updatedProduct?.categoryId) {
        category = await CategoryRepository.findById(env, updatedProduct.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updatedProduct,
          category,
        },
      })
    }
    
    // Handle image management operations
    if (action === 'add-image') {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        )
      }

      const product = await ProductRepository.findById(env, productId)

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }

      // Extract CSRF token from the original request for internal upload calls
      const csrfToken = getCSRFTokenFromRequest(request)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      if (csrfToken) {
        uploadFormData.append('_csrf', csrfToken)
      }

      const headers: HeadersInit = {}
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload`, {
        method: 'POST',
        headers,
        body: uploadFormData,
      })
      const uploadResult = await uploadResponse.json() as any
      
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error },
          { status: 400 }
        )
      }

      const currentImages: string[] = Array.isArray(product.images) ? [...product.images] : []
      currentImages.push(uploadResult.data.url)

      const updatedProduct = await ProductRepository.update(env, productId, {
        images: JSON.stringify(currentImages),
      })

      // Fetch category for response
      let category: any = null
      if (updatedProduct?.categoryId) {
        category = await CategoryRepository.findById(env, updatedProduct.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updatedProduct,
          category,
        },
      })
    }

    if (action === 'remove-image') {
      const body = await request.json() as any
      const { imageUrl } = body

      if (!imageUrl) {
        return NextResponse.json(
          { success: false, error: 'No image URL provided' },
          { status: 400 }
        )
      }

      const { id } = await params
      const product = await ProductRepository.findById(env, id)

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }

      const currentImages: string[] = Array.isArray(product.images) ? [...product.images] : []
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl)

      const updatedProduct = await ProductRepository.update(env, id, {
        images: JSON.stringify(updatedImages),
      })

      // Delete file from server
      const csrfToken = getCSRFTokenFromRequest(request)
      const deleteHeaders: HeadersInit = {}
      if (csrfToken) {
        deleteHeaders['X-CSRF-Token'] = csrfToken
      }

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload?path=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
        headers: deleteHeaders,
      })

      // Fetch category for response
      let category: any = null
      if (updatedProduct?.categoryId) {
        category = await CategoryRepository.findById(env, updatedProduct.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updatedProduct,
          category,
        },
      })
    }

    if (action === 'reorder-images') {
      const body = await request.json() as any
      const { images } = body

      if (!Array.isArray(images)) {
        return NextResponse.json(
          { success: false, error: 'Invalid images array' },
          { status: 400 }
        )
      }

      const { id } = await params
      const updatedProduct = await ProductRepository.update(env, id, {
        images: JSON.stringify(images),
      })

      // Fetch category for response
      let category: any = null
      if (updatedProduct?.categoryId) {
        category = await CategoryRepository.findById(env, updatedProduct.categoryId)
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updatedProduct,
          category,
        },
      })
    }

    // Handle multipart/form-data for image uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Validate required fields manually for multipart
      const name = formData.get('name') as string
      const slug = formData.get('slug') as string
      const description = formData.get('description') as string | null
      const basePrice = formData.get('price') as string
      const comparePrice = formData.get('comparePrice') as string | null
      const costPrice = formData.get('costPrice') as string | null
      const categoryId = formData.get('categoryId') as string | null
      const stock = formData.get('stock') as string
      const lowStockAlert = formData.get('lowStockAlert') as string | null
      const isActive = formData.get('isActive') === 'true'
      const isFeatured = formData.get('isFeatured') === 'true'

      // Manual validation for multipart - validate if fields are provided
      if (name !== undefined) {
        const trimmedName = name?.trim()
        if (!trimmedName || trimmedName.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Product name cannot be empty' },
            { status: 400 }
          )
        }
      }
      if (basePrice !== undefined) {
        const price = parseFloat(basePrice)
        if (isNaN(price) || price <= 0) {
          return NextResponse.json(
            { success: false, error: 'Price must be a positive number' },
            { status: 400 }
          )
        }
      }
      if (stock !== undefined) {
        const stockNum = parseInt(stock)
        if (isNaN(stockNum) || stockNum < 0) {
          return NextResponse.json(
            { success: false, error: 'Stock must be a non-negative integer' },
            { status: 400 }
          )
        }
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
      // Extract CSRF token from the original request for internal upload calls
      const csrfToken = getCSRFTokenFromRequest(request)

      for (const file of files) {
        if (file && file.size > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          if (csrfToken) {
            uploadFormData.append('_csrf', csrfToken)
          }

          const headers: HeadersInit = {}
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken
          }

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload`, {
            method: 'POST',
            headers,
            body: uploadFormData,
          })

          const uploadResult = await uploadResponse.json() as any
          if (uploadResult.success) {
            images.push(uploadResult.data.url)
          }
        }
      }

      const { id } = await params
      const updateData: any = {}
      if (name) updateData.name = name
      if (slug) updateData.slug = slug
      if (description !== undefined) updateData.description = description
      if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice)
      if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null
      if (costPrice !== undefined) updateData.costPrice = costPrice ? parseFloat(costPrice) : null
      if (categoryId) updateData.categoryId = categoryId
      if (images.length > 0) updateData.images = JSON.stringify(images)
      if (stock !== undefined) updateData.stock = parseInt(stock)
      if (lowStockAlert !== undefined && lowStockAlert !== null) updateData.lowStockAlert = parseInt(lowStockAlert)
      if (isActive !== undefined) updateData.isActive = isActive
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured

      // Validate slug format if being updated
      if (slug !== undefined) {
        if (!isValidSlug(slug)) {
          return NextResponse.json(
            { success: false, error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
            { status: 400 }
          )
        }

        // Check for unique slug (excluding current product)
        const existingProduct = await ProductRepository.findBySlug(env, slug)
        if (existingProduct && existingProduct.id !== id) {
          return NextResponse.json(
            { success: false, error: 'A product with this URL slug already exists. Please use a different slug.' },
            { status: 409 }
          )
        }
      }

      const product = await ProductRepository.update(env, id, updateData)

      // Fetch category for response
      let category: any = null
      if (product?.categoryId) {
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
    const { id } = await params

    // Validate with Zod for JSON payload
    const validation = updateProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.price !== undefined) updateData.basePrice = validatedData.price
    if (validatedData.comparePrice !== undefined) updateData.comparePrice = validatedData.comparePrice
    if (validatedData.costPrice !== undefined) updateData.costPrice = validatedData.costPrice
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId
    if (validatedData.images !== undefined) updateData.images = typeof validatedData.images === 'string' ? validatedData.images : JSON.stringify(validatedData.images)
    if (validatedData.stock !== undefined) updateData.stock = validatedData.stock
    if (validatedData.lowStockAlert !== undefined) updateData.lowStockAlert = validatedData.lowStockAlert
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isFeatured !== undefined) updateData.isFeatured = validatedData.isFeatured
    if (body.hasVariants !== undefined) updateData.hasVariants = body.hasVariants

    // Validate slug format if being updated
    if (validatedData.slug !== undefined) {
      if (!isValidSlug(validatedData.slug)) {
        return NextResponse.json(
          { success: false, error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' },
          { status: 400 }
        )
      }

      // Check for unique slug (excluding current product)
      const existingProduct = await ProductRepository.findBySlug(env, validatedData.slug)
      if (existingProduct && existingProduct.id !== id) {
        return NextResponse.json(
          { success: false, error: 'A product with this URL slug already exists. Please use a different slug.' },
          { status: 409 }
        )
      }
    }

    const product = await ProductRepository.update(env, id, updateData)

    // Fetch category for response
    let category: any = null
    if (product?.categoryId) {
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
    console.error('Error updating product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const { id } = await params

    // Check if product exists
    const product = await ProductRepository.findById(env, id)
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      )
    }

    // Check if product has order history (cannot delete if it has been ordered)
    const { queryFirst } = await import('@/db/db')
    const orderItem = await queryFirst<any>(
      env,
      'SELECT id FROM order_items WHERE productId = ? LIMIT 1',
      id
    )

    if (orderItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product that has been ordered. Consider marking it as inactive instead.',
        },
        { status: 409 }
      )
    }

    // Delete product
    await ProductRepository.delete(env, id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product:', error)

    // Check if it's a foreign key constraint error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('FOREIGN KEY') || errorMessage.includes('constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product that has related records (orders, cart items, etc.). Consider marking it as inactive instead.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
      },
      { status: 500 }
    )
  }
}
