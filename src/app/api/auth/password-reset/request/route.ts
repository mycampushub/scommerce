import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requestPasswordResetSchema } from '@/lib/validations';
import { UserRepository } from '@/db/user.repository';
import { getEnv } from '@/lib/cloudflare';
import { generateId } from '@/db/db';

// Token expiry time (1 hour)
const TOKEN_EXPIRY_HOURS = 1;

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = getEnv(request)
  try {
    const body = await request.json();

    // Validate input
    const validation = requestPasswordResetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user by email
    const user = await UserRepository.findByEmail(env, email);

    // Always return success to prevent email enumeration
    // But only actually send email if user exists
    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email });
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link will be sent.',
      });
    }

    if (!user.password) {
      logger.warn('Password reset requested for user without password (OAuth user?)', { email, userId: user.id });
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link will be sent.',
      });
    }

    // Generate secure random token (Edge Runtime compatible)
    const resetToken = generateId();
    const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    // Update user with reset token
    await UserRepository.update(env, user.id, {
      resetToken,
      resetTokenExpiry,
    });

    // Log the reset request
    logger.logSecurityEvent('Password reset requested', 'LOW', {
      userId: user.id,
      email,
    });

    // TODO: Send email with reset link
    // For Cloudflare Pages, you would typically use:
    // - Cloudflare Email Routing
    // - Resend, SendGrid, or similar email service
    // Example with a mock email service:
    // await sendPasswordResetEmail(email, resetToken);

    // For development/testing, we'll log the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    logger.info('Password reset link generated (development mode)', {
      email,
      resetLink,
      userId: user.id,
    });

    // In production, don't include the reset link in the response
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link will be sent.',
      ...(isDevelopment && { resetLink }), // Only in development
    });
  } catch (error) {
    logger.logApiError('POST', '/api/auth/password-reset/request', error as Error, 500, undefined, undefined, {
      action: 'request_password_reset',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process password reset request',
      },
      { status: 500 }
    );
  }
}
