import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/privacy')

  return seoToMetadata(seo, {
    title: 'Privacy Policy - SCommerce',
    description: 'We respect your privacy. Read our comprehensive privacy policy to understand how we collect, use, and protect your personal information.',
  })
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}