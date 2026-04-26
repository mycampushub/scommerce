import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const banner = await db.banner.update({
      where: { id },
      data: { order }
    })

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
