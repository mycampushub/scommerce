import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

const SECTION_NAME = 'mosaic_grid'

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
          heading: 'Shop the Look',
          description: 'Explore our curated collection of trending styles',
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
        heading: settings.heading || 'Shop the Look',
        description: settings.description || 'Explore our curated collection of trending styles',
      }
    })
  } catch (error) {
    console.error('Error fetching mosaic grid settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch mosaic grid settings'
      },
      { status: 500 }
    )
  }
}