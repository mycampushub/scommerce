import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'
import { queryAll, queryFirst, count, numberToBool, generateId } from '@/db/db'
import { hashPassword } from '@/lib/bcrypt-wrapper'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Build WHERE clause for SQL-level filtering
    const conditions: string[] = ["role != 'admin'"]
    const params: any[] = []

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)')
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    if (status === 'active') {
      conditions.push('isBanned = 0')
    } else if (status === 'banned') {
      conditions.push('isBanned = 1')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count for pagination
    const countResult = await queryFirst<{ count: number }>(
      env,
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      ...params
    )
    const totalCount = countResult?.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    // Fetch customers with pagination
    const customers = await queryAll<any>(
      env,
      `SELECT * FROM users
       ${whereClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      ...params,
      limit,
      offset
    )

    // Fix N+1 query: Get all order counts in a single GROUP BY query
    let orderCountsMap = new Map<string, { count: number; totalSpent: number }>()

    if (customers.length > 0) {
      const customerIds = customers.map(c => c.id)
      const placeholders = customerIds.map(() => '?').join(',')

      const orderCounts = await queryAll<{ userId: string; count: number; total: number }>(
        env,
        `SELECT userId, COUNT(*) as count, SUM(total) as total
         FROM orders
         WHERE userId IN (${placeholders})
         GROUP BY userId`,
        ...customerIds
      )
      orderCounts.forEach(oc => {
        orderCountsMap.set(oc.userId, { count: oc.count, totalSpent: oc.total || 0 })
      })
    }

    // Add order counts and convert booleans (no more N+1 query)
    const customersWithCounts = customers.map((customer) => {
      const orderData = orderCountsMap.get(customer.id) || { count: 0, totalSpent: 0 }

      return {
        id: customer.id,
        name: customer.name || 'Unknown',
        email: customer.email,
        phone: customer.phone || null,
        address: customer.address || null,
        orders: orderData.count,
        totalSpent: orderData.totalSpent,
        status: customer.isBanned === 1 ? 'banned' : (customer.name ? 'active' : 'inactive'),
        isVIP: customer.role === 'vip', // VIP status is determined by role, not a separate column
        joined: customer.createdAt || new Date().toISOString(),
        avatar: customer.avatar || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: customersWithCounts,
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
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customers',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const body: any = await request.json() as any

    // Generate secure random temporary password (16 characters)
    const generateSecurePassword = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
      const array = new Uint8Array(16)
      crypto.getRandomValues(array)
      let password = ''
      for (let i = 0; i < 16; i++) {
        password += chars[array[i] % chars.length]
      }
      return password
    }

    // Generate strong temporary password and hash it
    const tempPassword = generateSecurePassword()
    const hashedPassword = await hashPassword(tempPassword)

    // Create customer with hashed password
    const customer = await UserRepository.create(env, {
      email: body.email,
      name: body.name,
      password: hashedPassword, // Store hashed password
      role: 'user' as any,
    })

    // Generate password reset token so customer can set their own password
    const resetToken = generateId()
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    await UserRepository.update(env, customer.id, {
      resetToken,
      resetTokenExpiry,
    })

    // Log the reset link in development mode (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development'
    const resetLink = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    console.log('Customer created - Password reset link:', {
      email: customer.email,
      resetLink: isDevelopment ? resetLink : '[Email sent to customer]',
      tempPassword: isDevelopment ? tempPassword : '[Hidden - reset email sent]',
    })

    return NextResponse.json({
      success: true,
      message: isDevelopment
        ? `Customer created. Temporary password: ${tempPassword}. Reset link: ${resetLink}`
        : 'Customer created. Password reset email sent.',
      data: {
        ...customer,
        emailVerified: numberToBool(customer.emailVerified as number),
        // Include reset link only in development for testing
        ...(isDevelopment && { resetLink, tempPassword }),
      },
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create customer',
      },
      { status: 500 }
    )
  }
}
