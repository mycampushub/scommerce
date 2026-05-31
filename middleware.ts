import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Paths that require authentication
const protectedPaths = ['/admin']

// Sensitive API routes that need extra protection
const sensitiveApiRoutes = [
  '/api/orders',
  // '/api/cart', // Removed - cart handles guest users with localStorage fallback
  // '/api/wishlist', // Removed - wishlist should work for guest users (localStorage fallback)
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
]

// Static assets cache duration (1 year)
const STATIC_CACHE_MAX_AGE = 31536000

// Public pages cache duration (5 minutes)
const PUBLIC_CACHE_MAX_AGE = 300

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session')?.value

  // Create response with security headers helper
  const createSecureResponse = (baseResponse: NextResponse) => {
    const response = baseResponse
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'self'; form-action 'self'; base-uri 'self';"
    )
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
    )
    if (request.url.startsWith('https://')) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }
    return response
  }

  const matchesPath = (path: string, pattern: string) =>
    path === pattern || path.startsWith(pattern + '/')

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(p => matchesPath(pathname, p))
  const isApiRoute = pathname.startsWith('/api/')
  const isSensitiveRoute = sensitiveApiRoutes.some(r => matchesPath(pathname, r))
  const isCacheable = cacheablePaths.some(p => matchesPath(pathname, p)) ||
                       pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/)

  // Handle sensitive API routes - require authentication
  // Note: GET requests to /api/reviews should be public (anyone can read reviews)
  const requiresAuth = isApiRoute && isSensitiveRoute && !(pathname === '/api/reviews' && request.method === 'GET')
  if (requiresAuth) {
    if (!sessionToken) {
      const response = new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()')
      if (request.url.startsWith('https://')) {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      }
      return response
    }

    const payload = await verifyToken(sessionToken)
    if (!payload) {
      const response = new Response(
        JSON.stringify({ error: 'Invalid session' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()')
      if (request.url.startsWith('https://')) {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
      }
      return response
    }
  }

  // If path is protected and no session, redirect to login
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return createSecureResponse(NextResponse.redirect(loginUrl))
  }

  // If path is protected and has session, verify the token
  if (isProtectedPath && sessionToken) {
    const payload = await verifyToken(sessionToken)

    if (!payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      loginUrl.searchParams.set('session', 'expired')
      return createSecureResponse(NextResponse.redirect(loginUrl))
    }

    // Allow both admin and staff roles for admin access
    if (pathname.startsWith('/admin') && payload.role !== 'admin' && payload.role !== 'staff') {
      const homeUrl = new URL('/', request.url)
      return createSecureResponse(NextResponse.redirect(homeUrl))
    }
  }

  // If user is on login page and has a valid session, redirect appropriately
  if (pathname === '/login' && sessionToken) {
    const payload = await verifyToken(sessionToken)

    if (payload) {
      const redirectTo = request.nextUrl.searchParams.get('redirect')

      if (!redirectTo || redirectTo === '/login' || redirectTo === '/login/') {
        if (payload.role === 'admin' || payload.role === 'staff') {
          return createSecureResponse(NextResponse.redirect(new URL('/admin', request.url)))
        }
        return createSecureResponse(NextResponse.redirect(new URL('/', request.url)))
      }

      // Validate redirect URL to prevent open redirects
      if (redirectTo.startsWith('/') && !redirectTo.startsWith('//') &&
          !redirectTo.includes('://') && !redirectTo.includes('\\')) {
        return createSecureResponse(NextResponse.redirect(new URL(redirectTo, request.url)))
      }

      if (payload.role === 'admin' || payload.role === 'staff') {
        return createSecureResponse(NextResponse.redirect(new URL('/admin', request.url)))
      }
      return createSecureResponse(NextResponse.redirect(new URL('/', request.url)))
    }
  }

  // Add caching headers for cacheable routes
  if (isCacheable && !isApiRoute) {
    const response = createSecureResponse(NextResponse.next())
    const isStaticAsset = pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/)

    if (isStaticAsset) {
      response.headers.set('Cache-Control', `public, max-age=${STATIC_CACHE_MAX_AGE}, immutable`)
    } else {
      response.headers.set('Cache-Control', `public, max-age=${PUBLIC_CACHE_MAX_AGE}, must-revalidate`)
      response.headers.set('Vary', 'Cookie')
    }

    return response
  }

  // For API routes, prevent caching by default
  if (isApiRoute) {
    const response = createSecureResponse(NextResponse.next())
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  }

  return createSecureResponse(NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
