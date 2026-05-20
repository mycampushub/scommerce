import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/cloudflare';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const { id } = await params;
    const carrier = await IntegrationRepository.getShippingCarrierById(env, id);
    if (!carrier) {
      return notFoundResponse('Shipping carrier not found');
    }

    const safeCarrier = { ...carrier, apiSecret: carrier.apiSecret ? '********' : undefined };
    return successResponse(safeCarrier);
  } catch (error) {
    console.error('Error fetching shipping carrier:', error);
    return errorResponse('Failed to fetch shipping carrier');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const { id } = await params;
    const body = await request.json();
    const carrier = await IntegrationRepository.updateShippingCarrier(env, id, body);

    if (!carrier) {
      return notFoundResponse('Shipping carrier not found');
    }

    const safeCarrier = { ...carrier, apiSecret: carrier.apiSecret ? '********' : undefined };
    return successResponse(safeCarrier, 'Shipping carrier updated successfully');
  } catch (error) {
    console.error('Error updating shipping carrier:', error);
    return errorResponse('Failed to update shipping carrier');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv();
    const { id } = await params;
    await IntegrationRepository.deleteShippingCarrier(env, id);
    return successResponse(null, 'Shipping carrier deleted successfully');
  } catch (error) {
    console.error('Error deleting shipping carrier:', error);
    return errorResponse('Failed to delete shipping carrier');
  }
}
