import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/shipping')

  return seoToMetadata(seo, {
    title: 'Shipping Information - SCommerce',
    description: 'Free shipping on orders above ৳5,000 across Bangladesh. Fast and reliable delivery with tracking. International shipping also available.',
  })
}

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children
}