import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'
import { queryAll, count, numberToBool } from '@/db/db'
import { ProductRepository } from '@/db/product.repository'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  try {
    const env = getEnv()
    const body = await request.json() as any

    const category = await CategoryRepository.update(env, (await params).id, {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.image !== undefined && { image: body.image }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
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
