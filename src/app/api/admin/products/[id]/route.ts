import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { updateProductSchema } from '@/lib/validations'
import { queryFirst, execute, parseJSON, numberToBool } from '@/db/db'
import { logAdminAction } from '@/lib/audit-logger'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params

    const product = await queryFirst<any>(
      env,
      `SELECT p.*, c.name as categoryName, c.slug as categorySlug
       FROM products p
       LEFT JOIN categories c ON p.categoryId = c.id
       WHERE p.id = ? LIMIT 1`,
      id
    )

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: parseJSON<string[]>(product.images) || [],
        isActive: numberToBool(product.isActive),
        isFeatured: numberToBool(product.isFeatured),
        hasVariants: numberToBool(product.hasVariants),
      },
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const { id } = await params

    const existing = await ProductRepository.findById(env, id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const validation = updateProductSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    if (validatedData.slug && validatedData.slug !== existing.slug) {
      const slugExists = await ProductRepository.findBySlug(env, validatedData.slug)
      if (slugExists && slugExists.id !== id) {
        return NextResponse.json(
          { success: false, error: 'A product with this URL slug already exists' },
          { status: 409 }
        )
      }
    }

    const updated = await ProductRepository.update(env, id, validatedData as any)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update product' },
        { status: 500 }
      )
    }

    // Sync hasVariants flag after update
    await ProductRepository.syncHasVariants(env, id)

    // Fetch updated product with synced hasVariants
    const finalProduct = await ProductRepository.findById(env, id)

    // Log audit event
    const changes: string[] = []
    if (validatedData.name && validatedData.name !== existing.name) {
      changes.push(`name: "${existing.name}" → "${validatedData.name}"`)
    }
    if (validatedData.basePrice && validatedData.basePrice !== existing.basePrice) {
      changes.push(`price: ${existing.basePrice} → ${validatedData.basePrice}`)
    }
    if (typeof validatedData.isActive !== 'undefined' && validatedData.isActive !== numberToBool(existing.isActive)) {
      changes.push(`isActive: ${numberToBool(existing.isActive)} → ${validatedData.isActive}`)
    }
    const details = changes.length > 0
      ? `Updated product (ID: ${id}): ${changes.join(', ')}`
      : `Updated product (ID: ${id})`

    await logAdminAction(env, request, admin.id, 'UPDATE', 'Product', id, details)

    let category: any = null
    if (finalProduct && finalProduct.categoryId) {
      category = await CategoryRepository.findById(env, finalProduct.categoryId)
    }

    return NextResponse.json({
      success: true,
      data: { ...finalProduct, category },
    })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }

  try {
    const env = await getEnv()
    const { id } = await params

    const product = await queryFirst<any>(
      env,
      'SELECT id, name FROM products WHERE id = ? LIMIT 1',
      id
    )

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const orderItems = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM order_items WHERE productId = ? LIMIT 1',
      id
    )

    if (orderItems && orderItems.count > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete product: It has associated orders.' },
        { status: 400 }
      )
    }

    const inventoryAlerts = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM inventory_alerts WHERE productId = ? LIMIT 1',
      id
    )

    if (inventoryAlerts && inventoryAlerts.count > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete product: It has associated inventory alerts.' },
        { status: 400 }
      )
    }

    const inventoryReservations = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM inventory_reservations WHERE productId = ? LIMIT 1',
      id
    )

    if (inventoryReservations && inventoryReservations.count > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete product: It has active inventory reservations.' },
        { status: 400 }
      )
    }

    await execute(env, 'DELETE FROM product_variants WHERE productId = ?', id)
    await execute(env, 'DELETE FROM cart_items WHERE productId = ?', id)
    await execute(env, 'DELETE FROM wishlist_items WHERE productId = ?', id)
    await execute(env, 'DELETE FROM product_reviews WHERE productId = ?', id)
    await execute(env, 'DELETE FROM products WHERE id = ?', id)

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'Product',
      id,
      `Deleted product "${product.name}" (ID: ${id})`
    )

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
