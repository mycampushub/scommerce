import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { logAdminAction } from '@/lib/audit-logger'

/**
 * POST /api/admin/products/sync-variants
 * Sync hasVariants flag for all products based on actual variants
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()

    // Sync hasVariants flag for all products
    const result = await ProductRepository.syncAllHasVariants(env)

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'BULK_UPDATE',
      'Product',
      undefined,
      `Synced hasVariants flag for ${result.updated} products`
    )

    return NextResponse.json({
      success: true,
      message: `Successfully synced hasVariants flag for ${result.updated} products`,
      data: {
        updated: result.updated
      }
    })
  } catch (error: any) {
    console.error('Error syncing hasVariants flags:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync hasVariants flags'
      },
      { status: 500 }
    )
  }
}
