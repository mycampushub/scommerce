import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/shop')

  return seoToMetadata(seo, {
    title: 'Shop All Products - SCommerce',
    description: 'Browse our complete collection of fashion and lifestyle products. Find sarees, kurtas, menswear, accessories and more at the best prices in Bangladesh.',
  })
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children
}