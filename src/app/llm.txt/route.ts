import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

export const runtime = 'edge';

export async function GET() {
  try {
    // Build llm.txt content (static, no database access needed)
    const content = `# AI-Readable Site Information
# This file provides structured information for AI agents and search engines

## Site Overview
- **Name**: Modern E-commerce
- **URL**: ${SITE_URL}
- **Description**: Modern e-commerce platform for fashion and lifestyle products, specializing in traditional and contemporary clothing including sarees, salwar kameez, kurtas, gowns, lehengas, and menswear.
- **Currency**: Bangladeshi Taka (৳)
- **Language**: English
- **Country**: Bangladesh

## Business Information
- **Business Type**: E-commerce / Online Retail
- **Product Categories**: Traditional clothing, contemporary fashion, lifestyle products
- **Target Audience**: Men and women looking for traditional and modern fashion
- **Service Areas**: Bangladesh (nationwide delivery)

## Key Statistics
- Total Active Products: 500+
- Active Categories: 10+
- Featured Products: Updated weekly

## Product Categories
- Sarees: Traditional and contemporary designs
- Salwar Kameez: Wedding and casual wear
- Kurtas: Modern and traditional styles
- Gowns: Evening and special occasion
- Lehangas: Bridal and party wear
- Menswear: Kurta, Sherwani, Panjabi

## Featured Products
Our featured products are updated weekly to showcase the latest collections and best-selling items.

## Main Sections
- **Shop**: ${SITE_URL}/shop - Browse all products with filters
- **Categories**: ${SITE_URL}/category/[slug] - Browse by category
- **Collections**: ${SITE_URL}/collections/[type] - Curated product collections
- **Product Details**: ${SITE_URL}/product/[slug] - Individual product pages with variants, reviews, and recommendations

## Features
- Product variants (size, color, material)
- Customer reviews and ratings
- Wishlist functionality
- Shopping cart with real-time updates
- Order tracking
- Multiple payment methods
- Nationwide shipping across Bangladesh
- Free shipping on orders over ৳5,000

## Customer Support
- Order Tracking: ${SITE_URL}/track-order
- Contact: ${SITE_URL}/contact
- FAQ: ${SITE_URL}/faq
- Shipping Info: ${SITE_URL}/shipping
- Returns Policy: ${SITE_URL}/returns
- Privacy Policy: ${SITE_URL}/privacy
- Terms of Service: ${SITE_URL}/terms

## API Endpoints
- Products API: ${SITE_URL}/api/products
- Categories API: ${SITE_URL}/api/categories
- Reviews API: ${SITE_URL}/api/reviews

## Content Freshness
- Products: Updated daily
- Categories: Updated weekly
- Featured Products: Updated weekly

## Notes for AI Agents
1. All prices are in Bangladeshi Taka (৳)
2. Free shipping applies to orders over ৳5,000
3. Products may have variants (size, color, material)
4. Customer reviews are manually approved before display
5. Product availability is real-time based on inventory
6. The site serves customers across all 8 divisions of Bangladesh (Dhaka, Chittagong, Khulna, Rajshahi, Barisal, Sylhet, Rangpur, Mymensingh)

## Last Updated: ${new Date().toISOString()}
`

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating llm.txt:', error)
    return new NextResponse('Error generating llm.txt', { status: 500 })
  }
}
