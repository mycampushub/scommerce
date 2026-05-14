import { NextRequest, NextResponse } from 'next/server'
import { getEnv, getEnvVar } from '@/lib/cloudflare'
import { generateSecureId } from '@/lib/crypto-utils'

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

/**
 * Generate unique filename with timestamp and random string
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = generateSecureId().substring(0, 8)
  const ext = originalName.split('.').pop() || 'jpg'
  return `${timestamp}-${randomStr}.${ext}`
}

/**
 * Upload file to R2 bucket
 */
async function uploadToR2(env: any, key: string, file: File): Promise<string> {
  if (!env?.BUCKET) {
    throw new Error('R2 bucket not available')
  }

  const arrayBuffer = await file.arrayBuffer()
  await env.BUCKET.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  // Get public URL from environment or construct default
  const r2PublicUrl = getEnvVar('R2_PUBLIC_URL') || ''
  return `${r2PublicUrl}/${key}`
}

/**
 * Delete file from R2 bucket
 */
async function deleteFromR2(env: any, key: string): Promise<void> {
  if (!env?.BUCKET) {
    throw new Error('R2 bucket not available')
  }
  await env.BUCKET.delete(key)
}

/**
 * Extract key from file path
 */
function extractKeyFromPath(filePath: string): string {
  // Remove /uploads/ prefix if present
  return filePath.replace(/^\/uploads\//, '').replace(/^uploads\//, '')
}

// POST: Upload file
export async function POST(request: NextRequest) {
  try {
    const env = getEnv()

    // Check if R2 bucket is available
    if (!env?.BUCKET) {
      return NextResponse.json(
        { success: false, error: 'Storage service not available. Please check R2 configuration.' },
        { status: 503 }
      )
    }

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
        { success: false, error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const filename = generateFilename(file.name)
    const key = `uploads/${filename}`

    // Upload to R2
    const publicUrl = await uploadToR2(env, key, file)

    return NextResponse.json({
      success: true,
      data: {
        url: `/uploads/${filename}`, // Keep relative path for database storage
        publicUrl, // Full URL for immediate use
        size: file.size,
        type: file.type,
        name: file.name,
        key // R2 key for future reference
      }
    })
  } catch (error) {
    console.error('[Upload] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE: Delete file
export async function DELETE(request: NextRequest) {
  try {
    const env = getEnv()

    // Check if R2 bucket is available
    if (!env?.BUCKET) {
      return NextResponse.json(
        { success: false, error: 'Storage service not available' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      )
    }

    // Security check: only allow deleting files from uploads directory
    if (!filePath.startsWith('/uploads/') && !filePath.startsWith('uploads/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 403 }
      )
    }

    // Extract key and delete from R2
    const key = `uploads/${extractKeyFromPath(filePath)}`
    await deleteFromR2(env, key)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('[Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
