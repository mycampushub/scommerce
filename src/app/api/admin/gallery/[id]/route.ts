import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ImageGalleryRepository } from '@/db/image-gallery.repository'
import { csrfMiddleware, getCSRFTokenFromRequest } from '@/lib/csrf'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const { id } = await params

    const image = await ImageGalleryRepository.findById(env, id)

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image not found',
        },
        { status: 404 }
      )
    }

    // Increment usage count
    await ImageGalleryRepository.incrementUsage(env, id)

    return NextResponse.json({
      success: true,
      data: image,
    })
  } catch (error) {
    console.error('Error fetching gallery image:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch gallery image',
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

  try {
    const { id } = await params
    const body = await request.json() as any

    const { alt, tags, category, isActive } = body

    const updateData: any = {}
    if (alt !== undefined) updateData.alt = alt
    if (tags !== undefined) updateData.tags = tags
    if (category !== undefined) updateData.category = category
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedImage = await ImageGalleryRepository.update(env, id, updateData)

    if (!updatedImage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedImage,
    })
  } catch (error) {
    console.error('Error updating gallery image:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update gallery image',
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

    // Get image info before deleting
    const image = await ImageGalleryRepository.findById(env, id)

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image not found',
        },
        { status: 404 }
      )
    }

    // Check if image is used in products, categories, or stories
    const { queryFirst } = await import('@/db/db')

    // Check products
    const productCheck = await queryFirst<any>(
      env,
      'SELECT id FROM products WHERE images LIKE ? LIMIT 1',
      `%${image.url}%`
    )

    // Check categories
    const categoryCheck = await queryFirst<any>(
      env,
      'SELECT id FROM categories WHERE image = ? LIMIT 1',
      image.url
    )

    // Check stories
    const storyCheck = await queryFirst<any>(
      env,
      'SELECT id FROM stories WHERE thumbnail = ? OR images LIKE ? LIMIT 1',
      image.url,
      `%${image.url}%`
    )

    if (productCheck || categoryCheck || storyCheck) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete image that is currently in use',
        },
        { status: 409 }
      )
    }

    // Delete from database
    await ImageGalleryRepository.delete(env, id)

    // Delete file from disk if it's an uploaded file
    if (image.url.startsWith('/uploads/')) {
      try {
        const filePath = join(process.cwd(), 'public', image.url)
        await unlink(filePath)
      } catch (err) {
        // File might not exist, that's ok
        console.warn('Failed to delete file:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting gallery image:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete gallery image',
      },
      { status: 500 }
    )
  }
}
