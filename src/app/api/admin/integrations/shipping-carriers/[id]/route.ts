import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    const carrier = await IntegrationRepository.getShippingCarrierById(id);
    if (!carrier) return NextResponse.json({ success: false, error: 'Shipping carrier not found' }, { status: 404 });

    const safeCarrier = { ...carrier, apiSecret: carrier.apiSecret ? '********' : undefined };
    return NextResponse.json({ success: true, data: safeCarrier });
  } catch (error) {
    console.error('Error fetching shipping carrier:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shipping carrier' }, { status: 500 });
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
    const carrier = await IntegrationRepository.updateShippingCarrier(id, body);

    if (!carrier) return NextResponse.json({ success: false, error: 'Shipping carrier not found' }, { status: 404 });

    const safeCarrier = { ...carrier, apiSecret: carrier.apiSecret ? '********' : undefined };
    return NextResponse.json({ success: true, data: safeCarrier, message: 'Shipping carrier updated successfully' });
  } catch (error) {
    console.error('Error updating shipping carrier:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shipping carrier' }, { status: 500 });
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
    await IntegrationRepository.deleteShippingCarrier(id);
    return NextResponse.json({ success: true, message: 'Shipping carrier deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping carrier:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete shipping carrier' }, { status: 500 });
  }
}
