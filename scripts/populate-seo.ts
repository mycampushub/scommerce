/**
 * Script to populate initial SEO data for all pages
 * Run with: bun run scripts/populate-seo.ts
 */

import { getPrisma } from '../src/db/unified-db'
import { v4 as uuidv4 } from 'uuid'

const initialSeoData = [
  {
    pagePath: '/',
    pageTitle: null,
    metaTitle: 'SCommerce - Premium Fashion & Lifestyle Store | Shop Online in Bangladesh',
    metaDescription: 'Discover traditional and contemporary fashion at SCommerce. Shop sarees, salwar kameez, kurtas, gowns, lehengas, menswear, and accessories with nationwide delivery across Bangladesh.',
    keywords: 'online shopping, fashion, saree, salwar kameez, kurtas, gowns, lehengas, menswear, accessories, Bangladesh, ethnic wear, traditional, designer, buy online, best price, free shipping',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/shop',
    pageTitle: 'Shop All Products',
    metaTitle: 'Shop All Products - SCommerce Bangladesh | Best Prices',
    metaDescription: 'Browse our complete collection of fashion and lifestyle products. Find sarees, kurtas, menswear, accessories and more at the best prices in Bangladesh.',
    keywords: 'shop all products, online shopping Bangladesh, fashion store, buy online, best deals, sarees, kurtas, menswear, accessories, ethnic wear',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/search',
    pageTitle: 'Search Products',
    metaTitle: 'Search Products - Find What You Need | SCommerce',
    metaDescription: 'Search through our extensive collection of fashion and lifestyle products. Find sarees, salwar suits, kurtas, menswear and more.',
    keywords: 'search products, find products, online shopping search, fashion search, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  {
    pagePath: '/contact',
    pageTitle: 'Contact Us',
    metaTitle: 'Contact Us - We\'re Here to Help | SCommerce Bangladesh',
    metaDescription: 'Have questions? Contact our customer support team for assistance with orders, returns, sizing, or any other inquiries.',
    keywords: 'contact us, customer support, help center, customer service, Bangladesh, online store contact',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/about',
    pageTitle: 'About Us',
    metaTitle: 'About SCommerce - Our Story & Mission',
    metaDescription: 'Learn about SCommerce, Bangladesh\'s premier fashion and lifestyle online store. Discover our story, values, and commitment to quality fashion.',
    keywords: 'about us, our story, company profile, SCommerce Bangladesh, online fashion store, mission, values',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/cart',
    pageTitle: 'Shopping Cart',
    metaTitle: 'Shopping Cart - SCommerce Bangladesh',
    metaDescription: 'Review your selected items in the shopping cart. Complete your purchase with secure checkout and free shipping on eligible orders.',
    keywords: 'shopping cart, view cart, checkout, buy online, Bangladesh, secure payment',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  {
    pagePath: '/checkout',
    pageTitle: 'Checkout',
    metaTitle: 'Secure Checkout - Complete Your Order | SCommerce',
    metaDescription: 'Complete your purchase with our secure checkout process. Multiple payment options available with free shipping on eligible orders across Bangladesh.',
    keywords: 'checkout, secure payment, complete order, online payment, Bangladesh, COD, card payment, bKash',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  {
    pagePath: '/login',
    pageTitle: 'Login',
    metaTitle: 'Login to Your Account - SCommerce Bangladesh',
    metaDescription: 'Sign in to your SCommerce account to access your orders, wishlist, and saved addresses. Fast and secure login process.',
    keywords: 'login, sign in, my account, customer login, Bangladesh, online store account',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  {
    pagePath: '/register',
    pageTitle: 'Create Account',
    metaTitle: 'Create Account - Join SCommerce | Bangladesh',
    metaDescription: 'Create a new account with SCommerce to enjoy exclusive offers, faster checkout, and order tracking. Join thousands of happy customers today.',
    keywords: 'register, create account, sign up, new customer, Bangladesh, online store registration',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  {
    pagePath: '/wishlist',
    pageTitle: 'My Wishlist',
    metaTitle: 'My Wishlist - Save Your Favorites | SCommerce',
    metaDescription: 'View and manage your wishlist items. Save your favorite products and never miss out on deals and new arrivals.',
    keywords: 'wishlist, my wishlist, saved items, favorites, wish list, Bangladesh, online shopping',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  {
    pagePath: '/returns',
    pageTitle: 'Returns & Refunds Policy',
    metaTitle: 'Returns & Refunds Policy - Easy Returns | SCommerce',
    metaDescription: 'Read our hassle-free returns and refunds policy. 30-day return window on all orders. Simple process with full refund or exchange options.',
    keywords: 'returns policy, refunds, return items, exchange policy, customer satisfaction, Bangladesh, online shopping returns',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/shipping',
    pageTitle: 'Shipping Information',
    metaTitle: 'Shipping Policy - Fast Delivery | SCommerce Bangladesh',
    metaDescription: 'Free shipping on orders above ৳5,000 across Bangladesh. Fast and reliable delivery with tracking. International shipping also available.',
    keywords: 'shipping policy, delivery information, free shipping, Bangladesh, delivery time, shipping charges, nationwide delivery',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/privacy',
    pageTitle: 'Privacy Policy',
    metaTitle: 'Privacy Policy - Your Data Security | SCommerce',
    metaDescription: 'We respect your privacy. Read our comprehensive privacy policy to understand how we collect, use, and protect your personal information.',
    keywords: 'privacy policy, data protection, personal information, data security, Bangladesh, online privacy',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/terms',
    pageTitle: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions - Terms of Service | SCommerce',
    metaDescription: 'Read our terms and conditions to understand your rights and responsibilities when shopping at SCommerce. Clear and fair policies for all customers.',
    keywords: 'terms and conditions, terms of service, terms of use, legal policy, Bangladesh, online shopping terms',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/faq',
    pageTitle: 'Frequently Asked Questions',
    metaTitle: 'FAQ - Get Your Questions Answered | SCommerce',
    metaDescription: 'Find answers to frequently asked questions about ordering, shipping, returns, payments, and more. Quick answers to help you shop with confidence.',
    keywords: 'FAQ, frequently asked questions, help, support, customer queries, Bangladesh, online shopping help',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/track-order',
    pageTitle: 'Track Your Order',
    metaTitle: 'Track Order - Real-Time Order Tracking | SCommerce',
    metaDescription: 'Track your order in real-time. Enter your order number to see the current status and estimated delivery date.',
    keywords: 'track order, order tracking, order status, delivery tracking, Bangladesh, online order tracker',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'noindex, follow',
    isActive: 1
  },
  // Collection pages
  {
    pagePath: '/collections/saree',
    pageTitle: 'Sarees Collection',
    metaTitle: 'Sarees Collection - Silk, Cotton & Designer Sarees | SCommerce',
    metaDescription: 'Discover our exquisite saree collection featuring silk, cotton, georgette, and designer sarees. Traditional and modern designs for every occasion.',
    keywords: 'sarees, silk sarees, cotton sarees, designer sarees, benarasi, jamdani, traditional sarees, party wear sarees, Bangladesh, saree online',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/salwar',
    pageTitle: 'Salwar Suits Collection',
    metaTitle: 'Salwar Suits - Designer Anarkali & Pakistani Suits | SCommerce',
    metaDescription: 'Explore our stunning salwar suits collection. From designer Anarkali to Pakistani suits, find the perfect outfit for every occasion.',
    keywords: 'salwar suits, anarkali suits, pakistani suits, designer suits, party wear suits, casual suits, kurtis, palazzo suits, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/kurtas',
    pageTitle: 'Kurtas Collection',
    metaTitle: 'Kurtas for Men & Women - Premium Quality | SCommerce Bangladesh',
    metaDescription: 'Shop premium quality kurtas for men and women. From traditional panjabis to modern kurtis, find styles for every occasion.',
    keywords: 'kurtas, panjabi, kurtis, men kurtas, women kurtis, traditional wear, ethnic wear, panjabi online, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/menswear',
    pageTitle: 'Menswear Collection',
    metaTitle: 'Menswear - Panjabi, Kurta & Sherwani | SCommerce',
    metaDescription: 'Discover our premium menswear collection featuring panjabi, kurta, sherwani, and waistcoats. Traditional and modern styles for men.',
    keywords: 'menswear, panjabi, kurta, sherwani, waistcoat, men traditional wear, ethnic wear, wedding wear, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/lehengas',
    pageTitle: 'Lehengas Collection',
    metaTitle: 'Lehengas - Designer Bridal & Party Wear | SCommerce',
    metaDescription: 'Shop beautiful lehengas for weddings and special occasions. Designer bridal lehengas, party wear lehengas, and more at best prices.',
    keywords: 'lehengas, bridal lehengas, designer lehengas, party wear lehengas, wedding lehengas, ethnic wear, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/gowns',
    pageTitle: 'Gowns Collection',
    metaTitle: 'Gowns - Designer Evening & Party Gowns | SCommerce',
    metaDescription: 'Discover our stunning gown collection featuring evening gowns, party gowns, and designer dresses. Perfect for special occasions.',
    keywords: 'gowns, evening gowns, party gowns, designer dresses, formal wear, party wear, women dresses, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/accessories',
    pageTitle: 'Accessories Collection',
    metaTitle: 'Accessories - Jewelry, Bags & More | SCommerce',
    metaDescription: 'Complete your look with our accessories collection. Shop jewelry, bags, footwear, and fashion accessories at best prices.',
    keywords: 'accessories, jewelry, bags, footwear, fashion accessories, women accessories, men accessories, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
  {
    pagePath: '/collections/tops',
    pageTitle: 'Tops Collection',
    metaTitle: 'Tops - Casual & Party Tops for Women | SCommerce',
    metaDescription: 'Shop trendy tops for women. From casual everyday tops to stylish party wear tops, find the perfect style for every mood.',
    keywords: 'tops, women tops, casual tops, party wear tops, trendy tops, fashion tops, online tops, Bangladesh',
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    canonicalUrl: null,
    robots: 'index, follow',
    isActive: 1
  },
]

async function populateSeoData() {
  try {
    const prisma = getPrisma()

    console.log('🚀 Starting SEO data population...')

    let created = 0
    let updated = 0
    let skipped = 0

    for (const seoData of initialSeoData) {
      // Check if SEO data already exists for this path
      const existing = await prisma.page_seo.findUnique({
        where: { pagePath: seoData.pagePath }
      })

      if (existing) {
        console.log(`⏭️  Skipping existing SEO for: ${seoData.pagePath}`)
        skipped++
      } else {
        await prisma.page_seo.create({
          data: {
            id: uuidv4(),
            ...seoData,
          }
        })
        console.log(`✅ Created SEO for: ${seoData.pagePath}`)
        created++
      }
    }

    console.log('\n📊 Summary:')
    console.log(`   Created: ${created}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Total: ${initialSeoData.length}`)
    console.log('\n✨ SEO data population completed successfully!')
  } catch (error) {
    console.error('❌ Error populating SEO data:', error)
    process.exit(1)
  }
}

// Run the script
populateSeoData().then(() => {
  process.exit(0)
})