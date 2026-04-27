import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { queryFirst, queryAll, execute, parseJSON, stringifyJSON, boolToNumber, numberToBool, now } from '@/db/db'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
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
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const contentType = request.headers.get('content-type') || ''
    const action = request.headers.get('x-action') || 'update'

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

      const { id } = await params
      const product = await ProductRepository.findById(env, id)

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload`, {
        method: 'POST',
        body: uploadFormData,
      })

      const uploadResult = await uploadResponse.json()
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error },
          { status: 400 }
        )
      }

      const currentImages = Array.isArray(product.images) ? product.images : []
      currentImages.push(uploadResult.data.url)

      const updatedProduct = await ProductRepository.update(env, id, {
        images: currentImages,
      })

      // Fetch category for response
      let category = null
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
      const body = await request.json()
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

      const currentImages = Array.isArray(product.images) ? product.images : []
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl)

      const updatedProduct = await ProductRepository.update(env, id, {
        images: updatedImages,
      })

      // Delete file from server
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload?path=${encodeURIComponent(imageUrl.replace('/', ''))}`, {
        method: 'DELETE',
      })

      // Fetch category for response
      let category = null
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
      const body = await request.json()
      const { images } = body

      if (!Array.isArray(images)) {
        return NextResponse.json(
          { success: false, error: 'Invalid images array' },
          { status: 400 }
        )
      }

      const { id } = await params
      const updatedProduct = await ProductRepository.update(env, id, {
        images,
      })

      // Fetch category for response
      let category = null
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

      const { id } = await params
      const updateData: any = {}
      if (name) updateData.name = name
      if (slug) updateData.slug = slug
      if (description !== undefined) updateData.description = description
      if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice)
      if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null
      if (categoryId) updateData.categoryId = categoryId
      if (images.length > 0) updateData.images = images
      if (stock !== undefined) updateData.stock = parseInt(stock)
      if (lowStockAlert !== undefined) updateData.lowStockAlert = parseInt(lowStockAlert)
      if (isActive !== undefined) updateData.isActive = isActive
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured

      const product = await ProductRepository.update(env, id, updateData)

      // Fetch category for response
      let category = null
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
    const body = await request.json()
    const { id } = await params

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.basePrice = parseFloat(body.price)
    if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice ? parseFloat(body.comparePrice) : null
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.images !== undefined) updateData.images = typeof body.images === 'string' ? JSON.parse(body.images) : body.images
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock)
    if (body.lowStockAlert !== undefined) updateData.lowStockAlert = parseInt(body.lowStockAlert)
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
    if (body.hasVariants !== undefined) updateData.hasVariants = body.hasVariants

    const product = await ProductRepository.update(env, id, updateData)

    // Fetch category for response
    let category = null
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
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
    await ProductRepository.delete(env, id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
      },
      { status: 500 }
    )
  }
}
