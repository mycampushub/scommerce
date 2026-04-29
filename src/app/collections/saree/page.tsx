import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

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
