import { CategoryPage } from '@/components/category-page'

// Force static generation to avoid RSC prefetch issues in Cloudflare Pages
export const dynamic = 'force-static'

export default function TopsCollectionPage() {
  return (
    <CategoryPage
      categoryName="Tops"
      categoryTitle="Tops & Tunics"
      categoryDescription="Stylish tops, tunics, and contemporary wear for modern women"
      categorySlug="tops"
    />
  )
}
