import { NextResponse } from 'next/server'

export async function GET() {
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
