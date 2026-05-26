import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { OrderRepository } from '@/db/order.repository';
import { ProductRepository } from '@/db/product.repository';
import { z } from 'zod';
import { queryFirst, execute } from '@/db/db';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { UserRepository } from '@/db/user.repository';
import { runTransaction } from '@/lib/transaction';


// Validation schema for refund request - NOTE: initiatedBy is NOT allowed in request body
// It is determined from authentication token to prevent auth bypass
const refundRequestSchema = z.object({
  userId: z.string().optional(), // Optional if admin is processing
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(10, 'Refund reason must be at least 10 characters'),
  refundMethod: z.string().min(1, 'Refund method is required'),
});

// Order statuses eligible for refund
const REFUNDABLE_STATUSES = [
  'DELIVERED',
  'PROCESSING',
  'SHIPPED',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get D1 database from request context
  const env = await getEnv();

  // ============================================
  // AUTHENTICATION & AUTHORIZATION
  // ============================================
  
  // Try admin auth first (allows admin/staff to process refunds)
  const adminAuth = await verifyAdminAuth(request, ['admin', 'staff']);
  let initiatedBy: 'user' | 'admin' = 'user';
  let authenticatedUserId: string | null = null;
  let userRole: string | null = null;

  if (!(adminAuth instanceof NextResponse)) {
    // Admin authentication successful
    initiatedBy = 'admin';
    authenticatedUserId = adminAuth.id;
    userRole = adminAuth.role;
  } else {
    // Admin auth failed, try user auth (customers can request refunds for their own orders)
    const authHeader = request.headers.get('authorization');
    let token = extractTokenFromHeader(authHeader);

    // If no Authorization header, check session cookie
    if (!token) {
      token = request.cookies.get('session')?.value ?? null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await UserRepository.findById(env, payload.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    initiatedBy = 'user';
    authenticatedUserId = user.id;
    userRole = user.role;
  }

  try {
    const body = await request.json() as any;

    // Validate input
    const validation = refundRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { userId, amount, reason, refundMethod } = validation.data;
    
    // For user-initiated refunds, userId from body must match authenticated user
    // For admin-initiated refunds, userId can be overridden in body or use authenticated admin's user context
    const effectiveUserId = initiatedBy === 'user' ? authenticatedUserId : (userId || authenticatedUserId);

    // Fetch order
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
      if (order.userId !== effectiveUserId) {
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

    // Validate refund amount - check cumulative refunds to prevent over-refunding
    const existingRefundedAmount = order.refundedAmount || 0;
    const totalRefundedAfter = existingRefundedAmount + amount;

    if (totalRefundedAfter > order.total) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total refund amount would exceed order total',
          data: {
            orderTotal: order.total,
            alreadyRefunded: existingRefundedAmount,
            requestedAmount: amount,
            totalAfterRefund: totalRefundedAfter,
            remainingRefundable: order.total - existingRefundedAmount,
          },
        },
        { status: 400 }
      );
    }

    // Check if order is already fully refunded
    if (existingRefundedAmount >= order.total) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order has already been fully refunded',
          data: {
            orderTotal: order.total,
            alreadyRefunded: existingRefundedAmount,
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
    // Use atomic increment within a transaction to prevent race conditions
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      const result = await runTransaction(async (db, commit, rollback) => {
        try {
          // Fetch order items within transaction for consistency
          const orderItemsStmt = db.prepare('SELECT * FROM order_items WHERE orderId = ?').bind([order.id]);
          const orderItemsResult = await orderItemsStmt.all();
          const orderItems = orderItemsResult.results as any[];

          // Restore stock for each item using atomic increment
          for (const item of orderItems) {
            if (item.variantId) {
              // ATOMIC stock restore - prevents double-restore race condition
              const updateVariantStmt = db.prepare(
                'UPDATE product_variants SET stock = stock + ? WHERE id = ?'
              ).bind([item.quantity, item.variantId]);
              await updateVariantStmt.run();
            } else {
              // ATOMIC stock restore - prevents double-restore race condition
              const updateProductStmt = db.prepare(
                'UPDATE products SET stock = stock + ? WHERE id = ?'
              ).bind([item.quantity, item.productId]);
              await updateProductStmt.run();
            }
          }

          await commit();
          return { success: true };
        } catch (error) {
          console.error('Error in stock restore transaction:', error);
          await rollback();
          throw error;
        }
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to restore stock during refund',
        }, { status: 500 });
      }
    }

    // Process refund - pass cumulative refund amount
    const updatedOrder = await OrderRepository.refund(env, (await params).id, totalRefundedAfter, refundMethod, reason);

    if (!updatedOrder) {
      return NextResponse.json({
        success: false,
        error: 'Failed to process refund',
      }, { status: 500 });
    }

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
        totalRefunded: totalRefundedAfter,
        previousRefunded: existingRefundedAmount,
        refundMethod,
        refundedAt: updatedOrder.refundedAt,
        initiatedBy, // Return who initiated the refund
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
