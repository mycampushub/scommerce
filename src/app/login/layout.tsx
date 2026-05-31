import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/login')

  return seoToMetadata(seo, {
    title: 'Login - SCommerce',
    description: 'Sign in to your SCommerce account to access your orders, wishlist, and saved addresses. Fast and secure login process.',
  })
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}