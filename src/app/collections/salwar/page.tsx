import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

export default function SalwarCollectionPage() {
  return (
    <CategoryPage
      categoryName="Salwar Suits"
      categoryTitle="Salwar Suits"
      categoryDescription="Beautiful salwar suits, Anarkalis, and designer suits for everyday and special occasions"
      categorySlug="salwar"
    />
  )
}
