import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params;
    await IntegrationRepository.setDefaultEmailService(id);
    return successResponse(null, 'Email service set as default');
  } catch (error) {
    console.error('Error setting default email service:', error);
    return errorResponse('Failed to set default email service');
  }
}
