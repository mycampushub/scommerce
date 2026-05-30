import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

const SECTION_NAME = 'featured_products'

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
          productIds: [],
          isEnabled: true,
          heading: 'Featured Products',
          description: 'Discover our handpicked selection of top products',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        productIds: settings.productIds || [],
        isEnabled: numberToBool(setting.isEnabled),
        heading: settings.heading || 'Featured Products',
        description: settings.description || 'Discover our handpicked selection of top products',
      }
    })
  } catch (error) {
    console.error('Error fetching featured products settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured products settings'
      },
      { status: 500 }
    )
  }
}