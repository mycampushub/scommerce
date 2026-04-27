/**
 * CSRF Token API
 * Provides CSRF tokens for frontend requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCSRFToken, getCSRFSessionId } from '@/lib/csrf';
import { getEnv } from '@/lib/cloudflare';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

/**
 * GET /api/auth/csrf
 * Returns a new CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  try {
    // Get Cloudflare environment
    const env = getEnv(request);

    // Get session ID
    const sessionId = getCSRFSessionId(request);

    // Create new CSRF token
    const token = await createCSRFToken(env, sessionId, 3600); // 1 hour TTL

    if (!token) {
      return NextResponse.json(
        {
          error: 'Failed to create CSRF token',
          message: 'Unable to generate CSRF protection token',
        },
        { status: 500 }
      );
    }

    // Return token
    return NextResponse.json({
      token,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
