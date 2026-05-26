import { Metadata } from 'next'

/**
 * Base site metadata configuration
 */
export const SITE_NAME = 'SCommerce'
export const SITE_DESCRIPTION = 'Your one-stop shop for premium products'

/**
 * Generate metadata for a page
 */
export function createPageMetadata(options: {
  title: string
  description: string
  keywords?: string
  canonical?: string
}): Metadata {
  const { title, description, keywords, canonical } = options

  const fullTitle = `${title} - ${SITE_NAME}`

  return {
    title: fullTitle,
    description,
    keywords: keywords || title.toLowerCase().replace(/\s+/g, ', '),
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      siteName: SITE_NAME,
    },
    ...(canonical && {
      alternates: {
        canonical,
      },
    }),
  }
}

/**
 * Pre-configured metadata for common pages
 */
export const pageMetadata = {
  shop: createPageMetadata({
    title: 'Shop All Products',
    description: 'Browse our complete collection of premium products. Discover amazing deals and find exactly what you are looking for.',
    keywords: 'shop, products, online shopping, ecommerce, buy, store',
  }),
  checkout: createPageMetadata({
    title: 'Checkout',
    description: 'Complete your purchase securely. Fast checkout with multiple payment options including cash on delivery.',
    keywords: 'checkout, payment, buy, purchase, secure payment',
  }),
  contact: createPageMetadata({
    title: 'Contact Us',
    description: 'Get in touch with our customer support team. We are here to help with any questions or concerns.',
    keywords: 'contact, support, help, customer service, email, phone',
  }),
  about: createPageMetadata({
    title: 'About Us',
    description: 'Learn more about our story, mission, and values. Discover what makes us different.',
    keywords: 'about, our story, company, mission, values',
  }),
  cart: createPageMetadata({
    title: 'Shopping Cart',
    description: 'Review your selected items and proceed to checkout. Manage quantities and apply promo codes.',
    keywords: 'cart, shopping, basket, review items, checkout',
  }),
}
