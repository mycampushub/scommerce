import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { UserRepository } from '@/db/user.repository'
import { queryAll, count, numberToBool } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
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
        const orderCount = await count(env, 'orders', 'WHERE userId = ?', customer.id)
        return {
          ...customer,
          _count: { orders: orderCount },
          emailVerified: numberToBool(customer.emailVerified as number)
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
  try {
    const env = getEnv(request)
    const body = await request.json()

    const customer = await UserRepository.create(env, {
      email: body.email,
      name: body.name,
      password: 'tempPassword123', // TODO: Send password reset email to customer
      role: 'user' as any,
    })

    return NextResponse.json({
      success: true,
      data: { ...customer, emailVerified: numberToBool(customer.emailVerified as number) },
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
