import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const reel = await db.reel.findUnique({
      where: { id }
    })

    if (!reel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reel not found'
        },
        { status: 404 }
      )
    }

    // Parse productIds JSON
    const reelWithParsedProductIds = {
      ...reel,
      productIds: reel.productIds ? JSON.parse(reel.productIds) : []
    }

    return NextResponse.json({
      success: true,
      data: reelWithParsedProductIds
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
    const { id } = await params
    const body = await request.json()
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

    const reel = await db.reel.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(productIds !== undefined && { productIds: JSON.stringify(Array.isArray(productIds) ? productIds : []) }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order })
      }
    })

    // Return with parsed productIds
    const reelWithParsedProductIds = {
      ...reel,
      productIds: reel.productIds ? JSON.parse(reel.productIds) : []
    }

    return NextResponse.json({
      success: true,
      data: reelWithParsedProductIds
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
    const { id } = await params
    await db.reel.delete({
      where: { id }
    })

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
