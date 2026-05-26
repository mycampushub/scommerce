import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/rate-limit';
import { getEnv } from '@/lib/cloudflare';
import { logAdminAction } from '@/lib/audit-logger';

/**
 * GET /api/admin/integrations/payment-gateways
 * Get all payment gateways (Admin only)
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const gateways = await IntegrationRepository.getPaymentGateways(env);

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
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Rate limiting: 20 requests per minute per admin
  const env = await getEnv()
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-payment-gateway-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.provider) {
      return NextResponse.json(
        { success: false, error: 'Name and provider are required' },
        { status: 400 }
      );
    }

    // If this is first gateway, make it default
    const existingGateways = await IntegrationRepository.getPaymentGateways(env);
    const isFirstGateway = existingGateways.length === 0;

    const gateway = await IntegrationRepository.createPaymentGateway(env, {
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      webhookUrl: body.webhookUrl,
      webhookSecret: body.webhookSecret || null,
      sandboxMode: body.sandboxMode || 0,
      supportedCurrencies: body.supportedCurrencies || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : isFirstGateway,
      settings: body.settings
    });

    // SECURITY: Mask sensitive credentials in response
    const safeGateway = {
      ...gateway,
      apiKey: gateway.apiKey ? gateway.apiKey.substring(0, 4) + '****' : undefined,
      apiSecret: gateway.apiSecret ? '********' : undefined,
      webhookSecret: gateway.webhookSecret ? '********' : undefined,
    };

    // Log audit event
    const admin = userOrResponse as { id: string };
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'AdminLog',
      gateway.id,
      `Created payment gateway "${gateway.name}" (provider: ${gateway.provider})`
    );

    return NextResponse.json({
      success: true,
      data: safeGateway,
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
