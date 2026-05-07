import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validations';
import { UserRepository } from '@/db/user.repository';
import { getEnv } from '@/lib/cloudflare';
import { generateEmailToken } from '@/lib/crypto-utils';
import { createToken } from '@/lib/auth';
import { logger } from '@/lib/logger';


export async function POST(request: NextRequest) {
  // Get D1 database from request context (Cloudflare Pages/Workers)
  const env = getEnv();

  // Apply rate limiting based on IP and email
  const clientIp = getClientIp(request);
  const body = await request.json() as any;
  const { email, name, phone, password, confirmPassword, adminSecret } = body;

  // Rate limit by IP to prevent spam registration
  const rateLimitResult = await rateLimit(env, `register:${clientIp}`, {
    maxRequests: 3, // 3 registration attempts
    windowMs: 60 * 60 * 1000, // 1 hour
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    // Validate input using Zod schema
    const validation = registerSchema.safeParse({ email, name, password });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Validate phone number (Bangladesh format)
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Bangladesh phone number. Format: 01XXXXXXXXX' },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if user already exists by email
    const existingUser = await UserRepository.findByEmail(env, email);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if phone number already exists - need to query directly since we don't have findByPhone
    const { queryFirst } = await import('@/db/db');
    const existingPhone = await queryFirst(
      env,
      'SELECT * FROM users WHERE phone = ? LIMIT 1',
      phone
    );

    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine user role
    // Allow admin registration if adminSecret matches (from environment)
    const ADMIN_SECRET = process.env.ADMIN_SECRET;
    const isAdmin = ADMIN_SECRET && adminSecret === ADMIN_SECRET;

    // Generate email verification token using secure random
    const emailToken = generateEmailToken();

    // Create user with appropriate role
    const user = await UserRepository.create(env, {
      email,
      name,
      phone,
      password: hashedPassword,
      emailVerified: true, // Auto-verify on registration
      role: isAdmin ? 'admin' : 'user',
    });

    // Update user with email verification token
    await UserRepository.update(env, user.id, {
      emailToken,
    });

    // Create JWT token for auto-login
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Return user data (converting emailVerified from number to boolean for frontend)
    const transformedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified === 1,
      role: user.role,
      createdAt: user.createdAt,
    };

    // Log verification link (in production, this would send an email)
    const verificationLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${emailToken}`;
    logger.info('Email verification link generated', {
      verificationLink,
      email,
      emailToken,
    });
    logger.info('User registered', {
      email,
      name,
      role: user.role,
      userId: user.id,
    });

    // Create response with session cookie for auto-login
    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! You have been automatically logged in.',
      data: {
        user: transformedUser,
        token,
        verificationLink, // Only included for demo purposes
      },
    });

    // Set cookie with stricter security for auto-login
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    logger.logApiError('POST', '/api/auth/register', error as Error, 500, undefined, undefined, {
      email,
      phone,
      name,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
