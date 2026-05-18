import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { generateSKU, checkSKUConflict } from '@/lib/sku-generator'
import { logAdminAction } from '@/lib/audit-logger'
import { z } from 'zod'
import { queryFirst, queryAll, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now, count } from '@/db/db'


/**
 * Schema for variant update
 */
const updateVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  comparePrice: z.number().optional(),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, 'Stock must be positive').optional(),
  images: z.array(z.string()).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  reorderQty: z.number().int().min(0).optional(),
})

/**
 * GET /api/admin/products/[id]/variants/[variantId]
 * Get a specific variant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const env = await getEnv()
    const { id, variantId } = await params

    // Fetch variant
    const variant = await queryFirst<any>(
      env,
      'SELECT * FROM product_variants WHERE id = ? AND productId = ? LIMIT 1',
      variantId,
      id
    )

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        comparePrice: variant.comparePrice,
        costPrice: variant.costPrice,
        stock: variant.stock,
        images: parseJSON<string[]>(variant.images) || [],
        size: variant.size,
        color: variant.color,
        material: variant.material,
        isActive: typeof variant.isActive === 'boolean' ? variant.isActive : numberToBool(variant.isActive),
        isDefault: typeof variant.isDefault === 'boolean' ? variant.isDefault : numberToBool(variant.isDefault),
        lowStockAlert: variant.lowStockAlert,
        reorderLevel: variant.reorderLevel,
        reorderQty: variant.reorderQty,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching variant:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch variant',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/products/[id]/variants/[variantId]
 * Update a variant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const { id, variantId } = await params

    // Check if variant exists
    const existingVariant = await queryFirst<any>(
      env,
      'SELECT v.*, p.name as productName, p.categoryId FROM product_variants v JOIN products p ON v.productId = p.id WHERE v.id = ? AND v.productId = ? LIMIT 1',
      variantId,
      id
    )

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Fetch category for SKU generation
    let category: any = null
    if (existingVariant.categoryId) {
      category = await CategoryRepository.findById(env, existingVariant.categoryId)
    }

    // Parse request body
    const body: any = await request.json() as any

    // Validate input
    const validatedData = updateVariantSchema.parse(body)

    // If setting as default, remove default from other variants
    if (validatedData.isDefault === true && !numberToBool(existingVariant.isDefault)) {
      await execute(
        env,
        'UPDATE product_variants SET isDefault = 0 WHERE productId = ? AND isDefault = 1 AND id != ?',
        id,
        variantId
      )
    }

    // Regenerate SKU if size/color/material changed
    if (
      validatedData.size !== undefined ||
      validatedData.color !== undefined ||
      validatedData.material !== undefined
    ) {
      const newSku = generateSKU(
        category?.slug || 'GEN',
        existingVariant.productName,
        {
          size: validatedData.size ?? existingVariant.size,
          color: validatedData.color ?? existingVariant.color,
          material: validatedData.material ?? existingVariant.material,
        }
      )

      // Check for SKU conflicts (excluding this variant)
      const hasConflict = await checkSKUConflict(env, newSku, variantId)
      if (hasConflict) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists. Please try again.' },
          { status: 400 }
        )
      }

      // Update SKU using execute
      await execute(env, 'UPDATE product_variants SET sku = ? WHERE id = ?', newSku, variantId)
    }

    // Update variant
    const variant = await ProductRepository.updateVariant(env, variantId, {
      name: validatedData.name,
      price: validatedData.price,
      comparePrice: validatedData.comparePrice,
      costPrice: validatedData.costPrice,
      stock: validatedData.stock,
      images: validatedData.images,
      size: validatedData.size,
      color: validatedData.color,
      material: validatedData.material,
      isActive: validatedData.isActive !== undefined ? boolToNumber(validatedData.isActive) : undefined,
      isDefault: validatedData.isDefault !== undefined ? boolToNumber(validatedData.isDefault) : undefined,
      lowStockAlert: validatedData.lowStockAlert,
      reorderLevel: validatedData.reorderLevel,
      reorderQty: validatedData.reorderQty,
    })

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Failed to update variant' },
        { status: 500 }
      )
    }

    // Build details string for audit log
    const changes: string[] = []
    if (validatedData.name !== undefined && validatedData.name !== existingVariant.name) {
      changes.push(`name: "${existingVariant.name}" → "${validatedData.name}"`)
    }
    if (validatedData.price !== undefined && validatedData.price !== existingVariant.price) {
      changes.push(`price: ${existingVariant.price} → ${validatedData.price}`)
    }
    if (validatedData.stock !== undefined && validatedData.stock !== existingVariant.stock) {
      changes.push(`stock: ${existingVariant.stock} → ${validatedData.stock}`)
    }
    if (validatedData.isActive !== undefined) {
      const oldActive = numberToBool(existingVariant.isActive)
      changes.push(`active: ${oldActive} → ${validatedData.isActive}`)
    }
    const details = changes.length > 0 ? changes.join(', ') : 'Updated variant'

    // Log audit event
    await logAdminAction(
      env,
      request,
      userOrResponse.id,
      'UPDATE',
      'ProductVariant',
      variantId,
      `Updated variant "${variant.name}" (SKU: ${variant.sku}) for product "${existingVariant.productName}": ${details}`
    )

    return NextResponse.json({
      success: true,
      data: {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        comparePrice: variant.comparePrice,
        costPrice: variant.costPrice,
        stock: variant.stock,
        images: variant.images,
        size: variant.size,
        color: variant.color,
        material: variant.material,
        isActive: variant.isActive,
        isDefault: variant.isDefault,
        lowStockAlert: variant.lowStockAlert,
        reorderLevel: variant.reorderLevel,
        reorderQty: variant.reorderQty,
      },
      message: 'Variant updated successfully',
    })
  } catch (error) {
    console.error('Error updating variant:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update variant',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/products/[id]/variants/[variantId]
 * Delete a variant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  const env = await getEnv()

  try {
    const env = await getEnv()
    const { id, variantId } = await params

    // Check if variant exists
    const variant = await queryFirst<any>(
      env,
      'SELECT * FROM product_variants WHERE id = ? AND productId = ? LIMIT 1',
      variantId,
      id
    )

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Check if variant is used in active orders
    const activeOrdersResult = await queryFirst<{ count: number }>(
      env,
      'SELECT COUNT(*) as count FROM order_items oi JOIN orders o ON oi.orderId = o.id WHERE oi.variantId = ? AND o.status NOT IN (?, ?)',
      variantId,
      'CANCELLED',
      'REFUNDED'
    )
    const activeOrders = activeOrdersResult?.count || 0

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete variant: ${activeOrders} active order(s) reference this variant`,
        },
        { status: 400 }
      )
    }

    // Delete variant
    await ProductRepository.deleteVariant(env, variantId)

    // Sync hasVariants flag for the product
    await ProductRepository.syncHasVariants(env, id)

    // Log audit event
    await logAdminAction(
      env,
      request,
      userOrResponse.id,
      'DELETE',
      'ProductVariant',
      variantId,
      `Deleted variant "${variant.name}" (SKU: ${variant.sku}) from product "${id}"`
    )

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete variant',
      },
      { status: 500 }
    )
  }
}
