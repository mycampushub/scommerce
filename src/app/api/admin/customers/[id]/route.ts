import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { queryFirst, execute, numberToBool, parseJSON } from '@/db/db'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params

    const user = await queryFirst<any>(
      env,
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      id
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    // Get order count
    const orderCount = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM orders WHERE userId = ?',
      id
    )

    // Get total spent
    const totalSpent = await queryFirst<{ total: number }>(
      env,
      'SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE userId = ? AND status NOT IN (?, ?, ?)',
      id,
      'CANCELLED',
      'REFUNDED',
      'FAILED'
    )

    // Parse JSON fields and convert booleans
    const customerWithParsedFields = {
      ...user,
      address: parseJSON<string>(user.address) || null,
      emailVerified: numberToBool(user.emailVerified as number),
      isBanned: numberToBool(user.isBanned as number),
      status: numberToBool(user.isBanned as number) ? 'banned' : 'active',
      isVIP: user.role === 'vip',
    }

    const responseData = {
      ...customerWithParsedFields,
      _count: {
        orders: orderCount?.count || 0,
      },
      totalSpent: totalSpent?.total || 0,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customer',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params
    const body = await request.json() as any

    // Check if customer exists
    const existingUser = await queryFirst<any>(
      env,
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      id
    )

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    // Prevent admin users from being deleted/banned by staff
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot modify admin users',
        },
        { status: 403 }
      )
    }

    // Build update fields
    const updates: string[] = []
    const values: any[] = []

    if (body.name !== undefined) {
      updates.push('name = ?')
      values.push(body.name)
    }

    if (body.email !== undefined && body.email !== existingUser.email) {
      // Check if email is already taken by another user
      const existingEmail = await queryFirst<any>(
        env,
        'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
        body.email,
        id
      )

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already in use',
          },
          { status: 409 }
        )
      }

      updates.push('email = ?')
      values.push(body.email)
    }

    if (body.phone !== undefined) {
      updates.push('phone = ?')
      values.push(body.phone)
    }

    if (body.address !== undefined) {
      const addressJson = typeof body.address === 'string'
        ? body.address
        : JSON.stringify(body.address)
      updates.push('address = ?')
      values.push(addressJson)
    }

    if (body.status !== undefined) {
      const isBanned = body.status === 'banned'
      updates.push('isBanned = ?')
      updates.push('bannedAt = ?')
      values.push(isBanned ? 1 : 0)
      values.push(isBanned ? new Date().toISOString() : null)
    }

    if (body.isVIP !== undefined) {
      updates.push('role = ?')
      // VIP customers have role 'vip', regular customers have 'user'
      values.push(body.isVIP ? 'vip' : 'user')
    }

    if (updates.length > 0) {
      updates.push('updatedAt = ?')
      values.push(new Date().toISOString())
      values.push(id)

      await execute(
        env,
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      )
    }

    // Fetch updated customer
    const updatedCustomer = await queryFirst<any>(
      env,
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      id
    )

    // Parse JSON fields and convert booleans
    const customerWithParsedFields = {
      ...updatedCustomer,
      address: parseJSON<string>(updatedCustomer.address) || null,
      emailVerified: numberToBool(updatedCustomer.emailVerified as number),
      isBanned: numberToBool(updatedCustomer.isBanned as number),
      status: numberToBool(updatedCustomer.isBanned as number) ? 'banned' : 'active',
      isVIP: updatedCustomer.role === 'vip',
    }

    return NextResponse.json({
      success: true,
      data: customerWithParsedFields,
      message: 'Customer updated successfully',
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update customer',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params

    // Check if customer exists
    const existingUser = await queryFirst<any>(
      env,
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      id
    )

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    // Prevent deleting admin users
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete admin users',
        },
        { status: 403 }
      )
    }

    // Delete customer (cascade will delete related records)
    await execute(env, 'DELETE FROM users WHERE id = ?', id)

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete customer',
      },
      { status: 500 }
    )
  }
}
