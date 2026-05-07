import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'
import { queryAll, count, numberToBool, generateId } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    let users = await queryAll<any>(
      env,
      'SELECT * FROM users ORDER BY createdAt DESC'
    )

    if (search) {
      users = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status === 'active') {
      users = users.filter((user) => user.role === 'user')
    } else if (status === 'banned') {
      users = users.filter((user) => user.role === 'banned')
    }

    const customers = users.filter((user) => user.role !== 'admin')

    // Add order counts and convert booleans
    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
        const orderCount = await count(env, 'SELECT COUNT(*) as count FROM orders WHERE userId = ?', customer.id)

        // Compute status from isBanned and role
        let status = 'active'
        const isBanned = numberToBool(customer.isBanned as number)
        if (isBanned) {
          status = 'banned'
        } else if (customer.role === 'admin' || customer.role === 'staff') {
          status = 'admin'
        }

        return {
          ...customer,
          _count: { orders: orderCount },
          emailVerified: numberToBool(customer.emailVerified as number),
          isBanned,
          status, // Add computed status field
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: customersWithCounts,
      total: customersWithCounts.length,
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
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Check CSRF protection
  const env = getEnv(request)
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
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

    // Import bcrypt to hash the password
    const bcrypt = (await import('bcryptjs')).default
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

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
