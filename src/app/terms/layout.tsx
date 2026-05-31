import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/terms')

  return seoToMetadata(seo, {
    title: 'Terms & Conditions - SCommerce',
    description: 'Read our terms and conditions to understand your rights and responsibilities when shopping at SCommerce. Clear and fair policies for all customers.',
  })
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}