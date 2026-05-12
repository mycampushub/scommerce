import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, queryAll, execute } from '@/db/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const { id } = await params

    // Check if product exists
    const product = await queryFirst<any>(
      env,
      'SELECT id FROM products WHERE id = ? LIMIT 1',
      id
    )

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      )
    }

    // Check if product has orders
    const orderItems = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM order_items WHERE productId = ? LIMIT 1',
      id
    )

    if (orderItems && orderItems.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product: It has associated orders. Please delete or archive orders first.',
        },
        { status: 400 }
      )
    }

    // Check for inventory alerts
    const inventoryAlerts = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM inventory_alerts WHERE productId = ? LIMIT 1',
      id
    )

    if (inventoryAlerts && inventoryAlerts.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete product: It has associated inventory alerts.',
        },
        { status: 400 }
      )
    }

    // Delete related data first
    await execute(env, 'DELETE FROM product_variants WHERE productId = ?', id)
    await execute(env, 'DELETE FROM order_items WHERE productId = ?', id)
    await execute(env, 'DELETE FROM cart_items WHERE productId = ?', id)
    await execute(env, 'DELETE FROM wishlist_items WHERE productId = ?', id)
    await execute(env, 'DELETE FROM product_reviews WHERE productId = ?', id)
    await execute(env, 'DELETE FROM inventory_alerts WHERE productId = ?', id)

    // Delete product
    await execute(env, 'DELETE FROM products WHERE id = ?', id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
      },
      { status: 500 }
    )
  }
}
