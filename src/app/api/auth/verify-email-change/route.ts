import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'
import { queryFirst } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const env = getEnv(request)
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const user = await queryFirst(
      env,
      'SELECT id, email, newEmail, name FROM users WHERE emailToken = ? AND newEmail IS NOT NULL LIMIT 1',
      token
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    await UserRepository.update(env, user.id, {
      email: user.newEmail,
      emailVerified: true,
      newEmail: null,
      emailToken: null,
    })

    return NextResponse.redirect(
      (process.env.NEXT_PUBLIC_URL || 'http://localhost:3000') + '/account/settings?emailChanged=true'
    )
  } catch (error: any) {
    console.error('Email change verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify email change' },
      { status: 500 }
    )
  }
}
