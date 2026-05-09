import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';

/**
 * GET /api/admin/integrations/payment-gateways
 * Get all payment gateways (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
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

    if (!payload || payload.role !== 'admin' && payload.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const gateways = await IntegrationRepository.getPaymentGateways();

    // Mask API secrets for security
    const safeGateways = gateways.map(gw => ({
      ...gw,
      apiSecret: gw.apiSecret ? '********' : undefined
    }));

    return NextResponse.json({
      success: true,
      data: safeGateways
    });
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment gateways'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations/payment-gateways
 * Create a new payment gateway (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
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

    if (!payload || payload.role !== 'admin' && payload.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.provider) {
      return NextResponse.json(
        { success: false, error: 'Name and provider are required' },
        { status: 400 }
      );
    }

    // If this is the first gateway, make it default
    const existingGateways = await IntegrationRepository.getPaymentGateways();
    const isFirstGateway = existingGateways.length === 0;

    const gateway = await IntegrationRepository.createPaymentGateway({
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      webhookUrl: body.webhookUrl,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : isFirstGateway,
      settings: body.settings
    });

    return NextResponse.json({
      success: true,
      data: gateway,
      message: 'Payment gateway created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment gateway:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create payment gateway'
      },
      { status: 500 }
    );
  }
}
