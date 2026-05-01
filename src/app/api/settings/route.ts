import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';
import { SettingsRepository } from '@/db/settings.repository';
import { addCacheHeaders, CachePresets } from '@/lib/http-cache';


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

    // Add caching headers for settings
    return addCacheHeaders(response, CachePresets.SEMI_STATIC);
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
  const env = getEnv();

  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { verifyToken } = await import('@/lib/jwt');
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

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
