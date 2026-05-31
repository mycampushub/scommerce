import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/contact')

  return seoToMetadata(seo, {
    title: 'Contact Us - SCommerce',
    description: 'Have questions? Contact our customer support team for assistance with orders, returns, sizing, or any other inquiries.',
  })
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}