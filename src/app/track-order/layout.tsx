import { Metadata } from 'next'
import { getSeoMetadata, seoToMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoMetadata('/track-order')

  return seoToMetadata(seo, {
    title: 'Track Order - SCommerce',
    description: 'Track your order in real-time. Enter your order number to see the current status and estimated delivery date.',
  })
}

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children
}