import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { getEnv } from '@/lib/cloudflare'
import { execute, queryAll, queryFirst } from '@/db/db'
import { cleanupExpiredReservations } from '@/db/inventory-reservation.repository'

/**
 * POST /api/admin/cleanup/expired-reservations
 * Manually trigger cleanup of expired inventory reservations
 * - Admin only endpoint
 * - Can also be called by a cron job
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    // Use the existing cleanup function
    const cleanedCount = await cleanupExpiredReservations(env)

    return successResponse(
      {
        cleanedCount,
        timestamp: new Date().toISOString(),
      },
      `Cleaned up ${cleanedCount} expired reservation(s)`
    )
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error)
    return errorResponse('Failed to clean up expired reservations', 500)
  }
}

/**
 * GET /api/admin/cleanup/expired-reservations
 * Get count of expired reservations (not yet cleaned)
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const now = new Date().toISOString()

    const result = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM inventory_reservations WHERE expiresAt < ?',
      now
    )
    const expiredCount = result?.count || 0

    return successResponse({
      expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching expired reservation count:', error)
    return errorResponse('Failed to fetch expired reservation count', 500)
  }
}
