import { Metadata } from 'next'
import { getEnv } from '@/lib/cloudflare'
import { CategoryRepository } from '@/db/category.repository'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const env = await getEnv()
    const category = await CategoryRepository.findBySlug(env, slug)

    if (!category) {
      return {
        title: 'Collection Not Found',
        description: 'The collection you are looking for does not exist.',
        robots: 'noindex, nofollow',
      }
    }

    return {
      title: `${category.name} Collection`,
      description: category.description || `Explore our exclusive ${category.name} collection. Best prices, premium quality. Free shipping across Bangladesh on orders above ৳5,000.`,
      openGraph: {
        title: `${category.name} Collection`,
        description: category.description || undefined,
        images: category.image ? [{ url: category.image, width: 1200, height: 630 }] : [],
        type: 'website',
        url: `/collections/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${category.name} Collection`,
        description: category.description || undefined,
        images: category.image ? [category.image] : [],
      },
      alternates: {
        canonical: `/collections/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating collection metadata:', error)
    return {
      title: 'Collection',
      description: 'Shop premium collections online in Bangladesh.',
    }
  }
}

export default function CollectionLayout({ children }: Props) {
  return children
}
