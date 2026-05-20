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
    const service = await IntegrationRepository.getEmailServiceById(env, id);
    if (!service) {
      return notFoundResponse('Email service not found');
    }

    const safeService = { ...service, apiSecret: service.apiSecret ? '********' : undefined };
    return successResponse(safeService);
  } catch (error) {
    console.error('Error fetching email service:', error);
    return errorResponse('Failed to fetch email service');
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
    const service = await IntegrationRepository.updateEmailService(env, id, body);

    if (!service) {
      return notFoundResponse('Email service not found');
    }

    const safeService = { ...service, apiSecret: service.apiSecret ? '********' : undefined };
    return successResponse(safeService, 'Email service updated successfully');
  } catch (error) {
    console.error('Error updating email service:', error);
    return errorResponse('Failed to update email service');
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
    await IntegrationRepository.deleteEmailService(env, id);
    return successResponse(null, 'Email service deleted successfully');
  } catch (error) {
    console.error('Error deleting email service:', error);
    return errorResponse('Failed to delete email service');
  }
}
