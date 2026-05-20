import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'
import { updateCategorySchema } from '@/lib/validations'
import { queryAll, count, numberToBool, boolToNumber } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'
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
    const id = (await params).id
    const searchParams = request.nextUrl.searchParams
    const includeChildren = searchParams.get('children') === 'true'
    const includePath = searchParams.get('path') === 'true'

    let category

    if (includePath) {
      category = await CategoryRepository.getWithPath(env, id)
    } else {
      category = await CategoryRepository.findById(env, id)
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    const response: any = {
      ...category,
      isActive: numberToBool(category.isActive),
    }

    // Get products for this category
    const products = await ProductRepository.findByCategory(env, id)
    response.products = products

    // Get children if requested
    if (includeChildren) {
      const children = await CategoryRepository.getChildren(env, id)
      response.children = children.map(child => ({
        ...child,
        isActive: numberToBool(child.isActive),
      }))
    }

    return NextResponse.json({
      success: true,
      data: response,
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

  const admin = userOrResponse as { id: string; email: string; role: string; name?: string }


  try {
    const env = await getEnv()
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

    // Get existing category for audit log
    const existing = await CategoryRepository.findById(env, (await params).id)
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    const category = await CategoryRepository.update(env, (await params).id, {
      ...(validatedData.name !== undefined && { name: validatedData.name }),
      ...(validatedData.slug !== undefined && { slug: validatedData.slug }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.image !== undefined && { image: validatedData.image }),
      ...(validatedData.isActive !== undefined && { isActive: boolToNumber(validatedData.isActive) }),
      ...(validatedData.parentId !== undefined && { parentId: validatedData.parentId }),
      ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
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

    // Log audit event
    const changes: string[] = []
    if (validatedData.name && validatedData.name !== existing.name) {
      changes.push(`name: "${existing.name}" → "${validatedData.name}"`)
    }
    if (typeof validatedData.isActive !== 'undefined' && validatedData.isActive !== numberToBool(existing.isActive as number)) {
      changes.push(`isActive: ${numberToBool(existing.isActive as number)} → ${validatedData.isActive}`)
    }
    const details = changes.length > 0
      ? `Updated category "${existing.name}" (ID: ${(await params).id}): ${changes.join(', ')}`
      : `Updated category "${existing.name}" (ID: ${(await params).id})`

    await logAdminAction(env, request, admin.id, 'UPDATE', 'Category', (await params).id, details)

    return NextResponse.json({
      success: true,
      data: { ...category, isActive: numberToBool(category.isActive as number) },
    })
  } catch (error) {
    console.error('Error updating category:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update category'
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

    // Check if category exists
    const category = await CategoryRepository.findById(env, id)
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    // Check if category has products
    const productCount = await CategoryRepository.countProducts(env, id)
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category: It contains ${productCount} product${productCount > 1 ? 's' : ''}. Please reassign or delete the products first.`,
        },
        { status: 400 }
      )
    }

    await CategoryRepository.delete(env, id)

    // Log audit event
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'Category',
      id,
      `Deleted category "${category.name}" (ID: ${id})`
    )

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category'
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
