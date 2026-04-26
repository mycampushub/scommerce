import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: {
        emailToken: token,
        newEmail: { not: null },
      },
      select: { id: true, email: true, newEmail: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        email: user.newEmail,
        emailVerified: true,
        newEmail: null,
        emailToken: null,
        updatedAt: new Date(),
      },
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
