import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ReelRepository } from '@/db/reel.repository'
import { queryFirst, generateId, now } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const reels = activeOnly
      ? await ReelRepository.findAllActive(env)
      : await ReelRepository.findAll(env)

    return NextResponse.json({
      success: true,
      data: reels
    })
  } catch (error) {
    console.error('Error fetching reels:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reels'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request)
    const body = await request.json()
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

    // Validate required fields
    if (!title || !thumbnail || !videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title, thumbnail, and videoUrl are required'
        },
        { status: 400 }
      )
    }

    // Get highest order value if not provided
    let reelOrder = order
    if (reelOrder === undefined || reelOrder === null) {
      const maxOrder = await queryFirst<{ orderNum: number }>(
        env,
        'SELECT orderNum FROM reels ORDER BY orderNum DESC LIMIT 1'
      )
      reelOrder = maxOrder ? maxOrder.orderNum + 1 : 0
    }

    const reel = await ReelRepository.create(env, {
      title,
      thumbnail,
      videoUrl,
      productIds: productIds || [],
      isActive: isActive !== undefined ? isActive : true,
      orderNum: reelOrder
    })

    return NextResponse.json({
      success: true,
      data: reel
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create reel'
      },
      { status: 500 }
    )
  }
}
