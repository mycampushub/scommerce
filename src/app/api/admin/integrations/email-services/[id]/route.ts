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
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
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
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    await IntegrationRepository.deleteEmailService(id);
    return NextResponse.json({ success: true, message: 'Email service deleted successfully' });
  } catch (error) {
    console.error('Error deleting email service:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete email service' }, { status: 500 });
  }
}
