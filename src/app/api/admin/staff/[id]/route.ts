import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { UserRepository } from '@/db/user.repository'
import { hashPassword } from '@/lib/bcrypt-wrapper'
import { count, numberToBool } from '@/db/db'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    const user = await UserRepository.findById(env, (await params).id)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Get order count
    const orderCount = await count(env, 'SELECT COUNT(*) as count FROM orders WHERE userId = ?', user.id)

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        emailVerified: numberToBool(user.emailVerified),
        _count: { orders: orderCount },
      },
    })
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staff member',
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
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    const body: any = await request.json() as any
    const { email, name, password, role, phone, address } = body

    // Check if user exists
    const existingUser = await UserRepository.findById(env, (await params).id)

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Prevent modifying the last admin
    if (existingUser.role === 'admin' && role === 'staff') {
      const adminCount = await UserRepository.count(env, 'admin' as any)

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot change the role of the last admin user',
          },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      name,
      phone,
      address,
    }

    // Update role if provided
    if (role) {
      if (role !== 'admin' && role !== 'staff') {
        return NextResponse.json(
          {
            success: false,
            error: 'Role must be either admin or staff',
          },
          { status: 400 }
        )
      }
      updateData.role = role
    }

    // Update password if provided
    if (password && password.length > 0) {
      updateData.password = await hashPassword(password)
    }

    // Update user
    const user = await UserRepository.update(env, (await params).id, updateData)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update staff member',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        updatedAt: user.updatedAt,
      },
      message: 'Staff member updated successfully',
    })
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update staff member',
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
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    // Check if user exists
    const existingUser = await UserRepository.findById(env, (await params).id)

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Prevent deleting admin
    if (existingUser.role === 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete admin users',
        },
        { status: 400 }
      )
    }

    // Delete user
    await UserRepository.delete(env, (await params).id)

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete staff member',
      },
      { status: 500 }
    )
  }
}
