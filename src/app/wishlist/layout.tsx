import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/wishlist')

  return seoToMetadata(seo, {
    title: 'My Wishlist - SCommerce',
    description: 'View and manage your wishlist items. Save your favorite products and never miss out on deals and new arrivals.',
  })
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}