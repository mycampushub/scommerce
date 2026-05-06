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
    console.log('[verifyAdminAuth] Checking admin auth, allowedRoles:', allowedRoles);

    // First check Authorization header (for API calls)
    const authHeader = request.headers.get('authorization')
    let token = extractTokenFromHeader(authHeader)
    console.log('[verifyAdminAuth] Token from auth header:', !!token);

    // If no Authorization header, check session cookie
    if (!token) {
      token = request.cookies.get('session')?.value ?? null
      console.log('[verifyAdminAuth] Token from session cookie:', !!token);
    }

    if (!token) {
      console.log('[verifyAdminAuth] No token found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)
    if (!payload) {
      console.log('[verifyAdminAuth] Token verification failed');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    console.log('[verifyAdminAuth] Token verified, userId:', payload.userId, 'role:', payload.role);

    // Verify user exists and has valid role
    const env = getEnv()
    const user = await UserRepository.findById(env, payload.userId)

    if (!user) {
      console.log('[verifyAdminAuth] User not found:', payload.userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      console.log('[verifyAdminAuth] User role not allowed:', user.role, 'allowed:', allowedRoles);
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      )
    }

    console.log('[verifyAdminAuth] Admin auth verified successfully:', user.id, user.role);

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
