import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search through our extensive collection of fashion and lifestyle products. Find sarees, salwar suits, kurtas, menswear and more.',
  robots: 'index, follow',
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
