import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { SupplierRepository } from '@/db/supplier.repository'
import { logAdminAction } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    // Get env - will be null in local dev, which is fine as SupplierRepository handles it
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let suppliers

    if (search) {
      suppliers = await SupplierRepository.search(env, search)
    } else {
      suppliers = await SupplierRepository.findAll(env, { activeOnly })
    }

    return NextResponse.json({
      success: true,
      data: suppliers,
      total: suppliers.length,
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suppliers',
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

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const body = await request.json()

    // Basic validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await SupplierRepository.create(env, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country,
      notes: body.notes,
      isActive: body.isActive !== undefined ? body.isActive : true,
    })

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'Supplier',
      supplier.id,
      `Created supplier "${body.name}" (ID: ${supplier.id})`
    )

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create supplier',
      },
      { status: 500 }
    )
  }
}
