import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSKU, checkSKUConflict } from '@/lib/sku-generator'
import { z } from 'zod'

/**
 * Schema for variant update
 */
const updateVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  comparePrice: z.number().optional(),
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
    const { id, variantId } = await params

    // Fetch variant
    const variant = await db.productVariant.findUnique({
      where: {
        id: variantId,
        productId: id,
      },
    })

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
        stock: variant.stock,
        images: variant.images ? JSON.parse(variant.images) : null,
        size: variant.size,
        color: variant.color,
        material: variant.material,
        isActive: variant.isActive,
        isDefault: variant.isDefault,
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
  try {
    const { id, variantId } = await params

    // Check if variant exists
    const existingVariant = await db.productVariant.findUnique({
      where: {
        id: variantId,
        productId: id,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input
    const validatedData = updateVariantSchema.parse(body)

    // If images provided, stringify them for storage
    const updateData: any = { ...validatedData }
    if (validatedData.images) {
      updateData.images = JSON.stringify(validatedData.images)
    }

    // If setting as default, remove default from other variants
    if (validatedData.isDefault === true && !existingVariant.isDefault) {
      await db.productVariant.updateMany({
        where: {
          productId: id,
          isDefault: true,
          id: { not: variantId },
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Regenerate SKU if size/color/material changed
    if (
      validatedData.size !== undefined ||
      validatedData.color !== undefined ||
      validatedData.material !== undefined
    ) {
      const newSku = generateSKU(
        existingVariant.product.category?.slug || 'GEN',
        existingVariant.product.name,
        {
          size: validatedData.size ?? existingVariant.size,
          color: validatedData.color ?? existingVariant.color,
          material: validatedData.material ?? existingVariant.material,
        }
      )

      // Check for SKU conflicts (excluding this variant)
      const hasConflict = await checkSKUConflict(newSku, variantId)
      if (hasConflict) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists. Please try again.' },
          { status: 400 }
        )
      }

      updateData.sku = newSku
    }

    // Update variant
    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        comparePrice: variant.comparePrice,
        stock: variant.stock,
        images: variant.images ? JSON.parse(variant.images) : null,
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
          details: error.errors,
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
  try {
    const { id, variantId } = await params

    // Check if variant exists
    const variant = await db.productVariant.findUnique({
      where: {
        id: variantId,
        productId: id,
      },
    })

    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Check if variant is used in active orders or cart
    const activeOrders = await db.orderItem.count({
      where: {
        variantId,
        order: {
          status: {
            notIn: ['CANCELLED', 'REFUNDED'],
          },
        },
      },
    })

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
    await db.productVariant.delete({
      where: { id: variantId },
    })

    // Check if product has any remaining variants
    const remainingVariants = await db.productVariant.count({
      where: { productId: id },
    })

    if (remainingVariants === 0) {
      await db.product.update({
        where: { id },
        data: { hasVariants: false },
      })
    }

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
