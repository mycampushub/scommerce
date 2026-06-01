import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'

export interface AdminUser {
  id: string
  email: string
  role: string
  name?: string
}

/**
 * Verify admin authentication and role
 * @param request - NextRequest object
 * @param allowedRoles - Array of allowed roles (default: ['admin'])
 * @returns AdminUser object or NextResponse error
 */
export async function verifyAdminAuth(
  request: NextRequest,
  allowedRoles: string[] = ['admin']
): Promise<AdminUser | NextResponse> {
  try {
    // Development-only logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[verifyAdminAuth] Checking admin auth, allowedRoles:', allowedRoles);
      const authHeader = request.headers.get('authorization');
      const sessionCookie = request.cookies.get('session');
      console.log('[verifyAdminAuth] Auth header present:', !!authHeader);
      console.log('[verifyAdminAuth] Session cookie present:', !!sessionCookie);
      if (sessionCookie) {
        console.log('[verifyAdminAuth] Session cookie name:', sessionCookie.name, 'value length:', sessionCookie.value?.length);
      }
    }

    // First check Authorization header (for API calls)
    const authHeader = request.headers.get('authorization')
    let token = extractTokenFromHeader(authHeader)

    // If no Authorization header, check session cookie
    if (!token) {
      const sessionCookie = request.cookies.get('session')
      token = sessionCookie?.value ?? null
      if (process.env.NODE_ENV === 'development' && token) {
        console.log('[verifyAdminAuth] Using token from session cookie, length:', token.length);
      }
    }

    if (!token) {
      console.log('[verifyAdminAuth] No token found in header or cookie');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[verifyAdminAuth] Verifying token...');
    const payload = await verifyToken(token)
    if (!payload) {
      console.log('[verifyAdminAuth] Token verification failed or expired');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    console.log('[verifyAdminAuth] Token verified, userId:', payload.userId, 'email:', payload.email);

    // Verify user exists and has valid role
    const env = await getEnv()
    const user = await UserRepository.findById(env, payload.userId)

    if (!user) {
      console.log('[verifyAdminAuth] User not found in database:', payload.userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    console.log('[verifyAdminAuth] User found, role:', user.role, 'allowedRoles:', allowedRoles);

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      console.log('[verifyAdminAuth] User role not in allowed roles');
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      )
    }

    console.log('[verifyAdminAuth] Authentication successful');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    }
  } catch (error) {
    console.error('[verifyAdminAuth] Admin auth verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

/**
 * Higher-order function to protect admin routes
 * @param handler - Next.js route handler
 * @param allowedRoles - Array of allowed roles (default: ['admin'])
 * @returns Protected route handler
 */
export function withAdminAuth(
  handler: (
    request: NextRequest,
    context: { user: AdminUser }
  ) => Promise<NextResponse>,
  allowedRoles: string[] = ['admin']
) {
  return async (request: NextRequest) => {
    const userOrResponse = await verifyAdminAuth(request, allowedRoles)

    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    return handler(request, { user: userOrResponse })
  }
}

/**
 * Alias for verifyAdminAuth for backward compatibility
 */
export const verifyAdmin = verifyAdminAuth;
