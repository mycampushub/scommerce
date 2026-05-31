import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/register')

  return seoToMetadata(seo, {
    title: 'Create Account - SCommerce',
    description: 'Create a new account with SCommerce to enjoy exclusive offers, faster checkout, and order tracking. Join thousands of happy customers today.',
  })
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}