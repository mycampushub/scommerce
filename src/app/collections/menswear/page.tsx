import { CategoryPage } from '@/components/category-page'
export const dynamic = 'force-dynamic'

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
