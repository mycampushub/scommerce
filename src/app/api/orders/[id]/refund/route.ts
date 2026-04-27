import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { ProductRepository } from '@/db/product.repository';
import { z } from 'zod';

export const runtime = 'edge';

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
  'DELIVERED',
  'PROCESSING',
  'SHIPPED',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get D1 database from request context
  const env = getEnv(request);

  try {
    const body = await request.json();

    // Validate input
    const validation = refundRequestSchema.safeParse(body);
    if (!validation.success) {
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

    // Check if order already refunded
    if (order.status === 'REFUNDED' || order.refundedAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order has already been refunded',
        },
        { status: 400 }
      );
    }

    // Check if order status allows refund
    if (!REFUNDABLE_STATUSES.includes(order.status) && order.status !== 'CANCELLED') {
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
        return NextResponse.json(
          {
            success: false,
            error: 'User ID is required',
          },
          { status: 400 }
        );
      }

      if (order.userId !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to request a refund for this order',
          },
          { status: 403 }
        );
      }

      // For user-initiated refunds, check if order is delivered
      if (order.status !== 'DELIVERED') {
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
    if (order.paymentMethod === 'CASH_ON_DELIVERY' && order.paymentStatus === 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot refund COD order as no payment has been made',
          message: 'For COD orders that have not been delivered, please use cancel option',
        },
        { status: 400 }
      );
    }

    // Restore product stock if order is being refunded before delivery
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
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
    }

    // Process refund
    const updatedOrder = await OrderRepository.refund(env, params.id, amount, refundMethod, reason);

    // TODO: Send notification email to customer about refund
    // await sendRefundConfirmationEmail(updatedOrder);

    // TODO: If using a payment gateway, initiate actual refund
    // For Stripe:
    // await stripe.refunds.create({
    //   payment_intent: order.paymentIntentId,
    //   amount: Math.round(amount * 100), // Convert to cents
    //   reason: 'requested_by_customer',
    // });

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
    console.error('Error processing refund:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process refund',
      },
      { status: 500 }
    );
  }
}
