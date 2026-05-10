import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { SettingsRepository } from '@/db/settings.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { csrfMiddleware } from '@/lib/csrf';
import prisma from '@/lib/database';


/**
 * GET /api/settings
 * Get site settings
 */
export async function GET(request: NextRequest) {
  const env = getEnv();

  try {
    const settings = await SettingsRepository.getSettings(env);

    const response = NextResponse.json({
      success: true,
      data: settings
    });

    // Add caching headers for settings (long-term static - 24 hours)
    return addCacheHeaders(response, CachePresets.LONG_TERM);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings'
      },
      { status: 500 }
    );
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

  const env = getEnv();

  // Check CSRF protection
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const body = await request.json() as any;

    // Update settings
    const updatedSettings = await SettingsRepository.updateSettings(env, body);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings'
      },
      { status: 500 }
    );
  }
}
