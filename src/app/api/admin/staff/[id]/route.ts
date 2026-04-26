import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'

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

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
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

    const body = await request.json()
    const { email, name, password, role, phone, address } = body

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

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
      const adminCount = await db.user.count({
        where: { role: 'admin' },
      })

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
    const user = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
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

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Prevent deleting the admin
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
    await db.user.delete({
      where: { id: params.id },
    })

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
