import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, numberToBool } from '@/db/db'

export async function GET(request: Request) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      'category-carousel'
    )

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          categoryIds: [],
          isEnabled: true,
          autoScroll: true,
          scrollInterval: 4000,
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
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        scrollInterval: settings.scrollInterval || 4000,
        heading: settings.heading || 'Shop by Category',
        description: settings.description || 'Explore our wide range of categories'
      }
    })
  } catch (error) {
    console.error('Error fetching category carousel settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category carousel settings'
      },
      { status: 500 }
    )
  }
}