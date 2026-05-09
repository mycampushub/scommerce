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

    const service = await IntegrationRepository.getEmailServiceById(id);
    if (!service) return NextResponse.json({ success: false, error: 'Email service not found' }, { status: 404 });

    const safeService = { ...service, apiSecret: service.apiSecret ? '********' : undefined };
    return NextResponse.json({ success: true, data: safeService });
  } catch (error) {
    console.error('Error fetching email service:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch email service' }, { status: 500 });
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
    const service = await IntegrationRepository.updateEmailService(id, body);

    if (!service) return NextResponse.json({ success: false, error: 'Email service not found' }, { status: 404 });

    const safeService = { ...service, apiSecret: service.apiSecret ? '********' : undefined };
    return NextResponse.json({ success: true, data: safeService, message: 'Email service updated successfully' });
  } catch (error) {
    console.error('Error updating email service:', error);
    return NextResponse.json({ success: false, error: 'Failed to update email service' }, { status: 500 });
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

    await IntegrationRepository.deleteEmailService(id);
    return NextResponse.json({ success: true, message: 'Email service deleted successfully' });
  } catch (error) {
    console.error('Error deleting email service:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete email service' }, { status: 500 });
  }
}
