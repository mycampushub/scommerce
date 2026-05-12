import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({
        success: true,
        data: {
          user: null,
        },
      });
    }

    // Verify JWT token directly
    const sessionData = await verifyToken(sessionToken);

    if (!sessionData) {
      return NextResponse.json({
        success: true,
        data: {
          user: null,
        },
      });
    }

    // Transform JWTPayload ({ userId, email, role, name }) to match
    // the User interface ({ id, email, name, role }) used by the frontend
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name || null,
          role: sessionData.role || 'customer',
        },
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          user: null,
        },
      }
    );
  }
}
