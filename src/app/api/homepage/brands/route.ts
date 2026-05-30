import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

const SECTION_NAME = 'brands'

export async function GET(request: Request) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          brandIds: [],
          isEnabled: true,
          autoScroll: true,
          scrollInterval: 4000,
          heading: 'Featured Brands',
          description: 'Discover top brands in our collection',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        brandIds: settings.brandIds || [],
        isEnabled: numberToBool(setting.isEnabled),
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        scrollInterval: settings.scrollInterval || 4000,
        heading: settings.heading || 'Featured Brands',
        description: settings.description || 'Discover top brands in our collection',
      }
    })
  } catch (error) {
    console.error('Error fetching brands settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch brands settings'
      },
      { status: 500 }
    )
  }
}