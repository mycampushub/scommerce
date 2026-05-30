import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

const SECTION_NAME = 'marquee'
const DEFAULT_MARQUEE_TEXT = 'FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE'

export async function GET(request: Request) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      // Return default marquee settings
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          text: DEFAULT_MARQUEE_TEXT,
          isEnabled: true,
          animationSpeed: 20, // seconds for full cycle
          heading: 'Special Offers',
          description: 'Don\'t miss out on our amazing deals',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        text: settings.text || DEFAULT_MARQUEE_TEXT,
        isEnabled: numberToBool(setting.isEnabled),
        animationSpeed: settings.animationSpeed || 20,
        heading: settings.heading || 'Special Offers',
        description: settings.description || 'Don\'t miss out on our amazing deals',
      }
    })
  } catch (error) {
    console.error('Error fetching marquee settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch marquee settings'
      },
      { status: 500 }
    )
  }
}