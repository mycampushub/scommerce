import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/checkout')

  return seoToMetadata(seo, {
    title: 'Secure Checkout - SCommerce',
    description: 'Complete your purchase with our secure checkout process. Multiple payment options available with free shipping on eligible orders across Bangladesh.',
  })
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}