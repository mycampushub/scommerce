import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

// Edge Runtime for Cloudflare Workers
export const runtime = 'experimental-edge'

// Paths that require authentication
const protectedPaths = ['/admin', '/admin/']
const publicPaths = ['/login', '/register', '/api/auth']

// Sensitive API routes that need extra protection
const sensitiveApiRoutes = [
  '/api/orders',
  '/api/cart',
  '/api/wishlist',
  '/api/reviews',
  '/api/products/favorite',
  '/api/addresses',
]

// Cacheable routes - public pages that can be cached
const cacheablePaths = [
  '/',
  '/shop',
  '/collections',
  '/about',
  '/contact',
  '/faq',
  '/shipping',
  '/privacy',
  '/terms',
  '/returns',
  '/login',
  '/register',
]

// Static assets cache duration (1 year)
const STATIC_CACHE_MAX_AGE = 31536000

// Public pages cache duration (5 minutes)
const PUBLIC_CACHE_MAX_AGE = 300

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session')?.value

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isApiRoute = pathname.startsWith('/api/')
  const isSensitiveRoute = sensitiveApiRoutes.some(route => pathname.startsWith(route))
  const isCacheable = cacheablePaths.some(path => pathname.startsWith(path)) ||
                       pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/)

  // Handle sensitive API routes
  if (isApiRoute && isSensitiveRoute) {
    // Check authentication for sensitive routes
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify token
    const payload = await verifyToken(sessionToken)
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // If path is protected and no session, redirect to login
  if (isProtectedPath && !sessionToken) {
    // Don't redirect if already on login page (prevent loop)
    if (pathname === '/login' || pathname === '/login/') {
      return NextResponse.next()
    }
    // Don't redirect if we're already coming from login (prevent loop)
    const from = request.nextUrl.searchParams.get('from')
    if (from === 'login') {
      return NextResponse.next()
    }
    const loginUrl = new URL('/login', request.url)
    // Only set redirect if not already coming from a redirect
    const existingRedirect = request.nextUrl.searchParams.get('redirect')
    if (!existingRedirect) {
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('from', 'middleware')
    }
    return NextResponse.redirect(loginUrl)
  }

  // If path is protected and has session, verify the token
  if (isProtectedPath && sessionToken) {
    const payload = await verifyToken(sessionToken)

    // If token is invalid or expired, redirect to login
    if (!payload) {
      // Don't redirect if already on login page
      if (pathname === '/login' || pathname === '/login/') {
        return NextResponse.next()
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('session', 'expired')
      loginUrl.searchParams.set('from', 'middleware')
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin role for admin paths
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      const homeUrl = new URL('/', request.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  // If user is on login page and has a valid session, redirect appropriately
  // BUT prevent redirect loops by checking if we're already redirected from login
  if (pathname === '/login' && sessionToken) {
    const payload = await verifyToken(sessionToken)

    if (payload) {
      // Check if we have a valid redirect parameter and not already coming from login
      const redirectTo = request.nextUrl.searchParams.get('redirect')
      const from = request.nextUrl.searchParams.get('from')
      
      // If we're already coming from a redirect (from=login), don't redirect again
      if (from === 'login') {
        return NextResponse.next()
      }
      
      // If no redirect or redirect is to login page itself, redirect to appropriate page
      if (!redirectTo || redirectTo === '/login' || redirectTo === '/login/' || redirectTo.includes('login')) {
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } else {
        // Validate redirect URL to prevent open redirects
        try {
          const redirectUrl = new URL(redirectTo, request.url)
          // Only allow relative URLs or same-origin URLs
          if (redirectUrl.origin === new URL(request.url).origin || redirectTo.startsWith('/')) {
            return NextResponse.redirect(redirectUrl)
          }
        } catch {
          // Invalid URL, redirect to home
        }
        // Fallback: redirect based on role
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
  }

  // Add caching headers for cacheable routes
  if (isCacheable && !isApiRoute) {
    const response = NextResponse.next()
    const isStaticAsset = pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/)

    if (isStaticAsset) {
      // Long cache for static assets
      response.headers.set('Cache-Control', `public, max-age=${STATIC_CACHE_MAX_AGE}, immutable`)
    } else {
      // Shorter cache for public pages (allow revalidation)
      response.headers.set('Cache-Control', `public, max-age=${PUBLIC_CACHE_MAX_AGE}, must-revalidate`)
      response.headers.set('Vary', 'Cookie')
    }

    return response
  }

  // For API routes, prevent caching by default
  if (isApiRoute) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
