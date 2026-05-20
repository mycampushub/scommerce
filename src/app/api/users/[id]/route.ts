import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response'
import { getEnv } from '@/lib/cloudflare'
import { execute, queryFirst, queryAll } from '@/db/db'

/**
 * DELETE /api/users/[id]
 * Delete a user account (GDPR-compliant)
 * - Admin only endpoint
 * - Soft delete by default (sets isActive = false)
 * - Hard delete available with query param ?hard=true
 * - Cannot delete users with active orders
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const userId = (await params).id
  const env = await getEnv()
  const hardDelete = request.nextUrl.searchParams.get('hard') === 'true'

  try {
    // Check if user exists
    const user = await queryFirst<{ id: string; email: string; name: string; isBanned: boolean }>(
      env,
      'SELECT id, email, name, isBanned FROM users WHERE id = ? LIMIT 1',
      userId
    )

    if (!user) {
      return notFoundResponse('User not found')
    }

    // Check if user has active orders
    const countResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM orders
       WHERE userId = ? AND status NOT IN ('DELIVERED', 'CANCELLED', 'REFUNDED')`,
      userId
    )
    const activeOrderCount = countResult?.count || 0

    if (activeOrderCount > 0) {
      return errorResponse(
        `Cannot delete user with ${activeOrderCount} active order(s). Please cancel or complete the orders first.`,
        400
      )
    }

    // Hard delete: permanently remove all user data
    if (hardDelete) {
      // Anonymize orders (keep order records but remove user reference)
      await execute(
        env,
        'UPDATE orders SET userId = NULL WHERE userId = ?',
        userId
      )

      // Delete user's cart items
      await execute(env, 'DELETE FROM cart_items WHERE userId = ?', userId)

      // Delete user's addresses
      await execute(env, 'DELETE FROM addresses WHERE userId = ?', userId)

      // Delete user's reviews
      await execute(env, 'DELETE FROM product_reviews WHERE userId = ?', userId)

      // Delete user's inventory reservations
      await execute(env, 'DELETE FROM inventory_reservations WHERE userId = ?', userId)

      // Delete the user record
      await execute(env, 'DELETE FROM users WHERE id = ?', userId)

      return successResponse(
        { deleted: true, type: 'hard' },
        'User permanently deleted (GDPR compliance)'
      )
    }

    // Soft delete: just deactivate the account (using isBanned flag)
    await execute(env, 'UPDATE users SET isBanned = 1 WHERE id = ?', userId)

    return successResponse(
      { deleted: true, type: 'soft' },
      'User account deactivated. Use ?hard=true to permanently delete.'
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return errorResponse('Failed to delete user', 500)
  }
}
