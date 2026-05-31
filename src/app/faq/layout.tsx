import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/faq')

  return seoToMetadata(seo, {
    title: 'FAQ - Frequently Asked Questions - SCommerce',
    description: 'Find answers to frequently asked questions about ordering, shipping, returns, payments, and more. Quick answers to help you shop with confidence.',
  })
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}