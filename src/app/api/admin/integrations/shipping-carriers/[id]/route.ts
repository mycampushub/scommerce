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
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

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
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    await IntegrationRepository.deleteShippingCarrier(id);
    return NextResponse.json({ success: true, message: 'Shipping carrier deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping carrier:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete shipping carrier' }, { status: 500 });
  }
}
