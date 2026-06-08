import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { UserRepository } from '@/db/user.repository'
import { hashPassword } from '@/lib/bcrypt-wrapper'
import { queryAll, count, numberToBool } from '@/db/db'


export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    let users = await queryAll<any>(
      env,
      'SELECT * FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      limit,
      offset
    )

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

    // Convert boolean numbers and add order counts in a single query
    const userIds = users.map(u => u.id).filter(Boolean)
    const orderCountMap = new Map<string, number>()

    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      const orderCounts = await queryAll<any>(
        env,
        `SELECT userId, COUNT(*) as count FROM orders WHERE userId IN (${placeholders}) GROUP BY userId`,
        userIds
      )
      orderCounts.forEach((oc: any) => orderCountMap.set(oc.userId, oc.count))
    }

    users = users.map(user => ({
      ...user,
      _count: { orders: orderCountMap.get(user.id) || 0 },
      emailVerified: numberToBool(user.emailVerified)
    }))

    // Get total count for pagination
    const countWhereClause = role ? `WHERE role = '${role}'` : `WHERE role != 'user'`
    const countResult = await count(env, 'users', countWhereClause)
    const totalCount = countResult || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    const body: any = await request.json() as any
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
    const existingUser = await UserRepository.findByEmail(env, email)

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
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await UserRepository.create(env, {
      email,
      name,
      password: hashedPassword,
      role: role as any,
      emailVerified: true, // Auto-verify admin/staff accounts
    })

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
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
