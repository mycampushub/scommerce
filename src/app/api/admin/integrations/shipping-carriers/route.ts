import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';

/**
 * GET /api/admin/integrations/shipping-carriers
 * Get all shipping carriers (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin' && payload.role !== 'staff') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const carriers = await IntegrationRepository.getShippingCarriers();
    const safeCarriers = carriers.map(c => ({ ...c, apiSecret: c.apiSecret ? '********' : undefined }));

    return NextResponse.json({ success: true, data: safeCarriers });
  } catch (error) {
    console.error('Error fetching shipping carriers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shipping carriers' }, { status: 500 });
  }
}

/**
 * POST /api/admin/integrations/shipping-carriers
 * Create a new shipping carrier (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin' && payload.role !== 'staff') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name || !body.provider) {
      return NextResponse.json({ success: false, error: 'Name and provider are required' }, { status: 400 });
    }

    const existing = await IntegrationRepository.getShippingCarriers();
    const isFirst = existing.length === 0;

    const carrier = await IntegrationRepository.createShippingCarrier({
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      accountNumber: body.accountNumber,
      webhookUrl: body.webhookUrl,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : isFirst,
      settings: body.settings
    });

    return NextResponse.json({ success: true, data: carrier, message: 'Shipping carrier created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping carrier:', error);
    return NextResponse.json({ success: false, error: 'Failed to create shipping carrier' }, { status: 500 });
  }
}
