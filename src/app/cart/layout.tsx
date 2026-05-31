import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/cart')

  return seoToMetadata(seo, {
    title: 'Shopping Cart - SCommerce',
    description: 'Review your selected items in the shopping cart. Complete your purchase with secure checkout and free shipping on eligible orders.',
  })
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}