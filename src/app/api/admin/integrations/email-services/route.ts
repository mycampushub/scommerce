import { NextRequest, NextResponse } from 'next/server';
import { IntegrationRepository } from '@/db/integration';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/rate-limit';
import { getEnv } from '@/lib/cloudflare';
import { logAdminAction } from '@/lib/audit-logger';

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
    const env = await getEnv();
    const services = await IntegrationRepository.getEmailServices(env);
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

  // Rate limiting: 20 requests per minute per admin
  const env = await getEnv()
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-email-service-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json();

    if (!body.name || !body.provider) {
      return validationErrorResponse('Name and provider are required');
    }

    const existing = await IntegrationRepository.getEmailServices(env);
    const isFirst = existing.length === 0;

    const service = await IntegrationRepository.createEmailService(env, {
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

    // SECURITY: Mask sensitive credentials in response
    const safeService = {
      ...service,
      apiKey: service.apiKey ? service.apiKey.substring(0, 4) + '****' : undefined,
      apiSecret: service.apiSecret ? '********' : undefined,
    };

    // Log audit event
    const admin = userOrResponse as { id: string };
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'AdminLog',
      service.id,
      `Created email service "${service.name}" (provider: ${service.provider})`
    );

    return successResponse(safeService, 'Email service created successfully', 201);
  } catch (error) {
    console.error('Error creating email service:', error);
    return errorResponse('Failed to create email service');
  }
}
