import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { csrfMiddleware } from '@/lib/csrf'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  console.log('[Upload POST] Request received')

  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    console.log('[Upload POST] Auth failed')
    return userOrResponse
  }

  console.log('[Upload POST] Auth passed')

  // Get environment and check CSRF protection - only apply in Cloudflare with KV
  const env = await import('@/lib/cloudflare').then(m => m.getEnv())
  const isCloudflareEnv = env && env.KV
  console.log('[Upload POST] Env:', env ? 'exists' : 'null', 'Has KV:', isCloudflareEnv ? 'yes' : 'no')

  // Only check CSRF if we're in Cloudflare environment with KV
  if (isCloudflareEnv) {
    console.log('[Upload POST] Checking CSRF...')
    const csrfError = await csrfMiddleware(request, env)
    if (csrfError) {
      console.log('[Upload POST] CSRF validation failed')
      return csrfError
    }
  } else {
    console.log('[Upload POST] Skipping CSRF validation (local development or no KV)')
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

    // Return file URL
    const fileUrl = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      data: {
        url: fileUrl,
        name: filename,
        size: file.size,
        type: file.type
      }
    })
  } catch (error: any) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to upload file${error instanceof Error ? `: ${error.message}` : ''}`,
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

  // Get environment and check CSRF protection - only apply in Cloudflare with KV
  const env = await import('@/lib/cloudflare').then(m => m.getEnv())
  const isCloudflareEnv = env && env.KV

  // Only check CSRF if we're in Cloudflare environment with KV
  if (isCloudflareEnv) {
    const csrfError = await csrfMiddleware(request, env)
    if (csrfError) {
      return csrfError
    }
  }

  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      )
    }

    // Security check: ensure path is within uploads directory
    if (!path.startsWith('/uploads/') && !path.startsWith('uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const filePath = join(process.cwd(), 'public', cleanPath)

    // Delete file
    try {
      await unlink(filePath)
    } catch (err: any) {
      // File doesn't exist, that's ok
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error: any) {
    console.error('[Delete API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
      },
      { status: 500 }
    )
  }
}
