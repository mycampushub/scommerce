import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, execute, queryFirst, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool } from '@/db/db'

export const runtime = 'edge';

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

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const settings = await queryAll<any>(
      env,
      'SELECT * FROM homepage_settings'
    )

    // If no settings exist, return defaults
    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        data: Object.values(DEFAULT_SETTINGS)
      })
    }

    // Parse JSON fields and convert booleans
    const settingsWithParsedData = settings.map((s: any) => ({
      ...s,
      settings: parseJSON<any>(s.settings) || null,
      isEnabled: typeof s.isEnabled === 'boolean' ? s.isEnabled : numberToBool(s.isEnabled),
    }))

    return NextResponse.json({
      success: true,
      data: settingsWithParsedData
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
    const env = getEnv(request)
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

        // Check if setting exists
        const existing = await queryFirst<any>(
          env,
          'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
          sectionName
        )

        if (existing) {
          // Update existing setting
          const updates: string[] = []
          const params: any[] = []

          if (isEnabled !== undefined) {
            updates.push('isEnabled = ?')
            params.push(boolToNumber(isEnabled))
          }
          if (autoPlay !== undefined) {
            updates.push('autoPlay = ?')
            params.push(autoPlay)
          }
          if (displayLimit !== undefined) {
            updates.push('displayLimit = ?')
            params.push(displayLimit)
          }
          if (customSettings !== undefined) {
            updates.push('settings = ?')
            params.push(stringifyJSON(customSettings))
          }

          if (updates.length > 0) {
            updates.push('updatedAt = ?')
            params.push(now())
            params.push(sectionName)

            await execute(
              env,
              `UPDATE homepage_settings SET ${updates.join(', ')} WHERE sectionName = ?`,
              ...params
            )
          }

          // Fetch updated setting
          return await queryFirst<any>(
            env,
            'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
            sectionName
          )
        } else {
          // Create new setting
          const id = generateId()
          const currentTime = now()

          await execute(
            env,
            `INSERT INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            sectionName,
            boolToNumber(isEnabled !== undefined ? isEnabled : true),
            autoPlay !== undefined ? autoPlay : 5000,
            displayLimit || null,
            customSettings ? stringifyJSON(customSettings) : null,
            currentTime,
            currentTime
          )

          // Fetch created setting
          return await queryFirst<any>(
            env,
            'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
            sectionName
          )
        }
      })
    )

    // Parse JSON fields and convert booleans
    const settingsWithParsedData = updatedSettings.map((s: any) => ({
      ...s,
      settings: parseJSON<any>(s.settings) || null,
      isEnabled: typeof s.isEnabled === 'boolean' ? s.isEnabled : numberToBool(s.isActive),
    }))

    return NextResponse.json({
      success: true,
      data: settingsWithParsedData
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
