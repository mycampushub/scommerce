import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration.repository';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    await IntegrationRepository.setDefaultEmailService(id);
    return NextResponse.json({ success: true, message: 'Email service set as default' });
  } catch (error) {
    console.error('Error setting default email service:', error);
    return NextResponse.json({ success: false, error: 'Failed to set default email service' }, { status: 500 });
  }
}
