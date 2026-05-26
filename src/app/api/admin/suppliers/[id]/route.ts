import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { SupplierRepository } from '@/db/supplier.repository'
import { queryFirst } from '@/db/db'
import { logAdminAction } from '@/lib/audit-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const supplier = await SupplierRepository.findById(env, (await params).id)

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch supplier',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const body = await request.json()
    const id = (await params).id

    // Get existing supplier for audit log
    const existing = await SupplierRepository.findById(env, id)
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      )
    }

    const supplier = await SupplierRepository.update(env, id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country,
      isActive: body.isActive,
    })

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      )
    }

    // Log audit event
    const changes: string[] = []
    if (body.name && body.name !== existing.name) {
      changes.push(`name: "${existing.name}" → "${body.name}"`)
    }
    if (typeof body.isActive !== 'undefined' && body.isActive !== (existing.isActive === 1)) {
      changes.push(`isActive: ${existing.isActive === 1} → ${body.isActive}`)
    }
    const details = changes.length > 0
      ? `Updated supplier "${existing.name}" (ID: ${id}): ${changes.join(', ')}`
      : `Updated supplier "${existing.name}" (ID: ${id})`

    await logAdminAction(env, request, admin.id, 'UPDATE', 'Supplier', id, details)

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const id = (await params).id

    // Check if supplier exists
    const supplier = await SupplierRepository.findById(env, id)
    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier not found',
        },
        { status: 404 }
      )
    }

    // Check if supplier has purchase orders
    const poCount = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM purchase_orders WHERE supplierId = ?',
      id
    )
    if (poCount && poCount.count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete supplier: It has ${poCount.count} purchase order${poCount.count > 1 ? 's' : ''}. Please delete or reassign the purchase orders first.`,
        },
        { status: 400 }
      )
    }

    await SupplierRepository.delete(env, id)

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'Supplier',
      id,
      `Deleted supplier "${supplier.name}" (ID: ${id})`
    )

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete supplier'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
