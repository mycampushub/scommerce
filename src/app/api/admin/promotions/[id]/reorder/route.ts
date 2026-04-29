import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, execute, now } from '@/db/db'

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

    await execute(
      env,
      'UPDATE promotions SET `order` = ?, updatedAt = ? WHERE id = ?',
      order,
      now(),
      id
    )

    const promotion = await queryFirst<any>(
      env,
      'SELECT * FROM promotions WHERE id = ? LIMIT 1',
      id
    )

    return NextResponse.json({
      success: true,
      data: promotion
    })
  } catch (error) {
    console.error('Error reordering promotion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder promotion'
      },
      { status: 500 }
    )
  }
}
