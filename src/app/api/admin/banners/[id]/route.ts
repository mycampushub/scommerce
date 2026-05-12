import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { BannerRepository } from '@/db/banner.repository'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const env = getEnv()
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = getEnv()
    const body = await request.json() as any
    const { id } = await params
    const { title, image, mobileImage } = body

    // Validate required fields if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Title cannot be empty'
          },
          { status: 400 }
        )
      }
    }

    if (image !== undefined) {
      if (typeof image !== 'string' || image.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Image cannot be empty'
          },
          { status: 400 }
        )
      }
      // Validate image URL
      try {
        new URL(image)
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid image URL'
          },
          { status: 400 }
        )
      }
    }

    if (mobileImage !== undefined) {
      if (mobileImage && mobileImage.trim().length > 0) {
        try {
          new URL(mobileImage)
        } catch (e) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid mobile image URL'
            },
            { status: 400 }
          )
        }
      }
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = getEnv()
    const { id } = await params
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
