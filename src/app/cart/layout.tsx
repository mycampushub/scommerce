import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Shopping Cart - SCommerce',
    description: 'Review your selected items and proceed to checkout. Manage quantities and apply promo codes.',
    keywords: 'cart, shopping, basket, review items, checkout',
    openGraph: {
      title: 'Shopping Cart - SCommerce',
      description: 'Review your selected items and proceed to checkout. Manage quantities and apply promo codes.',
      type: 'website',
    },
  }
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
