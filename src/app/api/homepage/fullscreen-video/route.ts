import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

export async function GET(request: Request) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      'fullscreen-video'
    )

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          videoUrl: '',
          isEnabled: true,
          heading: 'Featured Video',
          description: 'Experience our exclusive video content'
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: settings.videoUrl || '',
        isEnabled: numberToBool(setting.isEnabled),
        heading: settings.heading || 'Featured Video',
        description: settings.description || 'Experience our exclusive video content'
      }
    })
  } catch (error) {
    console.error('Error fetching fullscreen video settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fullscreen video settings'
      },
      { status: 500 }
    )
  }
}