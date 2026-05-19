import { NextRequest, NextResponse } from 'next/server'

// Mock storage - in production, this would be in your database
let reelsCarouselSettings = {
  isEnabled: true,
  autoPlay: 3000,
  autoScroll: true,
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: reelsCarouselSettings
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { isEnabled, autoPlay, autoScroll } = body

    // Update settings
    if (typeof isEnabled === 'boolean') {
      reelsCarouselSettings.isEnabled = isEnabled
    }
    if (typeof autoPlay === 'number' && autoPlay >= 1000 && autoPlay <= 10000) {
      reelsCarouselSettings.autoPlay = autoPlay
    }
    if (typeof autoScroll === 'boolean') {
      reelsCarouselSettings.autoScroll = autoScroll
    }

    return NextResponse.json({
      success: true,
      data: reelsCarouselSettings
    })
  } catch (error) {
    console.error('Error updating reels carousel settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update reels carousel settings'
    }, { status: 400 })
  }
}
