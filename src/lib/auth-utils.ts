import { NextRequest } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './auth'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'

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
 * Properly verifies JWT tokens and fetches user from database
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    let token: string | null = null

    // First, try to get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      token = extractTokenFromHeader(authHeader)
      console.log('[verifyAuth] Token from Authorization header:', !!token)
    }

    // If no token in header, try session cookie
    if (!token) {
      const sessionCookie = request.cookies.get('session')
      if (sessionCookie) {
        const sessionValue = sessionCookie.value.trim()
        console.log('[verifyAuth] Session cookie found, length:', sessionValue.length, 'starts with eyJ:', sessionValue.startsWith('eyJ'))

        // Check if it's a JWT token (starts with eyJ...)
        if (sessionValue.length > 50 && sessionValue.startsWith('eyJ')) {
          token = sessionValue
          console.log('[verifyAuth] Using token from session cookie')
        } else {
          console.warn('[verifyAuth] Session cookie does not appear to be a valid JWT token')
        }
      } else {
        console.log('[verifyAuth] No session cookie found')
      }
    }

    if (!token) {
      console.log('[verifyAuth] No token found')
      return { success: false, error: 'No session found' }
    }

    // Verify JWT token
    console.log('[verifyAuth] Verifying token...')
    const payload = await verifyToken(token)
    if (!payload) {
      console.error('[verifyAuth] Token verification failed - invalid or expired token')
      return { success: false, error: 'Invalid or expired token' }
    }

    console.log('[verifyAuth] Token verified successfully, userId:', payload.userId, 'email:', payload.email, 'role:', payload.role)

    // Fetch user from database to ensure account exists and is valid
    const env = await getEnv()
    const user = await UserRepository.findById(env, payload.userId)

    if (!user) {
      console.error('[verifyAuth] User not found in database:', payload.userId)
      return { success: false, error: 'User not found' }
    }

    console.log('[verifyAuth] User found:', user.id, user.email, user.role)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
      },
    }
  } catch (error) {
    console.error('[verifyAuth] Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Verify admin role
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(request)

  if (!authResult.success || !authResult.user) {
    return { success: false, error: 'Authentication required' }
  }

  if (authResult.user.role !== 'admin' && authResult.user.role !== 'staff') {
    console.log('[verifyAdmin] Access denied - user role:', authResult.user.role)
    return { success: false, error: 'Admin access required' }
  }

  console.log('[verifyAdmin] Admin access granted:', authResult.user.id, authResult.user.role)
  return authResult
}
