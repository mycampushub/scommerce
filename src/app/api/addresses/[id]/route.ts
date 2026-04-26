import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

/**
 * PUT /api/addresses/[id] - Update a saved address
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params

  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify address belongs to user
    const existingAddress = await db.address.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // If this is set as default, unset any existing default address
    if (body.isDefault && !existingAddress.isDefault) {
      await db.address.updateMany({
        where: {
          userId: payload.userId,
          isDefault: true,
          id: { not: params.id },
        },
        data: { isDefault: false },
      })
    }

    const address = await db.address.update({
      where: { id: params.id },
      data: {
        fullName: body.fullName !== undefined ? body.fullName : existingAddress.fullName,
        phone: body.phone !== undefined ? body.phone : existingAddress.phone,
        addressLine1: body.addressLine1 !== undefined ? body.addressLine1 : existingAddress.addressLine1,
        addressLine2: body.addressLine2 !== undefined ? body.addressLine2 : existingAddress.addressLine2,
        city: body.city !== undefined ? body.city : existingAddress.city,
        district: body.district !== undefined ? body.district : existingAddress.district,
        division: body.division !== undefined ? body.division : existingAddress.division,
        postalCode: body.postalCode !== undefined ? body.postalCode : existingAddress.postalCode,
        isDefault: body.isDefault !== undefined ? body.isDefault : existingAddress.isDefault,
      },
    })

    return NextResponse.json({
      success: true,
      data: address,
    })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/addresses/[id] - Delete a saved address
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params

  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Verify address belongs to user
    const existingAddress = await db.address.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      )
    }

    // If deleting default address, make another one default if available
    if (existingAddress.isDefault) {
      const otherAddresses = await db.address.findMany({
        where: {
          userId: payload.userId,
          id: { not: params.id },
        },
        take: 1,
      })

      if (otherAddresses.length > 0) {
        await db.address.update({
          where: { id: otherAddresses[0].id },
          data: { isDefault: true },
        })
      }
    }

    await db.address.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}
