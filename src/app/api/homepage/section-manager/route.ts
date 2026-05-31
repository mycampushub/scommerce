import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, parseJSON } from '@/db/db'

const SECTION_NAME = 'section-manager'

// Define all available homepage sections with their default order
const DEFAULT_SECTIONS = [
  { id: 'fullscreen-video', name: 'Fullscreen Video', order: 1, enabled: true },
  { id: 'hero-slider', name: 'Hero Carousel', order: 2, enabled: true },
  { id: 'marquee', name: 'Marquee Banner', order: 3, enabled: true },
  { id: 'categories', name: 'Categories', order: 4, enabled: true },
  { id: 'category-carousel', name: 'Category Carousel', order: 5, enabled: true },
  { id: 'brands', name: 'Brand Carousel', order: 6, enabled: true },
  { id: 'featured-products', name: 'Featured Products', order: 7, enabled: true },
  { id: 'mosaic-grid', name: 'Mosaic Grid', order: 8, enabled: true },
  { id: 'video-reels', name: 'Video Reels', order: 9, enabled: true },
  { id: 'promotions', name: 'Promotions', order: 10, enabled: true },
  { id: 'stories', name: 'Stories', order: 11, enabled: true },
]

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()
    if (!env) {
      console.error('[Section Manager GET] No env available')
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      // Return default sections
      return NextResponse.json({
        success: true,
        data: {
          sections: DEFAULT_SECTIONS,
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}
    const savedSections = settings.sections || []

    // Merge saved sections with defaults to include new sections
    const mergedSections = DEFAULT_SECTIONS.map(defaultSection => {
      const savedSection = savedSections.find((s: any) => s.id === defaultSection.id)
      return {
        ...defaultSection,
        ...(savedSection || {}),
        enabled: savedSection?.enabled !== undefined ? savedSection.enabled : defaultSection.enabled,
        order: savedSection?.order !== undefined ? savedSection.order : defaultSection.order,
      }
    }).sort((a, b) => a.order - b.order)

    return NextResponse.json({
      success: true,
      data: {
        sections: mergedSections,
      }
    })
  } catch (error) {
    console.error('Error fetching section manager settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch section manager settings'
      },
      { status: 500 }
    )
  }
}