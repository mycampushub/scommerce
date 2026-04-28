import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { ReelRepository } from '@/db/reel.repository'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
    const reel = await ReelRepository.findById(env, id)

    if (!reel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reel not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reel
    })
  } catch (error) {
    console.error('Error fetching reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reel'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
    const body = await request.json()
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

    const reel = await ReelRepository.update(env, id, {
      title,
      thumbnail,
      videoUrl,
      productIds,
      isActive,
      orderNum: order
    })

    return NextResponse.json({
      success: true,
      data: reel
    })
  } catch (error) {
    console.error('Error updating reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reel'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const env = getEnv(request)
    const { id } = await params
    await ReelRepository.delete(env, id)

    return NextResponse.json({
      success: true,
      message: 'Reel deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete reel'
      },
      { status: 500 }
    )
  }
}
