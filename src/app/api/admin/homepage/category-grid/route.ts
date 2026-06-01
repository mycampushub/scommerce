import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON, execute, numberToBool } from '@/db/db'

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

export async function PUT(request: Request) {
  try {
    const env = await getEnv()
    const body = await request.json() as any

    const { categoryIds, isEnabled, heading, description } = body

    const settings = JSON.stringify({
      categoryIds: categoryIds || [],
      isEnabled: isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1,
      heading: heading || 'Shop by Category',
      description: description || 'Explore our wide range of categories'
    })

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      'category-grid'
    )

    if (setting) {
      await execute(
        env,
        'UPDATE homepage_settings SET settings = ?, updatedAt = CURRENT_TIMESTAMP WHERE sectionName = ?',
        settings,
        'category-grid'
      )
    } else {
      await execute(
        env,
        'INSERT INTO homepage_settings (sectionName, settings, isEnabled) VALUES (?, ?, ?)',
        'category-grid',
        settings,
        isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category grid settings saved successfully'
    })
  } catch (error) {
    console.error('Error saving category grid settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save category grid settings'
      },
      { status: 500 }
    )
  }
}