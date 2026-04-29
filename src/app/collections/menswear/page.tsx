import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

export default function MenswearCollectionPage() {
  return (
    <CategoryPage
      categoryName="Menswear"
      categoryTitle="Menswear Collection"
      categoryDescription="Traditional and contemporary Indian wear for men including sherwanis and kurtas"
      categorySlug="menswear"
    />
  )
}
