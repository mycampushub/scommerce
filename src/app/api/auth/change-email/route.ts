import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/jwt'
import { changeEmailSchema } from '@/lib/validations'
import { rateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limit'
import { UserRepository } from '@/db/user.repository'
import { getEnv } from '@/lib/cloudflare'

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const env = getEnv(request)
  const clientIp = getClientIp(request)
  const rateLimitResult = rateLimit('change-email:' + clientIp, {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
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
    const { password, newEmail, confirmEmail } = body

    const validation = changeEmailSchema.safeParse({
      password,
      newEmail,
      confirmEmail,
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

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    const existingUser = await UserRepository.findByEmail(env, newEmail)

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email is already in use by another account' },
        { status: 400 }
      )
    }

    const emailToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    await UserRepository.update(env, user.id, {
      emailVerified: false,
      newEmail: newEmail,
      emailToken: emailToken,
    })

    const verificationLink = (process.env.NEXT_PUBLIC_URL || 'http://localhost:3000') + '/api/auth/verify-email-change?token=' + emailToken
    console.log('Email change verification link:', verificationLink)
    console.log('Please send this link to new email:', newEmail)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent to your new email address',
      data: { verificationLink: verificationLink, newEmail: newEmail },
    })
  } catch (error: any) {
    console.error('Change email error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to request email change' },
      { status: 500 }
    )
  }
}
