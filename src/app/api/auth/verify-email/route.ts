import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'
import { queryFirst } from '@/db/db'
import { numberToBool } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = getEnv(request)
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user by email token
    const user = await queryFirst(
      env,
      'SELECT * FROM users WHERE emailToken = ? LIMIT 1',
      token
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (numberToBool(user.emailVerified)) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Update user: mark as verified and clear token
    await UserRepository.update(env, user.id, {
      emailVerified: true,
      emailToken: null,
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    })
  } catch (error: any) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
