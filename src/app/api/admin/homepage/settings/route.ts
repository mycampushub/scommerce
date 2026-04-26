import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default homepage settings
const DEFAULT_SETTINGS = {
  banners: {
    sectionName: 'banners',
    isEnabled: true,
    autoPlay: 5000,
    displayLimit: null
  },
  stories: {
    sectionName: 'stories',
    isEnabled: true,
    autoPlay: 4000,
    displayLimit: 10
  },
  reels: {
    sectionName: 'reels',
    isEnabled: true,
    autoPlay: null,
    displayLimit: 10
  },
  promotions: {
    sectionName: 'promotions',
    isEnabled: true,
    autoPlay: null,
    displayLimit: 4
  }
}

export async function GET() {
  try {
    const settings = await db.homepageSettings.findMany()

    // If no settings exist, return defaults
    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        data: Object.values(DEFAULT_SETTINGS)
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error fetching homepage settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch homepage settings'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Settings array is required'
        },
        { status: 400 }
      )
    }

    // Update or create each setting
    const updatedSettings = await Promise.all(
      settings.map(async (setting: any) => {
        const { sectionName, isEnabled, autoPlay, displayLimit, customSettings } = setting

        return await db.homepageSettings.upsert({
          where: { sectionName },
          update: {
            ...(isEnabled !== undefined && { isEnabled }),
            ...(autoPlay !== undefined && { autoPlay }),
            ...(displayLimit !== undefined && { displayLimit }),
            ...(customSettings !== undefined && { settings: JSON.stringify(customSettings) })
          },
          create: {
            sectionName,
            isEnabled: isEnabled !== undefined ? isEnabled : true,
            autoPlay: autoPlay !== undefined ? autoPlay : 5000,
            displayLimit,
            settings: customSettings ? JSON.stringify(customSettings) : null
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      data: updatedSettings
    })
  } catch (error) {
    console.error('Error updating homepage settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update homepage settings'
      },
      { status: 500 }
    )
  }
}
