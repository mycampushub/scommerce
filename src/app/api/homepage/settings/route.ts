import { NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll } from '@/db/db'
import { parseJSON } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: Request) {
  const env = getEnv(request)
  try {
    const settings = await queryAll(
      env,
      'SELECT * FROM homepage_settings'
    )

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
    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.sectionName] = {
        sectionName: setting.sectionName,
        isEnabled: setting.isEnabled,
        autoPlay: setting.autoPlay,
        displayLimit: setting.displayLimit,
        settings: setting.settings ? parseJSON(setting.settings) : null
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
