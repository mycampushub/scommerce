import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    const integration = await IntegrationRepository.getAnalyticsIntegrationById(id);
    if (!integration) return NextResponse.json({ success: false, error: 'Analytics integration not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: integration });
  } catch (error) {
    console.error('Error fetching analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics integration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const integration = await IntegrationRepository.updateAnalyticsIntegration(id, body);

    if (!integration) return NextResponse.json({ success: false, error: 'Analytics integration not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: integration, message: 'Analytics integration updated successfully' });
  } catch (error) {
    console.error('Error updating analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to update analytics integration' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    await IntegrationRepository.deleteAnalyticsIntegration(id);
    return NextResponse.json({ success: true, message: 'Analytics integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete analytics integration' }, { status: 500 });
  }
}
