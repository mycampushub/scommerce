import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.homepageSettings.findMany()

    // If no settings exist, return defaults
    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
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
      })
    }

    // Convert settings array to object
    const settingsObject = settings.reduce((acc: any, setting) => {
      acc[setting.sectionName] = {
        sectionName: setting.sectionName,
        isEnabled: setting.isEnabled,
        autoPlay: setting.autoPlay,
        displayLimit: setting.displayLimit,
        settings: setting.settings ? JSON.parse(setting.settings) : null
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: settingsObject
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
