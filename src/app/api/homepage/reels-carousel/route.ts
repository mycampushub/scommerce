import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

export async function GET(request: Request) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      'reels-carousel'
    )

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          isEnabled: true,
          autoScroll: true,
          autoPlay: 3000,
          heading: 'Trending Reels',
          description: 'Watch the latest video content'
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        isEnabled: numberToBool(setting.isEnabled),
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        autoPlay: settings.autoPlay || 3000,
        heading: settings.heading || 'Trending Reels',
        description: settings.description || 'Watch the latest video content'
      }
    })
  } catch (error) {
    console.error('Error fetching reels carousel settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reels carousel settings'
      },
      { status: 500 }
    )
  }
}