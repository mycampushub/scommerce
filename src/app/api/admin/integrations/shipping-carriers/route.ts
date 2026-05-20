import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/rate-limit';
import { getEnv } from '@/lib/cloudflare';

/**
 * GET /api/admin/integrations/shipping-carriers
 * Get all shipping carriers (Admin only)
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const carriers = await IntegrationRepository.getShippingCarriers(env);

    // Mask API secrets for security
    const safeCarriers = carriers.map(carrier => ({
      ...carrier,
      apiSecret: carrier.apiSecret ? '********' : undefined
    }));

    return NextResponse.json({
      success: true,
      data: safeCarriers
    });
  } catch (error) {
    console.error('Error fetching shipping carriers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shipping carriers'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations/shipping-carriers
 * Create a new shipping carrier (Admin only)
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
  const rateLimitKey = `admin-shipping-carrier-create:${clientIp}`
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

    // If this is first carrier, make it default
    const existingCarriers = await IntegrationRepository.getShippingCarriers(env);
    const isFirstCarrier = existingCarriers.length === 0;

    const carrier = await IntegrationRepository.createShippingCarrier(env, {
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      accountNumber: body.accountNumber,
      webhookUrl: body.webhookUrl,
      sandboxMode: body.sandboxMode || 0,
      shippingMethods: body.shippingMethods || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : isFirstCarrier,
      settings: body.settings
    });

    return NextResponse.json({
      success: true,
      data: carrier,
      message: 'Shipping carrier created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping carrier:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create shipping carrier'
      },
      { status: 500 }
    );
  }
}
