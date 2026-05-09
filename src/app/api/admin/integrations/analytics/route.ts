import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';

/**
 * GET /api/admin/integrations/analytics
 * Get all analytics integrations (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin' && payload.role !== 'staff') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    const integrations = await IntegrationRepository.getAnalyticsIntegrations();
    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    console.error('Error fetching analytics integrations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics integrations' }, { status: 500 });
  }
}

/**
 * POST /api/admin/integrations/analytics
 * Create a new analytics integration (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin' && payload.role !== 'staff') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    const body = await request.json();

    if (!body.name || !body.provider) {
      return NextResponse.json({ success: false, error: 'Name and provider are required' }, { status: 400 });
    }

    const integration = await IntegrationRepository.createAnalyticsIntegration({
      name: body.name,
      provider: body.provider,
      trackingId: body.trackingId,
      apiKey: body.apiKey,
      pixelId: body.pixelId,
      isActive: body.isActive !== undefined ? body.isActive : true,
      settings: body.settings
    });

    return NextResponse.json({ success: true, data: integration, message: 'Analytics integration created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to create analytics integration' }, { status: 500 });
  }
}
