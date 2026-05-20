import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getEnv } from '@/lib/cloudflare';

/**
 * POST /api/admin/integrations/payment-gateways/[id]/set-default
 * Set as default payment gateway (Admin only)
 */
export async function POST(
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
    await IntegrationRepository.setDefaultPaymentGateway(env, id);

    return NextResponse.json({
      success: true,
      message: 'Payment gateway set as default'
    });
  } catch (error) {
    console.error('Error setting default payment gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set default payment gateway'
      },
      { status: 500 }
    );
  }
}
