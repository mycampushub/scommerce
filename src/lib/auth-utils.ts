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
    }

    // If no token in header, try session cookie
    if (!token) {
      const sessionCookie = request.cookies.get('session')
      if (sessionCookie) {
        const sessionValue = sessionCookie.value.trim()
        // Check if it's a JWT token (starts with eyJ...)
        if (sessionValue.length > 50 && sessionValue.startsWith('eyJ')) {
          token = sessionValue
        }
      }
    }

    if (!token) {
      return { success: false, error: 'No session found' }
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      return { success: false, error: 'Invalid or expired token' }
    }

    // Fetch user from database to ensure account exists and is valid
    const env = getEnv(request)
    const user = await UserRepository.findById(env, payload.userId)

    if (!user) {
      return { success: false, error: 'User not found' }
    }

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
    console.error('Auth verification error:', error)
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
    return { success: false, error: 'Admin access required' }
  }

  return authResult
}
