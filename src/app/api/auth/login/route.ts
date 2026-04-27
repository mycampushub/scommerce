import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/jwt';
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validations';
import { UserRepository } from '@/db/user.repository';
import { getEnv } from '@/lib/cloudflare';
import { numberToBool } from '@/db/db';

// Edge Runtime export for Cloudflare
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv(request);

  // Apply rate limiting based on IP and email
  const clientIp = getClientIp(request);
  const body = await request.json();
  const { email, password } = body;

  // Rate limit by IP + email combination for better protection
  const rateLimitKey = `login:${clientIp}:${email || 'unknown'}`;
  const rateLimitResult = rateLimit(rateLimitKey, {
    maxRequests: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    // Validate input using Zod schema
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    // Find user by email using D1
    const user = await UserRepository.findByEmail(env, email);

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!numberToBool(user.emailVerified)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email before logging in',
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password not set for this account. Please reset your password.',
        },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });

    // Set cookie with stricter security
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
      },
      { status: 500 }
    );
  }
}
