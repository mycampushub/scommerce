import { NextRequest, NextResponse } from 'next/server'

/**
 * Broadcast real-time updates via WebSocket service
 * This API forwards requests to the realtime service running on port 3004
 */

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    // Forward to realtime service
    const response = await fetch('http://localhost:3004/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    })

    if (!response.ok) {
      throw new Error('Failed to broadcast')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // If realtime service is not available, still return success
    // Real-time features are nice-to-have, not critical
    console.warn('Realtime service not available:', error)
    return NextResponse.json({ success: true, realtime: false })
  }
}