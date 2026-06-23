import { Metadata } from 'next'
import { getEnv } from '@/lib/cloudflare'
import { BrandRepository } from '@/db/brand.repository'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const env = await getEnv()
    const brand = await BrandRepository.findBySlug(env, slug)

    if (!brand) {
      return {
        title: 'Brand Not Found',
        description: 'The brand you are looking for does not exist.',
        robots: 'noindex, nofollow',
      }
    }

    return {
      title: brand.name,
      description: brand.description || `Shop ${brand.name} collection at SCommerce. Explore our range of premium products from ${brand.name}.`,
      openGraph: {
        title: brand.name,
        description: brand.description || undefined,
        images: brand.logo ? [{ url: brand.logo, width: 200, height: 200 }] : [],
        type: 'website',
        url: `/brands/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: brand.name,
        description: brand.description || undefined,
      },
      alternates: {
        canonical: `/brands/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating brand metadata:', error)
    return {
      title: 'Brand',
      description: 'Shop premium brand products online in Bangladesh.',
    }
  }
}

export default function BrandLayout({ children }: Props) {
  return children
}
