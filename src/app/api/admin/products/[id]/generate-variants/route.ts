import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'
import { logAdminAction } from '@/lib/audit-logger'
import { z } from 'zod'

/**
 * Schema for variant generation
 * Allows either sizes only, colors only, or both
 */
const generateVariantsSchema = z.object({
  sizes: z.array(z.string().min(1)).optional().default([]),
  colors: z.array(z.string().min(1)).optional().default([]),
  basePrice: z.number().min(0, 'Price must be positive'),
  baseStock: z.number().int().min(0, 'Stock must be a non-negative integer').default(0),
  material: z.string().optional()
}).refine(
  (data) => (data.sizes && data.sizes.length > 0) || (data.colors && data.colors.length > 0),
  { message: 'At least one size or color is required' }
)

/**
 * POST /api/admin/products/[id]/generate-variants
 * Generate variant combinations from size × color matrix
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateVariantsSchema.parse(body)

    // Check if too many variants would be generated
    const sizes = validatedData.sizes || []
    const colors = validatedData.colors || []
    const totalVariants = Math.max(sizes.length, 1) * Math.max(colors.length, 1)
    if (totalVariants > 100) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot generate ${totalVariants} variants. Maximum allowed is 100.`
        },
        { status: 400 }
      )
    }

    console.log('[Generate Variants API] Generating variants for product:', id, {
      sizes: sizes,
      colors: colors,
      basePrice: validatedData.basePrice,
      baseStock: validatedData.baseStock,
      totalVariants
    })

    // Generate variant combinations
    const result = await ProductRepository.generateVariantCombinations(env, {
      productId: id,
      sizes: sizes,
      colors: colors,
      basePrice: validatedData.basePrice,
      baseStock: validatedData.baseStock,
      material: validatedData.material
    })

    // Log audit event
    await logAdminAction(
      env,
      request,
      userOrResponse.id,
      'CREATE',
      'ProductVariant',
      id,
      `Generated ${result.generated} variant combinations for product "${product.name}" (${sizes.length} sizes × ${colors.length} colors)`
    )

    return NextResponse.json({
      success: true,
      generated: result.generated,
      variants: result.variants,
      message: `Successfully generated ${result.generated} variant combinations`
    })
  } catch (error) {
    console.error('Error generating variants:', error)

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
        error: 'Failed to generate variants',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
