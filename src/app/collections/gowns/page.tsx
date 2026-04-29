import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

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
