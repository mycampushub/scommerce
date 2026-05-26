import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/rate-limit';
import { getEnv } from '@/lib/cloudflare';
import { logAdminAction } from '@/lib/audit-logger';

/**
 * GET /api/admin/integrations/analytics
 * Get all analytics integrations (Admin only)
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const analytics = await IntegrationRepository.getAnalyticsIntegrations(env);

    // Mask API keys for security
    const safeAnalytics = analytics.map(integration => ({
      ...integration,
      apiKey: integration.apiKey ? '********' : undefined
    }));

    return NextResponse.json({
      success: true,
      data: safeAnalytics
    });
  } catch (error) {
    console.error('Error fetching analytics integrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics integrations'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations/analytics
 * Create a new analytics integration (Admin only)
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
  const rateLimitKey = `admin-analytics-integration-create:${clientIp}`
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

    const analytics = await IntegrationRepository.createAnalyticsIntegration(env, {
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      trackingId: body.trackingId,
      pixelId: body.pixelId,
      isActive: body.isActive !== undefined ? body.isActive : true,
      settings: body.settings
    });

    // SECURITY: Mask sensitive credentials in response
    const safeAnalytics = {
      ...analytics,
      apiKey: analytics.apiKey ? analytics.apiKey.substring(0, 4) + '****' : undefined,
    };

    // Log audit event
    const admin = userOrResponse as { id: string };
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'AdminLog',
      analytics.id,
      `Created analytics integration "${analytics.name}" (provider: ${analytics.provider})`
    );

    return NextResponse.json({
      success: true,
      data: safeAnalytics,
      message: 'Analytics integration created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating analytics integration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create analytics integration'
      },
      { status: 500 }
    );
  }
}
