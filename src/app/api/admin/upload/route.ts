import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Write file to disk
    const filePath = join(uploadsDir, uniqueFilename)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

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

    // Get full file path
    const filePath = join(process.cwd(), 'public', path)

    // Check if file exists (safety check)
    if (!existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        message: 'File not found (already deleted)',
      })
    }

    // Delete file
    await unlink(filePath)

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
