import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const reels = await db.reel.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Parse productIds JSON
    const reelsWithParsedProductIds = reels.map(reel => ({
      ...reel,
      productIds: reel.productIds ? JSON.parse(reel.productIds) : []
    }))

    return NextResponse.json({
      success: true,
      data: reelsWithParsedProductIds
    })
  } catch (error) {
    console.error('Error fetching reels:', error)
    // Return empty array on error instead of failing
    return NextResponse.json({
      success: false,
      data: []
    })
  }
}
