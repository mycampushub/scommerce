import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { ProductRepository } from '@/db/product.repository';
import { execute, parseJSON, queryFirst } from '@/db/db';
import { csrfMiddleware } from '@/lib/csrf';
import { logger } from '@/lib/logger';


// Order statuses that can be cancelled
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get D1 database from request context
  const env = getEnv();

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env);
  if (csrfError) {
    return csrfError;
  }

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

    // Fetch order with items and products
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

    // Restore product stock
    const orderItems = await OrderRepository.getItems(env, (await params).id);
    for (const item of orderItems) {
      if (item.variantId) {
        // Get current variant stock
        const variant = await queryFirst<{ stock: number }>(
          env,
          'SELECT stock FROM product_variants WHERE id = ?',
          item.variantId
        );
        const currentStock = variant?.stock || 0;
        // Restore variant stock
        await ProductRepository.updateVariantStock(env, item.variantId, currentStock + item.quantity);
      } else {
        // Get current product stock
        const product = await queryFirst<{ stock: number }>(
          env,
          'SELECT stock FROM products WHERE id = ?',
          item.productId
        );
        const currentStock = product?.stock || 0;
        // Restore product stock
        await ProductRepository.updateProductStock(env, item.productId, currentStock + item.quantity);
      }
    }

    // Update order status to cancelled
    const now = new Date().toISOString();
    await execute(
      env,
      'UPDATE orders SET status = ?, cancelledAt = ?, cancelledBy = ?, cancellationReason = ? WHERE id = ?',
      ['CANCELLED', now, cancelledBy, reason || null, (await params).id]
    );

    // Fetch updated order
    const updatedOrder = await OrderRepository.findById(env, (await params).id);

    // Log cancellation
    logger.logBusinessEvent('Order cancelled', {
      orderId: (await params).id,
      cancelledBy,
      reason,
    });

    // TODO: Send notification email to customer about cancellation
    // Email service integration needed. Options:
    // - Resend: https://resend.com
    // - SendGrid: https://sendgrid.com
    // - Cloudflare Email Routing: https://developers.cloudflare.com/email-routing
    // await sendOrderCancellationEmail(updatedOrder);

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    logger.logApiError('POST', `/api/orders/${(await params).id}/cancel`, error as Error, 500, undefined, undefined, {
      action: 'cancel_order',
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel order',
      },
      { status: 500 }
    );
  }
}
