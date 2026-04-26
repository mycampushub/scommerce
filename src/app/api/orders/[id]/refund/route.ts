import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { z } from 'zod';

// Generate a unique request ID for tracking
function generateRequestId(): string {
  return crypto.randomUUID();
}

// Validation schema for refund request
const refundRequestSchema = z.object({
  userId: z.string().optional(), // Optional if admin is processing
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters'),
  refundMethod: z.string().min(1, 'Refund method is required'),
  initiatedBy: z.enum(['user', 'admin']).default('user'),
});

// Order statuses eligible for refund
const REFUNDABLE_STATUSES = [
  OrderStatus.DELIVERED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validate input
    const validation = refundRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Invalid refund request', { requestId, errors: validation.error.errors });
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { userId, amount, reason, refundMethod, initiatedBy } = validation.data;

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
      logger.warn('Refund requested for non-existent order', { orderId: params.id, requestId });
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // Check if order already refunded
    if (order.status === OrderStatus.REFUNDED || order.refundedAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order has already been refunded',
        },
        { status: 400 }
      );
    }

    // Check if order status allows refund
    if (!REFUNDABLE_STATUSES.includes(order.status) && order.status !== OrderStatus.CANCELLED) {
      logger.warn('Refund attempted for non-eligible order status', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        requestId,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Cannot refund order in ${order.status} status`,
          message: 'Refunds can only be processed for delivered, shipped, processing, or cancelled orders',
        },
        { status: 400 }
      );
    }

    // For user-initiated refunds, verify ownership
    if (initiatedBy === 'user') {
      if (!userId) {
        logger.warn('User ID required for user-initiated refund', { requestId });
        return NextResponse.json(
          {
            success: false,
            error: 'User ID is required',
          },
          { status: 400 }
        );
      }

      if (order.userId !== userId) {
        logger.logSecurityEvent('Unauthorized refund attempt', 'HIGH', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId,
          requestId,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to request a refund for this order',
          },
          { status: 403 }
        );
      }

      // For user-initiated refunds, check if order is delivered
      if (order.status !== OrderStatus.DELIVERED) {
        return NextResponse.json(
          {
            success: false,
            error: 'Refunds can only be requested for delivered orders',
            message: 'For orders in other statuses, please contact customer support',
          },
          { status: 400 }
        );
      }
    }

    // Validate refund amount
    if (amount > order.total) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refund amount cannot exceed order total',
          data: {
            orderTotal: order.total,
            requestedAmount: amount,
          },
        },
        { status: 400 }
      );
    }

    // Check if COD order (no actual payment to refund)
    if (order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus === PaymentStatus.PENDING) {
      logger.info('Refund requested for COD order (no actual payment)', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        requestId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Cannot refund COD order as no payment has been made',
          message: 'For COD orders that have not been delivered, please use the cancel option',
        },
        { status: 400 }
      );
    }

    // Restore product stock if order is being refunded before delivery
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
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
          reason: 'refund',
        });
      }
    }

    // Process refund
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundedAmount: amount,
        refundMethod,
        refundReason: reason,
      },
      include: {
        orderItems: true,
        user: true,
      },
    });

    // Log business event
    logger.logBusinessEvent('Order refund processed', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      initiatedBy,
      amount,
      reason,
      requestId,
    });

    // Log security event for refunds
    logger.logSecurityEvent('Order refund processed', 'MEDIUM', {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      refundAmount: amount,
      refundMethod,
      initiatedBy,
      requestId,
    });

    // TODO: Send notification email to customer about refund
    // await sendRefundConfirmationEmail(updatedOrder);

    // TODO: If using a payment gateway, initiate actual refund
    // For Stripe:
    // await stripe.refunds.create({
    //   payment_intent: order.paymentIntentId,
    //   amount: Math.round(amount * 100), // Convert to cents
    //   reason: 'requested_by_customer',
    // });

    const duration = Date.now() - startTime;
    logger.logApiResponse(
      'POST',
      `/api/orders/${params.id}/refund`,
      200,
      duration,
      userId,
      requestId,
      { orderId: order.id, orderNumber: order.orderNumber, refundAmount: amount }
    );

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        refundAmount: amount,
        refundMethod,
        refundedAt: updatedOrder.refundedAt,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiError(
      'POST',
      `/api/orders/${params.id}/refund`,
      error as Error,
      500,
      undefined,
      requestId,
      { orderId: params.id }
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process refund',
      },
      { status: 500 }
    );
  }
}
