import { CategoryPage } from '@/components/category-page'
export const dynamic = 'force-dynamic'

export default function GownsCollectionPage() {
  return (
    <CategoryPage
      categoryName="Gowns"
      categoryTitle="Designer Gowns"
      categoryDescription="Elegant gowns and dresses for parties, weddings, and special occasions"
      categorySlug="gowns"
    />
  )
}
