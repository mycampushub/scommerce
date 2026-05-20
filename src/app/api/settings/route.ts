import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/cloudflare';
import { SettingsRepository } from '@/db/settings.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import { verifyAdminAuth } from '@/lib/admin-auth';


/**
 * GET /api/settings
 * Get site settings
 */
export async function GET(request: NextRequest) {
  const env = await getEnv();

  try {
    const settings = await SettingsRepository.getSettings(env);

    const response = successResponse(settings, 'Settings retrieved successfully');

    // Add caching headers for settings (long-term static - 24 hours)
    return addCacheHeaders(response, CachePresets.LONG_TERM);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return errorResponse('Failed to fetch settings', 500);
  }
}

/**
 * POST /api/settings (Admin only)
 * Update site settings
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication (checks both Authorization header and session cookie)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv();


  try {
    const body = await request.json() as any;

    // Update settings
    const updatedSettings = await SettingsRepository.updateSettings(env, body);

    return successResponse(updatedSettings, 'Settings updated successfully');
  } catch (error) {
    console.error('Error updating settings:', error);
    return errorResponse('Failed to update settings', 500);
  }
}
