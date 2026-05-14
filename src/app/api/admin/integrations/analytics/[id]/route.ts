import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    const analytics = await IntegrationRepository.getAnalyticsIntegrationById(id);
    if (!analytics) {
      return notFoundResponse('Analytics integration not found');
    }

    const safeAnalytics = { ...analytics, apiKey: analytics.apiKey ? '********' : undefined };
    return successResponse(safeAnalytics);
  } catch (error) {
    console.error('Error fetching analytics integration:', error);
    return errorResponse('Failed to fetch analytics integration');
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

    if (!analytics) {
      return notFoundResponse('Analytics integration not found');
    }

    const safeAnalytics = { ...analytics, apiKey: analytics.apiKey ? '********' : undefined };
    return successResponse(safeAnalytics, 'Analytics integration updated successfully');
  } catch (error) {
    console.error('Error updating analytics integration:', error);
    return errorResponse('Failed to update analytics integration');
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
    return successResponse(null, 'Analytics integration deleted successfully');
  } catch (error) {
    console.error('Error deleting analytics integration:', error);
    return errorResponse('Failed to delete analytics integration');
  }
}
