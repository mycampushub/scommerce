import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { ProductRepository } from '@/db/product.repository';
import { execute, parseJSON } from '@/db/db';

export const runtime = 'edge';

// Order statuses that can be cancelled
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get D1 database from request context
  const env = getEnv(request);

  try {
    const body = await request.json();
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

    // Fetch order with items and products
    const order = await OrderRepository.findById(env, params.id);
    
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

    // Restore product stock
    const orderItems = await OrderRepository.getItems(env, params.id);
    for (const item of orderItems) {
      if (item.variantId) {
        // Restore variant stock
        await ProductRepository.updateVariantStock(env, item.variantId, (item.variantStock || 0) + item.quantity);
      } else {
        // Restore product stock
        await ProductRepository.updateProductStock(env, item.productId, (item.productStock || 0) + item.quantity);
      }
    }

    // Cancel order
    const updatedOrder = await OrderRepository.cancel(env, params.id, cancelledBy, reason);

    // TODO: Send notification email to customer about cancellation
    // await sendOrderCancellationEmail(updatedOrder);

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel order',
      },
      { status: 500 }
    );
  }
}
