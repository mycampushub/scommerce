import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: {
        id: id,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
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
      const product = await db.product.findUnique({
        where: { id },
      })

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

      const currentImages = product.images ? JSON.parse(product.images) : []
      currentImages.push(uploadResult.data.url)

      const updatedProduct = await db.product.update({
        where: { id },
        data: { images: JSON.stringify(currentImages) },
        include: { category: true },
      })

      return NextResponse.json({ success: true, data: updatedProduct })
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
      const product = await db.product.findUnique({
        where: { id },
      })

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        )
      }

      const currentImages = product.images ? JSON.parse(product.images) : []
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl)

      const updatedProduct = await db.product.update({
        where: { id },
        data: { images: JSON.stringify(updatedImages) },
        include: { category: true },
      })

      // Delete file from server
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/upload?path=${encodeURIComponent(imageUrl.replace('/', ''))}`, {
        method: 'DELETE',
      })

      return NextResponse.json({ success: true, data: updatedProduct })
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
      const updatedProduct = await db.product.update({
        where: { id },
        data: { images: JSON.stringify(images) },
        include: { category: true },
      })

      return NextResponse.json({ success: true, data: updatedProduct })
    }

    // Handle multipart/form-data for image uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      const name = formData.get('name') as string
      const slug = formData.get('slug') as string
      const description = formData.get('description') as string | null
      const price = formData.get('price') as string
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
      const product = await db.product.update({
        where: {
          id,
        },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(comparePrice !== undefined && {
            comparePrice: comparePrice ? parseFloat(comparePrice) : null,
          }),
          ...(categoryId && { categoryId }),
          ...(images.length > 0 && { images: JSON.stringify(images) }),
          ...(stock !== undefined && { stock: parseInt(stock) }),
          ...(lowStockAlert !== undefined && {
            lowStockAlert: parseInt(lowStockAlert),
          }),
          ...(isActive !== undefined && { isActive }),
          ...(isFeatured !== undefined && { isFeatured }),
        },
        include: {
          category: true,
        },
      })

      return NextResponse.json({
        success: true,
        data: product,
      })
    }

    // Handle JSON payload
    const body = await request.json()

    const product = await db.product.update({
      where: {
        id: params.id,
      },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.comparePrice !== undefined && {
          comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.images !== undefined && {
          images: typeof body.images === 'string' ? body.images : JSON.stringify(body.images)
        }),
        ...(body.stock !== undefined && { stock: parseInt(body.stock) }),
        ...(body.lowStockAlert !== undefined && {
          lowStockAlert: parseInt(body.lowStockAlert),
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.attributes !== undefined && { attributes: body.attributes }),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: product,
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
    const { id } = await params
    await db.product.delete({
      where: {
        id,
      },
    })

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
