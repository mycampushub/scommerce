import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSKU, checkSKUConflict } from '@/lib/sku-generator'
import { z } from 'zod'

/**
 * Schema for variant creation
 */
const createVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().min(0, 'Price must be positive'),
  comparePrice: z.number().optional(),
  stock: z.number().int().min(0, 'Stock must be positive'),
  images: z.array(z.string()).optional().default([]),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  lowStockAlert: z.number().int().min(0).default(10),
  reorderLevel: z.number().int().min(0).default(5),
  reorderQty: z.number().int().min(0).default(20),
})

/**
 * GET /api/admin/products/[id]/variants
 * Get all variants for a product (admin view - includes inactive)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch all variants for this product (including inactive)
    const variants = await db.productVariant.findMany({
      where: {
        productId: id,
      },
      orderBy: [
        { isDefault: 'desc' },
        { size: 'asc' },
        { color: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          categorySlug: product.category?.slug || 'GEN',
        },
        variants: variants.map((variant) => ({
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
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching product variants:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product variants',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/products/[id]/variants
 * Create a new variant for a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input
    const validatedData = createVariantSchema.parse(body)

    // Generate SKU
    const sku = generateSKU(
      product.category?.slug || 'GEN',
      product.name,
      {
        size: validatedData.size,
        color: validatedData.color,
        material: validatedData.material,
      }
    )

    // Check for SKU conflicts
    const hasConflict = await checkSKUConflict(sku)
    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: 'SKU already exists. Please try again.' },
        { status: 400 }
      )
    }

    // If this is set as default, remove default from other variants
    if (validatedData.isDefault) {
      await db.productVariant.updateMany({
        where: {
          productId: id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Create variant
    const variant = await db.productVariant.create({
      data: {
        productId: id,
        sku,
        name: validatedData.name,
        price: validatedData.price,
        comparePrice: validatedData.comparePrice,
        stock: validatedData.stock,
        images: JSON.stringify(validatedData.images),
        size: validatedData.size,
        color: validatedData.color,
        material: validatedData.material,
        isDefault: validatedData.isDefault,
        isActive: validatedData.isActive,
        lowStockAlert: validatedData.lowStockAlert,
        reorderLevel: validatedData.reorderLevel,
        reorderQty: validatedData.reorderQty,
      },
    })

    // Update product to indicate it has variants
    if (!product.hasVariants) {
      await db.product.update({
        where: { id },
        data: { hasVariants: true },
      })
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
      },
      message: 'Variant created successfully',
    })
  } catch (error) {
    console.error('Error creating variant:', error)

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
        error: 'Failed to create variant',
      },
      { status: 500 }
    )
  }
}
