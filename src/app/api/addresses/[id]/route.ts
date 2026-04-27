import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, queryFirst, execute, boolToNumber, numberToBool, now } from '@/db/db'

export const runtime = 'edge';

/**
 * PUT /api/addresses/[id] - Update a saved address
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  // Get D1 database from request context
  const env = getEnv(request)

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
    const existingAddress = await queryFirst(
      env,
      'SELECT * FROM addresses WHERE id = ? AND userId = ? LIMIT 1',
      params.id,
      payload.userId
    )

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // If this is set as default, unset any existing default address
    if (body.isDefault && !numberToBool(existingAddress.isDefault)) {
      await execute(
        env,
        'UPDATE addresses SET isDefault = 0 WHERE userId = ? AND isDefault = 1 AND id != ?',
        payload.userId,
        params.id
      )
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: unknown[] = []

    if (body.fullName !== undefined) {
      updates.push('fullName = ?')
      values.push(body.fullName)
    }
    if (body.phone !== undefined) {
      updates.push('phone = ?')
      values.push(body.phone)
    }
    if (body.addressLine1 !== undefined) {
      updates.push('addressLine1 = ?')
      values.push(body.addressLine1)
    }
    if (body.addressLine2 !== undefined) {
      updates.push('addressLine2 = ?')
      values.push(body.addressLine2)
    }
    if (body.city !== undefined) {
      updates.push('city = ?')
      values.push(body.city)
    }
    if (body.district !== undefined) {
      updates.push('district = ?')
      values.push(body.district)
    }
    if (body.division !== undefined) {
      updates.push('division = ?')
      values.push(body.division)
    }
    if (body.postalCode !== undefined) {
      updates.push('postalCode = ?')
      values.push(body.postalCode)
    }
    if (body.isDefault !== undefined) {
      updates.push('isDefault = ?')
      values.push(boolToNumber(body.isDefault))
    }

    if (updates.length === 0) {
      // No changes, return existing address
      return NextResponse.json({
        success: true,
        data: { ...existingAddress, isDefault: numberToBool(existingAddress.isDefault) },
      })
    }

    updates.push('updatedAt = ?')
    values.push(now())
    values.push(params.id)

    await execute(
      env,
      `UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`,
      ...values
    )

    const address = await queryFirst(
      env,
      'SELECT * FROM addresses WHERE id = ? LIMIT 1',
      params.id
    )

    return NextResponse.json({
      success: true,
      data: address ? { ...address, isDefault: numberToBool(address.isDefault) } : null,
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
  // Get D1 database from request context
  const env = getEnv(request)

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
    const existingAddress = await queryFirst(
      env,
      'SELECT * FROM addresses WHERE id = ? AND userId = ? LIMIT 1',
      params.id,
      payload.userId
    )

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      )
    }

    // If deleting default address, make another one default if available
    if (numberToBool(existingAddress.isDefault)) {
      const otherAddresses = await queryAll(
        env,
        'SELECT * FROM addresses WHERE userId = ? AND id != ? LIMIT 1',
        payload.userId,
        params.id
      )

      if (otherAddresses.length > 0) {
        await execute(
          env,
          'UPDATE addresses SET isDefault = 1 WHERE id = ?',
          otherAddresses[0].id
        )
      }
    }

    await execute(
      env,
      'DELETE FROM addresses WHERE id = ?',
      params.id
    )

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
