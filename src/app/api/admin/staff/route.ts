import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdmin } from '@/lib/auth-utils'
import { UserRepository } from '@/db/user.repository'
import bcrypt from 'bcryptjs'
import { queryAll, count, numberToBool } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'


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

    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'name', 'email', 'role', 'orders']
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Build WHERE clause for filters
    const conditions: string[] = []
    const params: unknown[] = []

    // Apply search to SQL WHERE clause
    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    // Apply role filter to SQL WHERE clause
    if (role) {
      conditions.push('role = ?')
      params.push(role)
    } else {
      // Only show admin and staff users by default
      conditions.push("role != 'user'")
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Fetch staff with pagination and sorting
    let users = await queryAll<any>(
      env,
      `SELECT * FROM users ${whereClause} ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    // Fetch order counts for all staff in a single query (fixes N+1 query issue)
    if (users.length > 0) {
      const userIds = users.map((u: any) => u.id)
      const placeholders = userIds.map(() => '?').join(',')

      const orderCounts = await queryAll<any>(
        env,
        `SELECT userId, COUNT(*) as orderCount
         FROM orders
         WHERE userId IN (${placeholders})
         GROUP BY userId`,
        ...userIds
      )

      // Create a map of userId -> orderCount
      const orderCountMap = new Map<string, number>()
      for (const oc of orderCounts) {
        orderCountMap.set(oc.userId, oc.orderCount)
      }

      // Add order counts to users
      users = users.map((user: any) => ({
        ...user,
        _count: { orders: orderCountMap.get(user.id) || 0 },
        emailVerified: numberToBool(user.emailVerified)
      }))
    } else {
      // No staff, just convert booleans
      users = users.map((user: any) => ({
        ...user,
        _count: { orders: 0 },
        emailVerified: numberToBool(user.emailVerified)
      }))
    }

    // Get total count for pagination
    const totalStaff = await count(
      env,
      `SELECT COUNT(*) FROM users ${whereClause}`,
      ...params
    )

    const totalPages = Math.ceil(totalStaff / limit)

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalStaff,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      sort: {
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      },
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staff',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
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

    // Check CSRF protection
    const env = getEnv()
    const csrfError = await csrfMiddleware(request, env)
    if (csrfError) {
      return csrfError
    }

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
    const hashedPassword = await bcrypt.hash(password, 10)

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
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
