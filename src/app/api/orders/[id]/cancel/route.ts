import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// Order statuses that can be cancelled
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get D1 database from request context
  const env = await getEnv();

  try {
    const body = await request.json() as any;
    const { userId, cancelledBy = 'user', reason } = body;

    // Validate that userId is provided for user-initiated cancellations
    if (cancelledBy === 'user' && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch order to check status and ownership
    const order = await OrderRepository.findById(env, (await params).id);
    
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Check if order is already cancelled
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is already cancelled',
        },
        { status: 400 }
      );
    }

    // Check if order can be cancelled
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel order in ${order.status} status`,
          message: 'Orders can only be cancelled when they are in PENDING or CONFIRMED status',
        },
        { status: 400 }
      );
    }

    // For user-initiated cancellations, verify ownership
    if (cancelledBy === 'user') {
      if (order.userId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to cancel this order',
          },
          { status: 403 }
        );
      }
    }

    // Cancel order with stock restoration in a transaction
    // This ensures atomicity - either stock is restored AND order is cancelled, or neither happens
    const cancelledOrder = await OrderRepository.cancelOrderWithRestock(
      env,
      (await params).id,
      cancelledBy,
      reason
    );

    if (!cancelledOrder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to cancel order. Please try again.',
        },
        { status: 500 }
      );
    }

    // TODO: Send notification email to customer about cancellation
    // await sendOrderCancellationEmail(cancelledOrder);

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: cancelledOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
