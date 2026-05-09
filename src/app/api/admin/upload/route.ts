import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'

/**
 * POST /api/admin/upload
 * Upload an image file to server
 * Supports both local development (Node.js fs) and production (Cloudflare R2)
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = getEnv()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

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
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Check if we're in production (Cloudflare R2) or development (Node.js fs)
    if (env && env.BUCKET) {
      // Production mode: Upload to Cloudflare R2 bucket
      return await uploadToR2(env, file)
    } else {
      // Development mode: Upload to local filesystem
      return await uploadToLocal(file)
    }
  } catch (error) {
    console.error('[Upload API] Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Upload file to Cloudflare R2 bucket (Production)
 */
async function uploadToR2(env: any, file: File): Promise<NextResponse> {
  try {
    const bytes = await file.arrayBuffer()

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || 'jpg'
    const key = `uploads/${timestamp}-${randomStr}.${ext}`

    console.log('[Upload API] Uploading to R2:', key)

    // Upload to R2 bucket
    await env.BUCKET.put(key, bytes, {
      httpMetadata: {
        contentType: file.type,
      },
    })

    // Return URL (will be served via Cloudflare CDN)
    const url = `/uploads/${timestamp}-${randomStr}.${ext}`

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename: `${timestamp}-${randomStr}.${ext}`,
        size: file.size,
        type: file.type
      }
    })
  } catch (error) {
    console.error('[Upload API] R2 upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file to storage'
      },
      { status: 500 }
    )
  }
}

/**
 * Upload file to local filesystem (Development)
 */
async function uploadToLocal(file: File): Promise<NextResponse> {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  const { existsSync } = await import('fs')

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${randomStr}.${ext}`
    const filepath = join(uploadsDir, filename)

    console.log('[Upload API] Uploading to local filesystem:', filepath)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return URL
    const url = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        size: file.size,
        type: file.type
      }
    })
  } catch (error) {
    console.error('[Upload API] Local upload error:', error)
    throw error
  }
}

/**
 * DELETE /api/admin/upload
 * Delete an image file from server
 */
export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = getEnv()

  try {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No path provided' },
        { status: 400 }
      )
    }

    // Security: Ensure path doesn't escape uploads directory
    const normalizedPath = path.replace(/\.\./g, '').replace(/\\/g, '/')
    if (!normalizedPath.startsWith('/uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Check if we're in production (Cloudflare R2) or development (Node.js fs)
    if (env && env.BUCKET) {
      // Production mode: Delete from R2 bucket
      return await deleteFromR2(env, normalizedPath)
    } else {
      // Development mode: Delete from local filesystem
      return await deleteFromLocal(normalizedPath)
    }
  } catch (error) {
    console.error('[Upload API] Error deleting file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Delete file from Cloudflare R2 bucket (Production)
 */
async function deleteFromR2(env: any, path: string): Promise<NextResponse> {
  try {
    const key = path.replace(/^\//, '')
    
    console.log('[Upload API] Deleting from R2:', key)

    // Delete from R2 bucket
    await env.BUCKET.delete(key)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('[Upload API] R2 delete error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file from storage'
      },
      { status: 500 }
    )
  }
}

/**
 * Delete file from local filesystem (Development)
 */
async function deleteFromLocal(path: string): Promise<NextResponse> {
  const { unlink } = await import('fs/promises')
  const { join } = await import('path')
  const { existsSync } = await import('fs')

  try {
    const filepath = join(process.cwd(), 'public', path)

    console.log('[Upload API] Deleting from local filesystem:', filepath)

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete file
    await unlink(filepath)
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('[Upload API] Local delete error:', error)
    throw error
  }
}
