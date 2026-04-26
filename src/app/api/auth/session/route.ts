import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({
        success: true,
        data: {
          user: null,
        },
      })
    }

    // Verify JWT token directly
    const sessionData = verifyToken(sessionToken)

    return NextResponse.json({
      success: true,
      data: {
        user: sessionData,
      },
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      {
        success: true,
        data: {
          user: null,
        },
      }
    )
  }
}
