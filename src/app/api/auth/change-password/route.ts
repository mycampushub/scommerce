import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/jwt'
import { changePasswordSchema } from '@/lib/validations'
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit'
import { UserRepository } from '@/db/user.repository'
import { getEnv } from '@/lib/cloudflare'

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = getEnv(request)
  const clientIp = getClientIp(request)
  const rateLimitResult = rateLimit('change-password:' + clientIp, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(sessionToken)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    const user = await UserRepository.findById(env, decoded.userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Password not set for this account' },
        { status: 400 }
      )
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await UserRepository.update(env, user.id, { password: hashedNewPassword })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
