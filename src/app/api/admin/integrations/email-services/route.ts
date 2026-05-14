import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

/**
 * GET /api/admin/integrations/email-services
 * Get all email services (Admin only)
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const services = await IntegrationRepository.getEmailServices();
    const safeServices = services.map(s => ({ ...s, apiSecret: s.apiSecret ? '********' : undefined }));

    return successResponse(safeServices);
  } catch (error) {
    console.error('Error fetching email services:', error);
    return errorResponse('Failed to fetch email services');
  }
}

/**
 * POST /api/admin/integrations/email-services
 * Create a new email service (Admin only)
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const body = await request.json();

    if (!body.name || !body.provider) {
      return validationErrorResponse('Name and provider are required');
    }

    const existing = await IntegrationRepository.getEmailServices();
    const isFirst = existing.length === 0;

    const service = await IntegrationRepository.createEmailService({
      name: body.name,
      provider: body.provider,
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      webhookUrl: body.webhookUrl,
      sandboxMode: body.sandboxMode || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : isFirst,
      settings: body.settings
    });

    return successResponse(service, 'Email service created successfully', 201);
  } catch (error) {
    console.error('Error creating email service:', error);
    return errorResponse('Failed to create email service');
  }
}
