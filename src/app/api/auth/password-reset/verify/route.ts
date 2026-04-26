import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyResetTokenSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = verifyResetTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      logger.warn('Invalid or expired reset token used', { token });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    logger.info('Password reset token verified', { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      email: user.email,
    });
  } catch (error) {
    logger.logApiError('POST', '/api/auth/password-reset/verify', error as Error, 500, undefined, undefined, {
      action: 'verify_reset_token',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify reset token',
      },
      { status: 500 }
    );
  }
}
