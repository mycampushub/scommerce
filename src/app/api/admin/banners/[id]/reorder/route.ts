import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { BannerRepository } from '@/db/banner.repository'

export const runtime = 'edge';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    const body = await request.json()
    const { order } = body

    if (order === undefined || order === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is required'
        },
        { status: 400 }
      )
    }

    const banner = await BannerRepository.update(env, id, { orderNum: order })

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Banner not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: banner
    })
  } catch (error) {
    console.error('Error reordering banner:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder banner'
      },
      { status: 500 }
    )
  }
}
