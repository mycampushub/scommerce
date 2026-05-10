import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Get R2 bucket from environment (Cloudflare)
    const env = getEnv()
    const bucket = env?.BUCKET

    if (!bucket) {
      return NextResponse.json(
        { success: false, error: 'R2 storage bucket not available in this environment' },
        { status: 500 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`

    // Upload to R2 bucket
    const arrayBuffer = await file.arrayBuffer()
    await bucket.put(uniqueFilename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentLength: file.size,
      },
    })

    // Return file URL and metadata
    return NextResponse.json({
      success: true,
      data: {
        url: `/uploads/${uniqueFilename}`,
        size: file.size,
        type: file.type,
        name: file.name,
      },
    })
  } catch (error) {
    console.error('[upload] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    // Security: Ensure path is within uploads directory
    if (!path.startsWith('/uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Get R2 bucket from environment
    const env = getEnv()
    const bucket = env?.BUCKET

    if (!bucket) {
      return NextResponse.json(
        { success: false, error: 'R2 storage bucket not available in this environment' },
        { status: 500 }
      )
    }

    // Extract filename from path
    const filename = path.replace('/uploads/', '')

    // Delete file from R2 bucket
    await bucket.delete(filename)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('[upload] Delete error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
