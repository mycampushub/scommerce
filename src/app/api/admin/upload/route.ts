import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (only images)
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

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Return the base64 data URL
    return NextResponse.json({
      success: true,
      data: {
        url: dataUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path parameter required' },
        { status: 400 }
      )
    }

    // For base64 data URLs, we can't actually delete them
    // Just return success for now - in production you'd delete from cloud storage
    return NextResponse.json({
      success: true,
      message: 'Image would be deleted',
      path
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete image',
      },
      { status: 500 }
    )
  }
}
