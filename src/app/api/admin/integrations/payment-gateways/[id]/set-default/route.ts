import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';

/**
 * POST /api/admin/integrations/payment-gateways/[id]/set-default
 * Set as default payment gateway (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await IntegrationRepository.setDefaultPaymentGateway(id);

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
