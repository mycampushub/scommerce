import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/search')

  return seoToMetadata(seo, {
    title: 'Search Products - SCommerce',
    description: 'Search through our extensive collection of fashion and lifestyle products. Find sarees, salwar suits, kurtas, menswear and more.',
  })
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}