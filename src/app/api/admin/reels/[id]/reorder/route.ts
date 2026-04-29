import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ReelRepository } from '@/db/reel.repository'

export const runtime = 'edge';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
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

    const reel = await ReelRepository.update(env, id, {
      orderNum: order
    })

    return NextResponse.json({
      success: true,
      data: reel
    })
  } catch (error) {
    console.error('Error reordering reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder reel'
      },
      { status: 500 }
    )
  }
}
