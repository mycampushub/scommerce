import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/returns')

  return seoToMetadata(seo, {
    title: 'Returns & Refunds Policy - SCommerce',
    description: 'Read our hassle-free returns and refunds policy. 30-day return window on all orders. Simple process with full refund or exchange options.',
  })
}

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children
}