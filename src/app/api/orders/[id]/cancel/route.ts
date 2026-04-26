import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';

// Order statuses that can be cancelled
const CANCELLABLE_STATUSES = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

// Generate a unique request ID for tracking
function generateRequestId(): string {
  return crypto.randomUUID();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { userId, cancelledBy = 'user', reason } = body;

    // Validate that userId is provided for user-initiated cancellations
    if (cancelledBy === 'user' && !userId) {
      logger.warn('User ID required for user-initiated cancellation', { requestId });
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch order
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      logger.warn('Cancel order attempted for non-existent order', { orderId: params.id, requestId });
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Check if order is already cancelled
    if (order.status === OrderStatus.CANCELLED) {
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
      logger.logBusinessEvent('Order cancellation attempted but not allowed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        requestedBy: cancelledBy,
        requestId,
      });

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
        logger.logSecurityEvent('Unauthorized order cancellation attempt', 'HIGH', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId,
          requestId,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to cancel this order',
          },
          { status: 403 }
        );
      }
    }

    // Calculate refund amount (for COD, refund is just returning stock)
    let refundAmount = 0;
    if (order.paymentStatus === PaymentStatus.COMPLETED && order.paymentMethod !== 'CASH_ON_DELIVERY') {
      // For paid orders, refund the full order amount
      refundAmount = order.total;
    }

    // Restore product stock
    for (const item of order.orderItems) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      logger.logDatabaseOperation('Update', 'Product', {
        productId: item.productId,
        productName: item.product.name,
        quantityRestored: item.quantity,
        orderId: order.id,
      });
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: refundAmount > 0 ? PaymentStatus.REFUNDED : PaymentStatus.PENDING,
        cancelledAt: new Date(),
        cancelledBy,
        cancellationReason: reason || null,
        ...(refundAmount > 0 && {
          refundedAt: new Date(),
          refundedAmount: refundAmount,
          refundMethod: order.paymentMethod,
          refundReason: 'Order cancelled',
        }),
      },
      include: {
        orderItems: true,
        user: true,
      },
    });

    // Log business event
    logger.logBusinessEvent('Order cancelled', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      cancelledBy,
      reason,
      refundAmount,
      requestId,
    });

    // If refund was processed, log security event
    if (refundAmount > 0) {
      logger.logSecurityEvent('Order refund processed', 'MEDIUM', {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        refundAmount,
        refundMethod: order.paymentMethod,
        requestId,
      });
    }

    // TODO: Send notification email to customer about cancellation
    // await sendOrderCancellationEmail(updatedOrder);

    const duration = Date.now() - startTime;
    logger.logApiResponse(
      'POST',
      `/api/orders/${params.id}/cancel`,
      200,
      duration,
      userId,
      requestId,
      { orderId: order.id, orderNumber: order.orderNumber }
    );

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updatedOrder,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiError(
      'POST',
      `/api/orders/${params.id}/cancel`,
      error as Error,
      500,
      undefined,
      requestId,
      { orderId: params.id }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel order',
      },
      { status: 500 }
    );
  }
}
