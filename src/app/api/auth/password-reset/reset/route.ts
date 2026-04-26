import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { resetPasswordSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = validation.data;

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
      logger.warn('Password reset attempted with invalid or expired token', { token });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Log the password reset
    logger.logSecurityEvent('Password reset successfully completed', 'MEDIUM', {
      userId: user.id,
      email: user.email,
    });

    logger.info('User password reset', { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    logger.logApiError('POST', '/api/auth/password-reset/reset', error as Error, 500, undefined, undefined, {
      action: 'reset_password',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset password',
      },
      { status: 500 }
    );
  }
}
