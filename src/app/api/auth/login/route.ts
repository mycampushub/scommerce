import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, isPBKDF2Hash } from '@/lib/bcrypt-wrapper';
import { createToken } from '@/lib/auth';
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validations';
import { UserRepository } from '@/db/user.repository';
import { getEnv } from '@/lib/cloudflare';
import { numberToBool } from '@/db/db';
import { CartRepository } from '@/db/cart.repository';
import type { Env } from '@/db/types';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let env: Env | null = null;
  try {
    env = await getEnv() as Env | null;
    // Note: env can be null in both local development and some production scenarios
    // The repositories will fall back to Prisma when env is null
    logger.debug('Login environment check', {
      hasEnv: !!env,
      hasDB: !!env?.DB,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    logger.error('Error getting login environment', { error });
    // Continue with null env - repositories will use Prisma fallback
  }

  const clientIp = getClientIp(request);
  const body = await request.json() as any;
  const { email, password, guestCart } = body;
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

    logger.info('User found for login', {
      email: user?.email,
      hasPassword: !!user?.password,
      role: user?.role
    });

    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Email verification disabled - users can login without verifying email
    // if (!numberToBool(user.emailVerified)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Please verify your email before logging in' },
    //     { status: 403 }
    //   );
    // }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Password not set for this account. Please reset your password.' },
        { status: 401 }
      );
    }

    // Check if user has legacy bcrypt hash that needs migration
    if (!isPBKDF2Hash(user.password)) {
      logger.warn('Login failed - legacy bcrypt hash detected', { email });
      return NextResponse.json(
        {
          success: false,
          error: 'Your account needs a password reset. Please use the forgot password feature to reset your password.',
          requiresPasswordReset: true
        },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      logger.warn('Login failed - invalid password', { email });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    logger.info('Password validated successfully', { email });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Sync guest cart to database if provided
    let syncedCartCount = 0;
    if (guestCart && Array.isArray(guestCart) && guestCart.length > 0) {
      try {
        // Get existing cart items for user
        const existingCartItems = await CartRepository.findByUserId(env, user.id);

        for (const guestItem of guestCart) {
          // Check if item already exists in user's cart
          const existingItem = existingCartItems.find(
            (item) =>
              item.productId === guestItem.id &&
              (!guestItem.variantId || item.variantId === guestItem.variantId)
          );

          if (existingItem) {
            // Update quantity
            await CartRepository.updateQuantity(env, existingItem.id, guestItem.quantity);
          } else {
            // Add new item
            await CartRepository.addItem(env, {
              userId: user.id,
              productId: guestItem.id,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity || 1,
            });
          }
          syncedCartCount++;
        }
      } catch (error) {
        logger.error('Failed to sync guest cart', { 
          error,
          userId: user.id,
          syncedCartCount 
        });
        // Don't fail login if cart sync fails
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        // SECURITY: Token is NOT returned in response body
        // It's only stored in httpOnly cookie for security
      },
      syncedCart: syncedCartCount,
    });

    // Set session cookie with settings compatible with Cloudflare Workers
    // Token is only stored here, in a secure httpOnly cookie
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
    logger.error('Login failed', { 
      error,
      email: body.email 
    });
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
