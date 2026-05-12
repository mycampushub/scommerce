import { NextRequest, NextResponse } from 'next/server'
import { getEnv, isCloudflareEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { ReelRepositoryPrisma } from '@/db/reel-prisma.repository'
import { ReelRepository } from '@/db/reel.repository'
import { queryFirst } from '@/db/db'


export async function GET(request: NextRequest) {
  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    if (isCloudflareEnv()) {
      const reels = activeOnly
        ? await ReelRepository.findAllActive(env)
        : await ReelRepository.findAll(env)

      return NextResponse.json({
        success: true,
        data: reels
      })
    } else {
      const reels = activeOnly
        ? await ReelRepositoryPrisma.findAllActive(env)
        : await ReelRepositoryPrisma.findAll(env)

      return NextResponse.json({
        success: true,
        data: reels
      })
    }
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
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = getEnv()
    const body = await request.json() as any
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required'
        },
        { status: 400 }
      )
    }

    if (!thumbnail || typeof thumbnail !== 'string' || thumbnail.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thumbnail is required'
        },
        { status: 400 }
      )
    }

    // Validate thumbnail URL
    try {
      new URL(thumbnail)
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid thumbnail URL'
        },
        { status: 400 }
      )
    }

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video URL is required'
        },
        { status: 400 }
      )
    }

    // Validate video URL
    try {
      new URL(videoUrl)
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid video URL'
        },
        { status: 400 }
      )
    }

    // Get highest order value if not provided
    let reelOrder = order
    if (reelOrder === undefined || reelOrder === null) {
      if (isCloudflareEnv()) {
        const maxOrder = await queryFirst<{ orderNum: number }>(
          env,
          'SELECT orderNum FROM reels ORDER BY orderNum DESC LIMIT 1'
        )
        reelOrder = maxOrder ? maxOrder.orderNum + 1 : 0
      } else {
        const maxReel = await ReelRepositoryPrisma.findAll(env)
        reelOrder = maxReel.length > 0 ? Math.max(...maxReel.map(r => r.orderNum)) + 1 : 0
      }
    }

    const reel = isCloudflareEnv()
      ? await ReelRepository.create(env, {
          title,
          thumbnail,
          videoUrl,
          productIds: productIds || [],
          isActive: isActive !== undefined ? isActive : true,
          orderNum: reelOrder
        })
      : await ReelRepositoryPrisma.create(env, {
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
