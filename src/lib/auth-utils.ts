import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, AdminUser } from './admin-auth'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
    role: string
  }
  error?: string
}

/**
 * Verify authentication from session cookie or Authorization header
 * This function now delegates to verifyAdminAuth for consistency
 *
 * @deprecated Use verifyAdminAuth from '@/lib/admin-auth' instead for admin routes
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff', 'user'])

    if (userOrResponse instanceof NextResponse) {
      return { success: false, error: 'Authentication required' }
    }

    return {
      success: true,
      user: userOrResponse,
    }
  } catch (error) {
    console.error('[verifyAuth] Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Verify admin role
 * This function now delegates to verifyAdminAuth for consistency
 *
 * @deprecated Use verifyAdminAuth from '@/lib/admin-auth' directly instead
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])

    if (userOrResponse instanceof NextResponse) {
      return { success: false, error: 'Admin access required' }
    }

    return {
      success: true,
      user: userOrResponse,
    }
  } catch (error) {
    console.error('[verifyAdmin] Admin auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Unified authentication function that matches admin-auth.ts behavior
 * Use this for consistent authentication across the application
 */
export async function verifyUserAuth(
  request: NextRequest,
  allowedRoles: string[] = ['admin', 'staff', 'user']
): Promise<AuthResult> {
  try {
    const userOrResponse = await verifyAdminAuth(request, allowedRoles)

    if (userOrResponse instanceof NextResponse) {
      return { success: false, error: 'Authentication required' }
    }

    return {
      success: true,
      user: userOrResponse,
    }
  } catch (error) {
    console.error('[verifyUserAuth] Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}
