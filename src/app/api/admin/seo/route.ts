import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/db/unified-db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/admin/seo - Get all SEO settings or specific page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagePath = searchParams.get('pagePath');

    if (pagePath) {
      // Get specific page SEO
      const prisma = getPrisma()
      const seo = await prisma.page_seo.findUnique({
        where: { pagePath }
      });

      return NextResponse.json({
        success: true,
        data: seo || null
      });
    }

    // Get all SEO settings
    const prisma = getPrisma()
    const allSeo = await prisma.page_seo.findMany({
      orderBy: { pagePath: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: allSeo
    });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEO settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/seo - Create new SEO setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pagePath,
      pageTitle,
      metaTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
      robots
    } = body;

    if (!pagePath) {
      return NextResponse.json(
        { success: false, error: 'pagePath is required' },
        { status: 400 }
      );
    }

    // Check if page already exists
    const prisma = getPrisma()
    const existing = await prisma.page_seo.findUnique({
      where: { pagePath }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'SEO settings for this page already exist' },
        { status: 400 }
      );
    }

    const seo = await prisma.page_seo.create({
      data: {
        id: uuidv4(),
        pagePath,
        pageTitle: pageTitle || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        keywords: keywords || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || null,
        canonicalUrl: canonicalUrl || null,
        robots: robots || 'index, follow',
        isActive: 1
      }
    });

    return NextResponse.json({
      success: true,
      data: seo
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SEO settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/seo - Update SEO settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      pagePath,
      pageTitle,
      metaTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
      robots,
      isActive
    } = body;

    if (!id && !pagePath) {
      return NextResponse.json(
        { success: false, error: 'Either id or pagePath is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (pageTitle !== undefined) updateData.pageTitle = pageTitle || null;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
    if (keywords !== undefined) updateData.keywords = keywords || null;
    if (ogTitle !== undefined) updateData.ogTitle = ogTitle || null;
    if (ogDescription !== undefined) updateData.ogDescription = ogDescription || null;
    if (ogImage !== undefined) updateData.ogImage = ogImage || null;
    if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl || null;
    if (robots !== undefined) updateData.robots = robots;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;

    let seo;
    const prisma = getPrisma()
    if (id) {
      seo = await prisma.page_seo.update({
        where: { id },
        data: updateData
      });
    } else if (pagePath) {
      seo = await prisma.page_seo.update({
        where: { pagePath },
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      data: seo
    });
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update SEO settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/seo - Delete SEO settings
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma()
    await prisma.page_seo.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'SEO settings deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete SEO settings' },
      { status: 500 }
    );
  }
}