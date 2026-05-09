import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    const analytics = await IntegrationRepository.getAnalyticsIntegrationById(id);
    if (!analytics) return NextResponse.json({ success: false, error: 'Analytics integration not found' }, { status: 404 });

    const safeAnalytics = { ...analytics, apiKey: analytics.apiKey ? '********' : undefined };
    return NextResponse.json({ success: true, data: safeAnalytics });
  } catch (error) {
    console.error('Error fetching analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics integration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const analytics = await IntegrationRepository.updateAnalyticsIntegration(id, body);

    if (!analytics) return NextResponse.json({ success: false, error: 'Analytics integration not found' }, { status: 404 });

    const safeAnalytics = { ...analytics, apiKey: analytics.apiKey ? '********' : undefined };
    return NextResponse.json({ success: true, data: safeAnalytics, message: 'Analytics integration updated successfully' });
  } catch (error) {
    console.error('Error updating analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to update analytics integration' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    await IntegrationRepository.deleteAnalyticsIntegration(id);
    return NextResponse.json({ success: true, message: 'Analytics integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting analytics integration:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete analytics integration' }, { status: 500 });
  }
}
