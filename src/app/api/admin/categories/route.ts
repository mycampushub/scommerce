import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'
import { queryAll, count, numberToBool } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    let categories = await CategoryRepository.findAll(env)

    if (search) {
      categories = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(search.toLowerCase()) ||
          category.slug.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Add product counts
    const categoriesWithCounts = []
    for (const category of categories) {
      const productCount = await count(env, 'products', 'WHERE categoryId = ?', category.id)
      categoriesWithCounts.push({
        ...category,
        _count: { products: productCount },
        isActive: numberToBool(category.isActive)
      })
    }

    return NextResponse.json({
      success: true,
      data: categoriesWithCounts,
      total: categoriesWithCounts.length,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv(request)
    const body = await request.json()

    const category = await CategoryRepository.create(env, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      isActive: body.isActive ?? true,
    })

    category.isActive = numberToBool(category.isActive)

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create category',
      },
      { status: 500 }
    )
  }
}
