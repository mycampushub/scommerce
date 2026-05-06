import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryAll, execute, queryFirst, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool } from '@/db/db'

interface SettingsData {
  general?: any
  storeDetails?: any
  shipping?: any
  payment?: any
  notifications?: any
  appearance?: any
  integrations?: any
}

export async function GET(request: NextRequest) {
  try {
    const env = getEnv()
    
    // Try to fetch settings from database
    const settings = await queryFirst<any>(
      env,
      'SELECT * FROM admin_settings LIMIT 1'
    )

    if (settings && settings.settingsData) {
      const parsedData = parseJSON<any>(settings.settingsData)
      return NextResponse.json({
        success: true,
        data: parsedData || {}
      })
    }

    // Return empty data if no settings exist
    return NextResponse.json({
      success: true,
      data: {
        general: {
          storeName: 'Fashion Store',
          storeEmail: 'store@fashion.com',
          storePhone: '+1 234 567890',
          timezone: 'Asia/Dhaka',
          currency: 'BDT (৳)',
          businessName: 'Fashion Inc.',
          businessAddress: '123 Fashion Street, New York, NY 10001',
          taxId: 'TAX-001',
          businessType: 'LLC',
          storeDesc: 'Welcome to Fashion Store - your destination for trendy and traditional clothing.',
          enableStore: true,
          maintenanceMode: false,
        },
        storeDetails: {
          logo: '',
          banner: '',
          announcements: [],
        },
        shipping: {
          freeShippingMin: 1000,
          freeShippingMessage: 'Free shipping on orders above ৳1000',
          shippingZones: [],
        },
        payment: {
          gateway: 'stripe',
          apiKey: '',
          enabled: true,
          sandbox: true,
          storeCreditCard: false,
          paypal: true,
          bankTransfer: false,
        },
        notifications: {
          email: true,
          sms: false,
          push: true,
          inApp: true,
          desktop: false,
        },
        appearance: {
          primaryColor: '#8b5cf6',
          secondaryColor: '#6366f1',
          fontFamily: 'Inter',
          borderRadius: '8px',
          customCSS: '',
        },
        integrations: [
          { name: 'Google Analytics', desc: 'Track visitor behavior and conversions', connected: false },
          { name: 'Facebook Pixel', desc: 'Track Facebook ads conversions', connected: false },
          { name: 'Google Tag Manager', desc: 'Manage all tags in one place', connected: false },
          { name: 'Hotjar', desc: 'Understand user behavior with heatmaps', connected: false },
        ],
      }
    })
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch admin settings',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
    const body = await request.json() as SettingsData

    // Validate that we have settings data
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Settings data is required'
        },
        { status: 400 }
      )
    }

    // Stringify settings data for storage
    const settingsData = stringifyJSON(body)

    // Check if settings exist
    const existing = await queryFirst<any>(
      env,
      'SELECT * FROM admin_settings LIMIT 1'
    )

    if (existing) {
      // Update existing settings
      await execute(
        env,
        'UPDATE admin_settings SET settingsData = ?, updatedAt = ? WHERE id = ?',
        settingsData,
        now(),
        existing.id
      )
    } else {
      // Create new settings record
      const id = generateId()
      await execute(
        env,
        'INSERT INTO admin_settings (id, settingsData, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        id,
        settingsData,
        now(),
        now()
      )
    }

    return NextResponse.json({
      success: true,
      data: body,
      message: 'Settings saved successfully'
    })
  } catch (error) {
    console.error('Error saving admin settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save admin settings',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
