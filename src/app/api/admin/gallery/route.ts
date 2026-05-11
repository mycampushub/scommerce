import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ImageGalleryRepository } from '@/db/image-gallery.repository'
import { csrfMiddleware, getCSRFTokenFromRequest } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let images

    if (search) {
      images = await ImageGalleryRepository.search(env, search, { category, limit })
    } else {
      images = await ImageGalleryRepository.findAll(env, { category, isActive: true, limit, offset })
    }

    return NextResponse.json({
      success: true,
      data: images,
    })
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch gallery images',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
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
    const contentType = request.headers.get('content-type') || ''

    // Handle multipart/form-data for direct upload to gallery
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const category = formData.get('category') as string || 'general'
      const alt = formData.get('alt') as string | null
      const tagsJson = formData.get('tags') as string | null

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
          },
          { status: 400 }
        )
      }

      // Validate file size (5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
          },
          { status: 400 }
        )
      }

      // Upload file
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

      // Get image dimensions
      const { getImageDimensions } = await import('@/lib/image-utils')
      const dimensions = await getImageDimensions(file)

      // Parse tags
      let tags: string[] = []
      if (tagsJson) {
        try {
          tags = JSON.parse(tagsJson)
        } catch (e) {
          console.error('Failed to parse tags JSON:', e)
        }
      }

      // Save to gallery
      const galleryItem = await ImageGalleryRepository.create(env, {
        filename: uploadResult.data.name,
        url: uploadResult.data.url,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width: dimensions?.width,
        height: dimensions?.height,
        alt: alt || undefined,
        tags,
        category,
      })

      return NextResponse.json({
        success: true,
        data: galleryItem,
      })
    }

    // Handle JSON payload for adding existing URLs to gallery
    const body = await request.json() as any

    const { url, category, alt, tags } = body

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Check if URL already exists in gallery
    const existing = await ImageGalleryRepository.findByUrl(env, url)
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Image already exists in gallery' },
        { status: 409 }
      )
    }

    // Save to gallery
    const galleryItem = await ImageGalleryRepository.create(env, {
      filename: url.split('/').pop() || 'unknown',
      url,
      category: category || 'general',
      alt: alt || undefined,
      tags: tags || [],
    })

    return NextResponse.json({
      success: true,
      data: galleryItem,
    })
  } catch (error) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create gallery item',
      },
      { status: 500 }
    )
  }
}
