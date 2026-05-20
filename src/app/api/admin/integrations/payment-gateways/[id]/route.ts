import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';

/**
 * GET /api/admin/integrations/payment-gateways/[id]
 * Get a specific payment gateway (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const { id } = await params;
    const gateway = await IntegrationRepository.getPaymentGatewayById(env, id);

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not found' },
        { status: 404 }
      );
    }

    // Mask API secret for security
    const safeGateway = {
      ...gateway,
      apiSecret: gateway.apiSecret ? '********' : undefined
    };

    return NextResponse.json({
      success: true,
      data: safeGateway
    });
  } catch (error) {
    console.error('Error fetching payment gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment gateway'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/integrations/payment-gateways/[id]
 * Update a payment gateway (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const { id } = await params;
    const body = await request.json();

    const gateway = await IntegrationRepository.updatePaymentGateway(env, id, body);

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not found' },
        { status: 404 }
      );
    }

    // Mask API secret for security
    const safeGateway = {
      ...gateway,
      apiSecret: gateway.apiSecret ? '********' : undefined
    };

    return NextResponse.json({
      success: true,
      data: safeGateway,
      message: 'Payment gateway updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payment gateway'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/integrations/payment-gateways/[id]
 * Delete a payment gateway (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const { id } = await params;
    await IntegrationRepository.deletePaymentGateway(env, id);

    return NextResponse.json({
      success: true,
      message: 'Payment gateway deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete payment gateway'
      },
      { status: 500 }
    );
  }
}
