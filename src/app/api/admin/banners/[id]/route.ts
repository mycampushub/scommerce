import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { BannerRepository } from '@/db/banner.repository'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    const banner = await BannerRepository.findById(env, id)

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
    console.error('Error fetching banner:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch banner',
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
    const body = await request.json()
    const { id } = await params

    const banner = await BannerRepository.update(env, id, {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.image !== undefined && { image: body.image }),
      ...(body.mobileImage !== undefined && { mobileImage: body.mobileImage }),
      ...(body.buttonText !== undefined && { buttonText: body.buttonText }),
      ...(body.buttonLink !== undefined && { buttonLink: body.buttonLink }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.order !== undefined && { orderNum: body.order }),
    })

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
    console.error('Error updating banner:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update banner',
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
    const { id } = await params
    const env = getEnv(request)
    await BannerRepository.delete(env, id)

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete banner',
      },
      { status: 500 }
    )
  }
}
