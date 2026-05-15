import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryAll, queryFirst, execute, generateId, now, parseJSON } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'

// GET - List all media with optional filters
export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = 'SELECT * FROM media WHERE 1=1'
    const params: any[] = []

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    if (search) {
      query += ' AND (originalName LIKE ? OR alt LIKE ? OR tags LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    query += ' ORDER BY createdAt DESC LIMIT ?'
    params.push(limit)

    const media = await queryAll(env, query, ...params)

    // Parse tags from JSON
    const mediaWithParsedTags = media.map((m: any) => ({
      ...m,
      tags: m.tags ? parseJSON<string[]>(m.tags) : []
    }))

    return NextResponse.json({
      success: true,
      data: mediaWithParsedTags
    })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch gallery'
      },
      { status: 500 }
    )
  }
}

// POST - Upload and save to gallery
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  // Rate limiting: 20 uploads per minute per admin
  const clientIp = getClientIp(request);
  const rateLimitKey = `admin-gallery-upload:${clientIp}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute window
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'general'
    const alt = (formData.get('alt') as string) || ''
    const tags = (formData.get('tags') as string) || '[]'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Get image dimensions
    const { width, height } = await getImageDimensions(file)

    // Upload file to storage
    const uploadResult = await uploadFile(file)

    // Generate unique ID
    const id = generateId()
    const currentTime = now()

    // Save to media table
    await execute(
      env,
      `INSERT INTO media (id, filename, originalName, url, mimeType, size, width, height, alt, tags, category, uploadedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        file.name,
        file.name,
        uploadResult.url,
        file.type,
        file.size,
        width,
        height,
        alt,
        tags,
        category,
        (userOrResponse as any).id, // uploadedBy
        currentTime,
        currentTime
      ]
    )

    return NextResponse.json({
      success: true,
      data: {
        id,
        url: uploadResult.url,
        filename: file.name,
        width,
        height,
        size: file.size
      }
    })
  } catch (error: any) {
    console.error('Error uploading to gallery:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload to gallery'
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove from gallery
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID required' },
        { status: 400 }
      )
    }

    // Get media info
    const media = await queryFirst(
      env,
      'SELECT * FROM media WHERE id = ?',
      id
    )

    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      )
    }

    // Delete file from storage
    await deleteFile(media.url as string)

    // Delete from database
    await execute(
      env,
      'DELETE FROM media WHERE id = ?',
      id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting from gallery:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete from gallery'
      },
      { status: 500 }
    )
  }
}

// Helper function to get image dimensions
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// Helper function to upload file to storage
async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  // Use the existing upload endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const uploadResponse = await fetch(`${baseUrl}/api/admin/upload`, {
    method: 'POST',
    body: formData,
  })

  const uploadData: any = await uploadResponse.json()

  if (!uploadData.success) {
    throw new Error(uploadData.error || 'Upload failed')
  }

  return { url: uploadData.url }
}

// Helper function to delete file from storage
async function deleteFile(url: string): Promise<void> {
  try {
    // Use the existing upload endpoint to delete
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await fetch(`${baseUrl}/api/admin/upload?path=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Error deleting file from storage:', error)
    // Don't throw - continue with database deletion
  }
}
