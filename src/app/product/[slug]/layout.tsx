import { Metadata } from 'next'
import { getEnv } from '@/lib/cloudflare'
import { ProductRepository } from '@/db/product.repository'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  try {
    const env = await getEnv()
    const product = await ProductRepository.findBySlug(env, slug)

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The product you are looking for does not exist.',
      }
    }

    const images = product.images || []
    const firstImage = images.length > 0 ? images[0] : null

    return {
      title: product.name,
      description: product.description || `Shop ${product.name} online at best price in Bangladesh. Free shipping on orders above ৳5,000.`,
      openGraph: {
        title: product.name,
        description: product.description || undefined,
        images: firstImage ? [{ url: firstImage, width: 1200, height: 630 }] : [],
        type: 'website',
        url: `/product/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.description || undefined,
        images: firstImage ? [firstImage] : [],
      },
      alternates: {
        canonical: `/product/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating product metadata:', error)
    return {
      title: 'Product',
      description: 'Shop premium products online in Bangladesh.',
    }
  }
}

export default function ProductLayout({ children }: Props) {
  return children
}
