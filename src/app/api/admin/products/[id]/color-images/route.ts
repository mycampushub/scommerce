import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { logAdminAction } from '@/lib/audit-logger'
import { z } from 'zod'

/**
 * Schema for color image creation/update
 */
const colorImageSchema = z.object({
  color: z.string().min(1, 'Color is required'),
  images: z.array(z.string()).optional().default([])
})

/**
 * GET /api/admin/products/[id]/color-images
 * Get all color images for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch all color images for this product
    const colorImages = await ProductRepository.getColorImages(env, id)

    return NextResponse.json({
      success: true,
      colorImages
    })
  } catch (error) {
    console.error('Error fetching color images:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch color images',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products/[id]/color-images
 * Add or update color images for a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = colorImageSchema.parse(body)

    // Upsert color image
    const colorImage = await ProductRepository.upsertColorImage(env, {
      productId: id,
      color: validatedData.color,
      images: validatedData.images
    })

    // Log audit event
    await logAdminAction(
      env,
      request,
      userOrResponse.id,
      'UPDATE',
      'ProductColorImage',
      colorImage.id,
      `Updated color images for color "${validatedData.color}" on product "${product.name}"`
    )

    return NextResponse.json({
      success: true,
      data: colorImage,
      message: 'Color images updated successfully'
    })
  } catch (error) {
    console.error('Error updating color images:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update color images',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
