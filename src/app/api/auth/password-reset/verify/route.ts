import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyResetTokenSchema } from '@/lib/validations';
import { UserRepository } from '@/db/user.repository';
import { getEnv } from '@/lib/cloudflare';


export async function POST(request: NextRequest) {
  const env = await getEnv()
  try {
    const body = await request.json() as any;

    // Validate input
    const validation = verifyResetTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find user with valid reset token
    const user = await UserRepository.findByResetToken(env, token);

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
    logger.error('Password reset token verification failed', {
      action: 'verify_reset_token',
      error: error instanceof Error ? error.message : String(error)
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
