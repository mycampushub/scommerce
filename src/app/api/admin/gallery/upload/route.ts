import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { ImageGalleryRepository } from '@/db/image-gallery.repository'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  console.log('[Gallery Upload POST] Request received')

  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    console.log('[Gallery Upload POST] Auth failed')
    return userOrResponse
  }

  console.log('[Gallery Upload POST] Auth passed')

  try {
    const formData = await request.formData()
    console.log('[Gallery Upload POST] FormData received')
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

    console.log('[Gallery Upload POST] Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      category
    })

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const filename = `${uniqueId}.${ext}`

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    console.log('[Gallery Upload POST] File saved:', filePath)

    // Get image dimensions
    let width: number | null = null
    let height: number | null = null

    try {
      const metadata = await sharp(buffer).metadata()
      width = metadata.width || null
      height = metadata.height || null
      console.log('[Gallery Upload] Image dimensions:', { width, height })
    } catch (err) {
      console.warn('[Gallery Upload] Failed to get image dimensions:', err)
    }

    // Parse tags
    let tags: string[] = []
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson)
      } catch (e) {
        console.error('[Gallery Upload] Failed to parse tags JSON:', e)
      }
    }

    // Save to gallery
    console.log('[Gallery Upload POST] Creating gallery item...')
    const galleryItem = await ImageGalleryRepository.create(null, {
      filename,
      url: `/uploads/${filename}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      width,
      height,
      alt: alt || undefined,
      tags,
      category,
    })

    console.log('[Gallery Upload POST] Successfully created gallery item:', galleryItem.id)

    return NextResponse.json({
      success: true,
      data: galleryItem,
    })
  } catch (error) {
    console.error('[Gallery Upload] Error:', error)
    console.error('[Gallery Upload] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        success: false,
        error: `Failed to upload to gallery${error instanceof Error ? `: ${error.message}` : ''}`,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
