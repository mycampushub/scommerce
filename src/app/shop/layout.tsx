import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Shop All Products - SCommerce',
    description: 'Browse our complete collection of premium products. Discover amazing deals and find exactly what you are looking for.',
    keywords: 'shop, products, online shopping, ecommerce, buy, store',
    openGraph: {
      title: 'Shop All Products - SCommerce',
      description: 'Browse our complete collection of premium products. Discover amazing deals and find exactly what you are looking for.',
      type: 'website',
    },
  }
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}
