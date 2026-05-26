import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Verify admin authentication (admin only - debug endpoint)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  return NextResponse.json({
    success: true,
    message: 'New code deployed!',
    features: [
      'Enhanced error logging in products API',
      'Enhanced error logging in promotions API',
      'Detailed execute() logging in db.ts',
      'ProductRepository.create() logging',
      'Error details included in responses'
    ],
    timestamp: new Date().toISOString()
  })
}
