import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { logAdminAction } from '@/lib/audit-logger'

/**
 * DELETE /api/admin/products/[id]/color-images/[colorImageId]
 * Delete a specific color image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; colorImageId: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const { id, colorImageId } = await params

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Get color image before deletion for logging
    const colorImages = await ProductRepository.getColorImages(env, id)
    const colorImageToDelete = colorImages.find(ci => ci.id === colorImageId)

    if (!colorImageToDelete) {
      return NextResponse.json(
        { success: false, error: 'Color image not found' },
        { status: 404 }
      )
    }

    // Delete color image
    await ProductRepository.deleteColorImage(env, colorImageId)

    // Log audit event
    await logAdminAction(
      env,
      request,
      userOrResponse.id,
      'DELETE',
      'ProductColorImage',
      colorImageId,
      `Deleted color images for color "${colorImageToDelete.color}" from product "${product.name}"`
    )

    return NextResponse.json({
      success: true,
      message: 'Color image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting color image:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete color image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
