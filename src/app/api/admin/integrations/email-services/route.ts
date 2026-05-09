import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';

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

    return NextResponse.json({ success: true, data: safeServices });
  } catch (error) {
    console.error('Error fetching email services:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch email services' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Name and provider are required' }, { status: 400 });
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
      isActive: body.isActive !== undefined ? body.isActive : true,
      isDefault: body.isDefault !== undefined ? body.isDefault : isFirst,
      settings: body.settings
    });

    return NextResponse.json({ success: true, data: service, message: 'Email service created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating email service:', error);
    return NextResponse.json({ success: false, error: 'Failed to create email service' }, { status: 500 });
  }
}
