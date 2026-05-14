import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { OrderRepository } from '@/db/order.repository'
import type {
  ArchiveApiResponse,
  ArchiveApiRequest,
  ArchiveResponse,
  CleanupResponse,
  BothResponse,
  StatsResponse
} from './types'

/**
 * POST /api/admin/orders/archive
 * Trigger order archival and cleanup operations
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const body = await request.json().catch(() => ({})) as Partial<ArchiveApiRequest>

    const operation = body.operation || 'archive'
    const olderThanDays = body.olderThanDays || 180

    let result: ArchiveApiResponse

    switch (operation) {
      case 'archive': {
        // Archive old completed orders
        const archived = await OrderRepository.archiveOldOrders(env, olderThanDays)
        result = { archived }
        break
      }

      case 'cleanup': {
        // Permanently delete old archived orders
        const cleaned = await OrderRepository.cleanupDeletedOrders(env, olderThanDays)
        result = { cleaned }
        break
      }

      case 'both': {
        // Run both operations
        const archived = await OrderRepository.archiveOldOrders(env, body.archiveOlderThanDays || 180)
        const cleaned = await OrderRepository.cleanupDeletedOrders(env, body.cleanupOlderThanDays || 365)
        result = { archived, cleaned }
        break
      }

      case 'stats': {
        // Get archival statistics
        const archivedCount = await OrderRepository.getArchivedCount(env)
        result = { archivedCount }
        break
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid operation. Use: archive, cleanup, both, or stats',
          },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Order ${operation} completed successfully`,
    })
  } catch (error) {
    console.error('Error in order archival/cleanup:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform order archival/cleanup',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/orders/archive
 * Get archival statistics
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const archivedCount = await OrderRepository.getArchivedCount(env)

    return NextResponse.json({
      success: true,
      data: {
        archivedCount,
      },
    })
  } catch (error) {
    console.error('Error fetching archival stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch archival statistics',
      },
      { status: 500 }
    )
  }
}
