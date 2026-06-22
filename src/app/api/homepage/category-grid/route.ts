import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

export async function GET(request: Request) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      'category-grid'
    )

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          categoryIds: [],
          isEnabled: true,
          heading: 'Shop by Category',
          description: 'Explore our wide range of categories'
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        categoryIds: settings.categoryIds || [],
        isEnabled: numberToBool(setting.isEnabled),
        heading: settings.heading || 'Shop by Category',
        description: settings.description || 'Explore our wide range of categories'
      }
    })
  } catch (error) {
    console.error('Error fetching category grid settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category grid settings'
      },
      { status: 500 }
    )
  }
}
