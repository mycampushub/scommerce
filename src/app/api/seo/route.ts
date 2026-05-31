import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/db/unified-db';

// GET /api/seo - Get SEO settings for a page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagePath = searchParams.get('pagePath');

    if (!pagePath) {
      return NextResponse.json(
        { success: false, error: 'pagePath is required' },
        { status: 400 }
      );
    }

    // Get SEO settings for the specific page
    const prisma = getPrisma()
    const seo = await prisma.page_seo.findUnique({
      where: { pagePath }
    });

    return NextResponse.json({
      success: true,
      data: seo || null
    });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEO settings' },
      { status: 500 }
    );
  }
}