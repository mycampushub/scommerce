import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Us - SCommerce',
    description: 'Get in touch with our customer support team. We are here to help with any questions or concerns.',
    keywords: 'contact, support, help, customer service, email, phone',
    openGraph: {
      title: 'Contact Us - SCommerce',
      description: 'Get in touch with our customer support team. We are here to help with any questions or concerns.',
      type: 'website',
    },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
