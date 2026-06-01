import { CategoryPage } from '@/components/category-page'
export const dynamic = 'force-dynamic'

export default function SareeCollectionPage() {
  return (
    <CategoryPage
      categoryName="Sarees"
      categoryTitle="Sarees Collection"
      categoryDescription="Discover our exquisite collection of silk, cotton, and designer sarees for every occasion"
      categorySlug="saree"
    />
  )
}
