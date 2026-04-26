import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdmin } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    let users = await db.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    // Filter by role (admin/staff)
    if (role) {
      users = users.filter((user) => user.role === role)
    } else {
      // Only show admin and staff users by default
      users = users.filter((user) => user.role !== 'user')
    }

    // Search functionality
    if (search) {
      users = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staff',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const { email, name, password, role } = body

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, name, password, and role are required',
        },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json(
        {
          success: false,
          error: 'Role must be either admin or staff',
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        emailVerified: true, // Auto-verify admin/staff accounts
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Staff member created successfully',
    })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create staff member',
      },
      { status: 500 }
    )
  }
}
