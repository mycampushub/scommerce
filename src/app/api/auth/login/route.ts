import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/bcrypt-wrapper';
import { createToken } from '@/lib/auth';
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validations';
import { UserRepository } from '@/db/user.repository';
import { getEnv } from '@/lib/cloudflare';
import { numberToBool } from '@/db/db';
import type { Env } from '@/db/types';

export async function POST(request: NextRequest) {
  let env: Env | null = null;
  try {
    env = getEnv() as Env | null;
    if (!env || !env.DB) {
      console.error('[login] Database not available - env:', env);
      return NextResponse.json(
        { success: false, error: 'Database connection error. Please try again later.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[login] Error getting environment:', error);
    return NextResponse.json(
      { success: false, error: 'Configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  const clientIp = getClientIp(request);
  const body = await request.json() as any;
  const { email, password } = body;
  const rateLimitKey = `login:${clientIp}:${email || 'unknown'}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await UserRepository.findByEmail(env, email);

    console.log('[login] Found user:', {
      email: user?.email,
      hasPassword: !!user?.password,
      emailVerified: user?.emailVerified,
      role: user?.role,
      userId: user?.id
    });

    if (!user) {
      console.log('[login] User not found:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!numberToBool(user.emailVerified)) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before logging in' },
        { status: 403 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Password not set for this account. Please reset your password.' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    console.log('[login] Password validation:', { isValidPassword, email });

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token },
    });

    // Set session cookie with settings compatible with Cloudflare Workers
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for Cloudflare Workers compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser handle domain automatically
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
