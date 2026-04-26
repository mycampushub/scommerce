import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './auth'
import { db } from './db'

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
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify user exists and has valid role
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      )
    }

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      )
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    }
  } catch (error) {
    console.error('Admin auth verification error:', error)
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
