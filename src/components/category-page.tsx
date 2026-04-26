'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  rating: number
  reviews: number
  badge?: string
  category?: string
  categorySlug?: string
  stock?: number
}

interface CategoryPageProps {
  categoryName: string
  categoryTitle?: string
  categoryDescription?: string
  categorySlug?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function CategoryPage({ categoryName, categoryTitle, categoryDescription, categorySlug }: CategoryPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('featured')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const { toast } = useToast()

  const itemsPerPage = 12
  const slug = categorySlug || slugify(categoryName)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/products?category=${encodeURIComponent(slug)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        const productsArray = Array.isArray(data.products) ? data.products : (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
        setProducts(productsArray)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again.')
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [slug, toast])

  const sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Newest', value: 'newest' },
    { label: 'Best Selling', value: 'bestselling' }
  ]

  const productsArray = Array.isArray(products) ? products : []
  let sortedProducts = [...productsArray]
  if (sortBy === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price)
  } else if (sortBy === 'newest') {
    sortedProducts.sort((a, b) => b.reviews - a.reviews) // Use reviews as proxy for newest
  } else if (sortBy === 'bestselling') {
    sortedProducts.sort((a, b) => b.reviews - a.reviews)
  }

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const displayedProducts = sortedProducts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {categoryTitle || categoryName}
          </h1>
          <p className="text-gray-600">{categoryDescription || `Discover our beautiful ${categoryName} collection`}</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">{categoryTitle || categoryName}</span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Sort Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <p className="text-gray-600 text-sm">
                  Showing {displayedProducts.length} of {sortedProducts.length} products
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none pr-8 pl-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none rotate-90" />
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* No Products */}
              {sortedProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-600 text-lg">No products found in this category.</p>
                  <Link
                    href="/shop"
                    className="inline-block mt-4 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
                  >
                    Browse All Products
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && sortedProducts.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        currentPage === i
                          ? 'bg-pink-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
