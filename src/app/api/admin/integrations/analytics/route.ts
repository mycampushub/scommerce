import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';

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
    const analytics = await IntegrationRepository.getAnalyticsIntegrations();

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

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.provider) {
      return NextResponse.json(
        { success: false, error: 'Name and provider are required' },
        { status: 400 }
      );
    }

    const analytics = await IntegrationRepository.createAnalyticsIntegration({
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      trackingId: body.trackingId,
      pixelId: body.pixelId,
      isActive: body.isActive !== undefined ? body.isActive : true,
      settings: body.settings
    });

    return NextResponse.json({
      success: true,
      data: analytics,
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
