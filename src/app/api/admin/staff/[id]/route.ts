import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdmin } from '@/lib/auth-utils'
import { UserRepository } from '@/db/user.repository'
import bcrypt from 'bcryptjs'
import { count, numberToBool } from '@/db/db'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const env = getEnv(request)
    const user = await UserRepository.findById(env, params.id)

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
    const orderCount = await count(env, 'orders', 'WHERE userId = ?', user.id)

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
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const env = getEnv(request)
    const body = await request.json()
    const { email, name, password, role, phone, address } = body

    // Check if user exists
    const existingUser = await UserRepository.findById(env, params.id)

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
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const user = await UserRepository.update(env, params.id, updateData)

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
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const env = getEnv(request)

    // Check if user exists
    const existingUser = await UserRepository.findById(env, params.id)

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
    await UserRepository.delete(env, params.id)

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
