import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export const runtime = 'edge'

// Paths that require authentication
const protectedPaths = ['/admin', '/admin/']
const publicPaths = ['/login', '/register', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session')?.value

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // If path is protected and no session, redirect to login
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If path is protected and has session, verify the token
  if (isProtectedPath && sessionToken) {
    const payload = await verifyToken(sessionToken)

    // If token is invalid or expired, redirect to login
    if (!payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('session', 'expired')
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin role for admin paths
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      const homeUrl = new URL('/', request.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // If user is on login page and has a valid session, redirect appropriately
  if (pathname === '/login' && sessionToken) {
    const payload = await verifyToken(sessionToken)

    if (payload) {
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
