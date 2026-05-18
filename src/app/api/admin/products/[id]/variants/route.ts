import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { CategoryRepository } from '@/db/category.repository'
import { generateSKU, checkSKUConflict } from '@/lib/sku-generator'
import { logAdminAction } from '@/lib/audit-logger'
import { z } from 'zod'
import { queryFirst, queryAll, execute, boolToNumber, parseJSON, stringifyJSON, now } from '@/db/db'


/**
 * Schema for variant creation
 */
const createVariantSchema = z.object({
  name: z.string().optional().default(''),
  price: z.number().min(0, 'Price must be positive').optional().default(0),
  comparePrice: z.number().optional(),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer').default(0),
  images: z.union([z.array(z.string()), z.string()]).optional().default([]),
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
      isActive: typeof v.isActive === 'boolean' ? v.isActive : boolToNumber(v.isActive),
      isDefault: typeof v.isDefault === 'boolean' ? v.isDefault : boolToNumber(v.isDefault),
    }))

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          categorySlug: category?.slug || 'GEN',
        },
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
  // Verify admin authentication (admin only)
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  try {
    const { id } = await params

    // Fetch product to check if it exists
    const product = await ProductRepository.findById(env, id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch category for SKU generation
    let category: any = null
    if (product.categoryId) {
      category = await CategoryRepository.findById(env, product.categoryId)
    }

    // Parse request body
    const body = await request.json() as any

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

    // Validate input with normalized data
    const validatedData = createVariantSchema.parse({
      ...body,
      name: variantName,
      price: body.price || 0,
      images,
    })

    // Generate SKU
    const sku = generateSKU(
      category?.slug || 'GEN',
      product.name,
      {
        size: validatedData.size,
        color: validatedData.color,
        material: validatedData.material,
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
      name: validatedData.name,
      price: validatedData.price || 0,
      comparePrice: validatedData.comparePrice,
      costPrice: validatedData.costPrice,
      stock: validatedData.stock,
      images: Array.isArray(validatedData.images) ? validatedData.images : [],
      size: validatedData.size,
      color: validatedData.color,
      material: validatedData.material,
      isActive: validatedData.isActive,
      isDefault: validatedData.isDefault,
      lowStockAlert: validatedData.lowStockAlert,
      reorderLevel: validatedData.reorderLevel,
      reorderQty: validatedData.reorderQty,
    })

    // Update product to indicate it has variants
    if (!product.hasVariants) {
      await ProductRepository.update(env, id, { hasVariants: boolToNumber(true) })
    }

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
    console.error('Error creating variant:', error)

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
      },
      { status: 500 }
    )
  }
}
