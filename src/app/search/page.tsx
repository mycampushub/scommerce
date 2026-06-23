'use client'

import React, { useState, useEffect } from 'react'
import { Search, X, ShoppingBag, Heart, Star, Home as HomeIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { useDebounce } from '@/hooks/use-debounce'
import { PriceDisplay } from '@/components/price-display'

// Types
interface Product {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  badge?: string
  category?: string | null
}

// Popular searches
const popularSearches = [
  'Silk Saree',
  'Wedding Lehenga',
  'Salwar Suit',
  'Anarkali Dress',
  'Designer Kurti',
  'Banarasi Saree',
  'Bridal Wear',
  'Festive Collection'
]



export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch search results
  useEffect(() => {
    async function fetchSearchResults() {
      const trimmedQuery = debouncedSearchQuery.trim()
      
      if (!trimmedQuery) {
        setSearchResults([])
        setSearched(false)
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        setSearched(true)
        
        const response = await fetch(`/api/products?search=${encodeURIComponent(trimmedQuery)}&limit=50`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const products = await response.json() as any
        setSearchResults(products)
      } catch (err) {
        console.error('Error searching products:', err)
        setError('Unable to load search results. Please try again.')
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [debouncedSearchQuery])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Header */}
      <section className="bg-gray-50 py-8 md:py-12" aria-labelledby="search-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 id="search-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
              Search
            </h1>

            {/* Search Input */}
            <div className="relative" role="search">
              <label htmlFor="search-input" className="sr-only">
                Search for products
              </label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for sarees, lehengas, suits..."
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
                autoFocus
                aria-label="Search for products"
                aria-describedby="search-hint"
              />
              <span id="search-hint" className="sr-only">
                Type to search for sarees, lehengas, suits and other products
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setSearched(false)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {loading && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2" role="status" aria-live="polite" aria-label="Loading search results">
                  <Loader2 className="w-5 h-5 text-pink-600 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-8 md:py-12" aria-live="polite" aria-atomic="true">
        <div className="container mx-auto px-4">
          {searched && searchQuery.trim() ? (
            <>
              {/* Results Count */}
              <div className="mb-8" role="status">
                {loading ? (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Searching...</span>
                  </p>
                ) : error ? (
                  <p className="text-red-600" role="alert">{error}</p>
                ) : (
                  <p className="text-gray-600">
                    {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                  </p>
                )}
              </div>

              {/* Results Grid */}
              {!loading && searchResults.length > 0 ? (
                <ul className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label={`Search results for ${searchQuery}`}>
                  {searchResults.map((product) => (
                    <li key={product.id} className="group">
                      <article className="h-full">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                          {product.badge && (
                            <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium" aria-label={`Product badge: ${product.badge}`}>
                              {product.badge}
                            </span>
                          )}
                          <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </Link>
                          <button className="absolute top-3 right-3 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600 hover:text-white" aria-label={`Add ${product.name} to wishlist`}>
                            <Heart className="w-5 h-5" />
                          </button>
                          <Link
                            href={`/product/${product.id}`}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                            aria-label={`Quick view ${product.name}`}
                          >
                            Quick View
                          </Link>
                        </div>
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-2" aria-label={`Rated ${product.rating} out of 5 stars, ${product.reviews} reviews`}>
                          <div className="flex" aria-hidden="true">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriceDisplay value={product.price} originalPrice={product.originalPrice} />
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : !loading && searchResults.length === 0  && (
                <div className="text-center py-16" role="status" aria-live="polite">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center" aria-hidden="true">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">No results found</h2>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any products matching "{searchQuery}"
                  </p>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
                  >
                    Browse All Products
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Popular Searches */}
              <div className="max-w-3xl mx-auto">
                <h2 id="popular-searches-heading" className="text-2xl font-bold text-gray-900 mb-6">Popular Searches</h2>
                <div className="flex flex-wrap gap-3 mb-12" role="list" aria-labelledby="popular-searches-heading">
                  {popularSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => setSearchQuery(search)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-pink-600 hover:text-pink-600 transition-colors"
                      aria-label={`Search for ${search}`}
                    >
                      {search}
                    </button>
                  ))}
                </div>

                {/* Browse by Category */}
                <h2 id="categories-heading" className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
                <ul className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-labelledby="categories-heading">
                  {[
                    { name: 'Sarees', slug: 'saree' },
                    { name: 'Salwar Suits', slug: 'salwar' },
                    { name: 'Lehengas', slug: 'lehengas' },
                    { name: 'Gowns', slug: 'gowns' },
                    { name: 'Kurtas', slug: 'kurtas' },
                    { name: 'Menswear', slug: 'menswear' },
                    { name: 'Dresses', slug: 'dress-materials' },
                    { name: 'Accessories', slug: 'shop' }
                  ].map((category) => (
                    <li key={category.name}>
                      <Link
                        href={`/collections/${category.slug}`}
                        className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-pink-600 hover:shadow-lg transition-all block"
                      >
                        <p className="font-semibold text-gray-900">{category.name}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
