import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const banner = await db.banner.findUnique({
      where: { id },
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
      data: banner,
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
    const body = await request.json()
    const { id } = await params
    
    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.mobileImage !== undefined && { mobileImage: body.mobileImage }),
        ...(body.buttonText !== undefined && { buttonText: body.buttonText }),
        ...(body.buttonLink !== undefined && { buttonLink: body.buttonLink }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.order !== undefined && { order: body.order }),
      },
    })

    return NextResponse.json({
      success: true,
      data: banner,
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
    await db.banner.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully',
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
