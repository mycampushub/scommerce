import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'
import { updateCategorySchema } from '@/lib/validations'
import { queryAll, count, numberToBool, boolToNumber } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'


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
    const env = getEnv()
    const category = await CategoryRepository.findById(env, (await params).id)

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    // Get products for this category
    const products = await ProductRepository.findByCategory(env, (await params).id)

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        isActive: numberToBool(category.isActive),
        products,
      },
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category',
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


  try {
    const env = getEnv()
    const body = await request.json() as any

    // Validate with Zod
    const validation = updateCategorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    const category = await CategoryRepository.update(env, (await params).id, {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.slug !== undefined && { slug: validatedData.slug }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.image !== undefined && { image: validatedData.image }),
      ...(validatedData.isActive !== undefined && { isActive: boolToNumber(validatedData.isActive) }),
    })

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { ...category, isActive: numberToBool(category.isActive as number) },
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
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


  try {
    const env = getEnv()
    await CategoryRepository.delete(env, (await params).id)

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete category',
      },
      { status: 500 }
    )
  }
}
