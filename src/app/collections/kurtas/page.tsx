import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

export default function KurtasCollectionPage() {
  return (
    <CategoryPage
      categoryName="Kurtas"
      categoryTitle="Kurtas & Kurtis"
      categoryDescription="Trendy kurtis, tunics, and designer kurtas for modern women"
      categorySlug="kurtas"
    />
  )
}
