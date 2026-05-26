import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { generateSKU, checkSKUConflict } from '@/lib/sku-generator'
import { logAdminAction } from '@/lib/audit-logger'
import { z } from 'zod'
import { queryFirst, queryAll, execute, boolToNumber, numberToBool, parseJSON, stringifyJSON, now } from '@/db/db'


/**
 * Schema for variant creation
 */
const createVariantSchema = z.object({
  name: z.string().nullable().optional().default(''),
  price: z.union([z.number().min(0, 'Price must be positive'), z.null()]).optional().default(0),
  comparePrice: z.union([z.number(), z.null()]).optional(),
  costPrice: z.union([z.number().min(0), z.null()]).optional(),
  stock: z.union([z.number().int().min(0, 'Stock must be a non-negative integer'), z.null()]).default(0),
  images: z.union([z.array(z.string()), z.string(), z.null()]).optional().default([]),
  size: z.union([z.string(), z.null()]).optional(),
  color: z.union([z.string(), z.null()]).optional(),
  material: z.union([z.string(), z.null()]).optional(),
  isDefault: z.union([z.boolean(), z.null()]).default(false),
  isActive: z.union([z.boolean(), z.null()]).default(true),
  lowStockAlert: z.union([z.number().int().min(0), z.null()]).default(10),
  reorderLevel: z.union([z.number().int().min(0), z.null()]).default(5),
  reorderQty: z.union([z.number().int().min(0), z.null()]).default(20),
})

/**
 * GET /api/admin/products/[id]/variants
 * Get all variants for a product (admin view - includes inactive)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const { id } = await params

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch category for response
    let category: any = null
    if (product.categoryId) {
      category = await CategoryRepository.findById(env, product.categoryId)
    }

    // Fetch all variants for this product (including inactive)
    const variants = await queryAll<any>(
      env,
      'SELECT * FROM product_variants WHERE productId = ? ORDER BY isDefault DESC, size ASC, color ASC',
      id
    )

    // Parse images JSON field for each variant
    const variantsWithImages = variants.map((v: any) => ({
      ...v,
      images: parseJSON<string[]>(v.images) || [],
      isActive: typeof v.isActive === 'boolean' ? v.isActive : numberToBool(v.isActive),
      isDefault: typeof v.isDefault === 'boolean' ? v.isDefault : numberToBool(v.isDefault),
    }))

    return NextResponse.json({
      success: true,
      variants: variantsWithImages.map((variant) => ({
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
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      })),
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
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const { id } = await params

    console.log('[Variants API] Creating variant for product:', id)

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      console.error('[Variants API] Product not found:', id)
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log('[Variants API] Product found:', product.name)

    // Fetch category for SKU generation
    let category: any = null
    if (product.categoryId) {
      category = await CategoryRepository.findById(env, product.categoryId)
    }

    // Parse request body
    const body = await request.json() as any

    console.log('[Variants API] Request body:', body)

    // Normalize images (handle both array and string)
    let images: string[] = []
    if (body.images) {
      if (typeof body.images === 'string') {
        try {
          images = JSON.parse(body.images)
        } catch {
          images = [body.images]
        }
      } else if (Array.isArray(body.images)) {
        images = body.images
      }
    }

    // Generate variant name if not provided
    const variantParts = [body.size, body.color, body.material].filter(Boolean)
    const variantName = body.name || variantParts.join(' - ') || 'Default'

    // Preprocess data to handle null values
    const preprocessedData = {
      name: variantName,
      price: body.price ?? 0,
      comparePrice: body.comparePrice ?? undefined,
      costPrice: body.costPrice ?? undefined,
      stock: body.stock ?? 0,
      images: images.length > 0 ? images : [],
      size: body.size ?? undefined,
      color: body.color ?? undefined,
      material: body.material ?? undefined,
      isDefault: body.isDefault ?? false,
      isActive: body.isActive ?? true,
      lowStockAlert: body.lowStockAlert ?? 10,
      reorderLevel: body.reorderLevel ?? 5,
      reorderQty: body.reorderQty ?? 20,
    }

    // Validate input with normalized data
    const validatedData = createVariantSchema.parse(preprocessedData)

    // Generate SKU
    const sku = generateSKU(
      category?.slug || 'GEN',
      product.name,
      {
        size: validatedData.size ?? undefined,
        color: validatedData.color ?? undefined,
        material: validatedData.material ?? undefined,
      }
    )

    // Check for SKU conflicts
    const hasConflict = await checkSKUConflict(env, sku)
    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: 'SKU already exists. Please try again.' },
        { status: 400 }
      )
    }

    // If this is set as default, remove default from other variants
    if (validatedData.isDefault) {
      await execute(
        env,
        'UPDATE product_variants SET isDefault = 0 WHERE productId = ? AND isDefault = 1',
        id
      )
    }

    // Create variant
    const variant = await ProductRepository.createVariant(env, {
      productId: id,
      sku,
      name: validatedData.name ?? '',
      price: validatedData.price || 0,
      comparePrice: validatedData.comparePrice ?? undefined,
      costPrice: validatedData.costPrice ?? undefined,
      stock: validatedData.stock ?? 0,
      images: Array.isArray(validatedData.images) ? validatedData.images : [],
      size: validatedData.size ?? undefined,
      color: validatedData.color ?? undefined,
      material: validatedData.material ?? undefined,
      isActive: validatedData.isActive ?? true,
      isDefault: validatedData.isDefault ?? false,
      lowStockAlert: validatedData.lowStockAlert ?? 10,
      reorderLevel: validatedData.reorderLevel ?? 5,
      reorderQty: validatedData.reorderQty ?? 20,
    })

    // Sync hasVariants flag for the product
    await ProductRepository.syncHasVariants(env, id)

    // Log audit event
    await logAdminAction(
      env,
      request,
      userOrResponse.id,
      'CREATE',
      'ProductVariant',
      variant.id,
      `Created variant "${validatedData.name}" (SKU: ${sku}) for product "${product.name}"`
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
      },
      message: 'Variant created successfully',
    })
  } catch (error) {
    console.error('[Variants API] Error creating variant:', error)
    console.error('[Variants API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    })

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
        error: 'Failed to create variant',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
