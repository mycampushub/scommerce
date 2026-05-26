import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Checkout - SCommerce',
    description: 'Complete your purchase securely. Fast checkout with multiple payment options including cash on delivery.',
    keywords: 'checkout, payment, buy, purchase, secure payment',
    openGraph: {
      title: 'Checkout - SCommerce',
      description: 'Complete your purchase securely. Fast checkout with multiple payment options including cash on delivery.',
      type: 'website',
    },
  }
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
