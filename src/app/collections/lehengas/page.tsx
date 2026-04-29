import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

export default function LehengasCollectionPage() {
  return (
    <CategoryPage
      categoryName="Lehengas"
      categoryTitle="Lehengas Collection"
      categoryDescription="Stunning lehengas for weddings, festivals, and special celebrations"
      categorySlug="lehengas"
    />
  )
}
