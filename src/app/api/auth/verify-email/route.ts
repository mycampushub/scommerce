import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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
    const user = await db.user.findFirst({
      where: { emailToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Update user: mark as verified and clear token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailToken: null,
      },
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
