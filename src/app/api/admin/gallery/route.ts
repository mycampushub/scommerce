import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryAll, queryFirst, execute, generateId, now, parseJSON } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'

// GET - List all media with optional filters
export async function GET(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

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

    // Ensure media is always an array
    const mediaArray = Array.isArray(media) ? media : []

    // Parse tags from JSON and ensure URL is always a string
    const mediaWithParsedTags = mediaArray.map((m: any) => ({
      ...m,
      url: String(m.url || ''),
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
    let tags = formData.get('tags') as string | null

    // Ensure tags is always a string (JSON stringify if it's an object)
    if (!tags) {
      tags = '[]'
    } else if (typeof tags !== 'string') {
      tags = JSON.stringify(tags)
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    // SECURITY: Removed SVG to prevent XSS attacks
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
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

    // Upload file to storage (dimensions will be extracted in uploadFile)
    const uploadResult = await uploadFile(file, env, (userOrResponse as any).id)

    // Generate unique ID
    const id = generateId()
    const currentTime = now()

    // Ensure URL is a string
    const imageUrl = String(uploadResult.url || '')

    // Save to media table
    await execute(
      env,
      `INSERT INTO media (id, filename, originalName, url, mimeType, size, width, height, alt, tags, category, uploadedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      file.name,
      file.name,
      imageUrl,
      file.type,
      file.size,
      uploadResult.width || 0,
      uploadResult.height || 0,
      alt,
      tags,
      category,
      (userOrResponse as any).id, // uploadedBy
      currentTime,
      currentTime
    )

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'AdminLog',
      id,
      `Uploaded gallery media "${file.name}" (${(file.size / 1024).toFixed(2)}KB, ${file.type}) to category "${category}"`
    )

    return NextResponse.json({
      success: true,
      data: {
        id,
        url: uploadResult.url,
        filename: uploadResult.filename,
        width: uploadResult.width,
        height: uploadResult.height,
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
    await deleteFile(media.url as string, env)

    // Delete from database
    await execute(
      env,
      'DELETE FROM media WHERE id = ?',
      id
    )

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'AdminLog',
      id,
      `Deleted gallery media "${media.originalName}" (${media.mimeType})`
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

// Helper function to get image dimensions (works without sharp)
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)

    // PNG
    if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
      return {
        width: (uint8[16] << 24) | (uint8[17] << 16) | (uint8[18] << 8) | uint8[19],
        height: (uint8[20] << 24) | (uint8[21] << 16) | (uint8[22] << 8) | uint8[23],
      };
    }

    // JPEG
    if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
      let i = 2;
      while (i < uint8.length) {
        if (uint8[i] === 0xFF && uint8[i + 1] === 0xC0) {
          return {
            height: (uint8[i + 5] << 8) | uint8[i + 6],
            width: (uint8[i + 7] << 8) | uint8[i + 8],
          };
        }
        i += 2 + ((uint8[i + 2] << 8) | uint8[i + 3]);
      }
    }

    // WebP
    if (uint8[8] === 0x57 && uint8[9] === 0x45 && uint8[10] === 0x42 && uint8[11] === 0x50) {
      return {
        width: (uint8[24] << 8) | uint8[25],
        height: (uint8[26] << 8) | uint8[27],
      };
    }

    // GIF
    if (uint8[0] === 0x47 && uint8[1] === 0x49 && uint8[2] === 0x46) {
      return {
        width: (uint8[6] << 8) | uint8[7],
        height: (uint8[8] << 8) | uint8[9],
      };
    }

    return { width: 0, height: 0 }; // Default for SVG or other formats
  } catch (error) {
    console.error('[Gallery] Failed to get image dimensions:', error)
    return { width: 0, height: 0 }
  }
}

// Helper function to upload file to storage
async function uploadFile(file: File, env: any, userId: string): Promise<{ url: string; filename: string; width: number; height: number }> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Compute hash for duplicate detection
  const crypto = await import('crypto')
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')

  // Get image dimensions - handle cases where sharp might not work
  let width = 0
  let height = 0
  try {
    const dimensions = await getImageDimensions(file)
    width = dimensions.width
    height = dimensions.height
  } catch (error) {
    console.warn('[Gallery Upload] Could not get image dimensions:', error)
    // Continue without dimensions - they're optional
  }

  // Generate unique filename
  const timestamp = Date.now()
  // SECURITY: Use crypto.randomUUID() instead of Math.random() for cryptographically secure randomness
  const uniqueId = crypto.randomUUID().split('-').join('').substring(0, 12)
  
  // Sanitize original filename to extract extension safely
  const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '')
  const ext = safeOriginalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // Validate extension is in allowed list
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Invalid file extension: ${ext}`)
  }
  
  const filename = `${userId}-${timestamp}-${uniqueId}.${ext}`

  let fileUrl: string

  // Upload to R2 or local filesystem
  if (env?.BUCKET) {
    // Upload to R2 bucket (Cloudflare Workers)
    try {
      await env.BUCKET.put(filename, buffer, {
        httpMetadata: {
          contentType: file.type,
        },
      })

      // Get R2 public URL from environment variable or fallback
      const { getEnvVar } = await import('@/lib/cloudflare')
      const r2PublicUrl = await getEnvVar('R2_PUBLIC_URL')
      if (r2PublicUrl) {
        fileUrl = `${r2PublicUrl}/${filename}`
      } else {
        fileUrl = `/uploads/${filename}`
      }

      console.log('[Gallery Upload] R2 upload successful:', fileUrl)
    } catch (r2Error: any) {
      console.error('[Gallery Upload] R2 upload error:', r2Error)
      throw new Error('Failed to upload to R2 storage. Please try again.')
    }
  } else {
    // Local development: Use filesystem
    try {
      const { writeFile, mkdir } = await import('fs/promises')
      const { join } = await import('path')
      const { existsSync } = await import('fs')

      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const filePath = join(uploadsDir, filename)
      await writeFile(filePath, buffer)
      fileUrl = `/uploads/${filename}`

      console.log('[Gallery Upload] Filesystem upload successful:', fileUrl)
    } catch (fsError: any) {
      console.error('[Gallery Upload] Filesystem upload error:', fsError)
      throw new Error(`File upload failed: ${fsError?.message || 'Operation not permitted'}`)
    }
  }

  return { url: fileUrl, filename, width, height }
}

// Helper function to delete file from storage
async function deleteFile(url: string, env: any): Promise<void> {
  try {
    // Extract filename from URL
    let filename = url
    if (url.includes('/')) {
      filename = url.split('/').pop() || url
    }

    // Delete from R2 or local filesystem
    if (env?.BUCKET) {
      // Delete from R2 bucket
      try {
        await env.BUCKET.delete(filename)
        console.log('[Gallery Delete] R2 delete successful:', filename)
      } catch (r2Error: any) {
        console.error('[Gallery Delete] R2 delete error:', r2Error)
        // Don't fail if file doesn't exist in R2
        if (!r2Error.message?.includes('not found')) {
          throw r2Error
        }
      }
    } else {
      // Local development: Use filesystem
      try {
        const { unlink } = await import('fs/promises')
        const { join } = await import('path')
        const filePath = join(process.cwd(), 'public', 'uploads', filename)
        await unlink(filePath)
        console.log('[Gallery Delete] Filesystem delete successful:', filePath)
      } catch (fsError: any) {
        // File doesn't exist, that's ok
        if (fsError.code !== 'ENOENT') {
          console.error('[Gallery Delete] Filesystem delete error:', fsError)
          throw fsError
        }
      }
    }
  } catch (error) {
    console.error('Error deleting file from storage:', error)
    // Don't throw - continue with database deletion
  }
}
