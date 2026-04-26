import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const stories = await db.story.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Parse images JSON
    const storiesWithParsedImages = stories.map(story => ({
      ...story,
      images: JSON.parse(story.images || '[]')
    }))

    return NextResponse.json({
      success: true,
      data: storiesWithParsedImages
    })
  } catch (error) {
    console.error('Error fetching stories:', error)
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    })
  }
}
