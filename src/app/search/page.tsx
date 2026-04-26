'use client'

import React, { useState, useEffect } from 'react'
import { Search, X, ShoppingBag, Heart, Star, Home as HomeIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Types
interface Product {
  id: string
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

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Navbar Component
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="modern ecommerce"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</Link>
            <Link href="/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</Link>
            <Link href="/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</Link>
            <Link href="/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</Link>
            <Link href="/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            <button 
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-4">
              <Link href="/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</Link>
              <Link href="/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</Link>
              <Link href="/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</Link>
              <Link href="/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</Link>
              <Link href="/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/saree" className="text-gray-300 hover:text-white transition-colors">Sarees</Link></li>
              <li><Link href="/salwar" className="text-gray-300 hover:text-white transition-colors">Salwar Suits</Link></li>
              <li><Link href="/lehengas" className="text-gray-300 hover:text-white transition-colors">Lehengas</Link></li>
              <li><Link href="/gowns" className="text-gray-300 hover:text-white transition-colors">Gowns</Link></li>
              <li><Link href="/kurtas" className="text-gray-300 hover:text-white transition-colors">Kurtas</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Wedding</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Festive</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-300 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Connect With Us</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 modern ecommerce. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Mobile Bottom Navigation
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="pb-safe pt-3 pb-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
            <a 
              href="/"
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
              aria-label="Navigate to home"
            >
              <HomeIcon className="w-6 h-6" strokeWidth={2.5} />
            </a>
            <a 
              href="/shop" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-pink-600 text-white transition-colors active:scale-95"
              aria-label="Navigate to shop"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
            </a>
            <a 
              href="/search" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-pink-600 text-white transition-colors active:scale-95"
              aria-label="Navigate to search"
            >
              <Search className="w-6 h-6" strokeWidth={2.5} />
            </a>
            <button 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 relative transition-colors active:scale-95"
              aria-label="View cart"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

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
        
        const products = await response.json()
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
      <Navbar />

      {/* Search Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
              Search
            </h1>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for sarees, lehengas, suits..."
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setSearched(false)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {loading && (
                <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-600 animate-spin" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {searched && searchQuery.trim() ? (
            <>
              {/* Results Count */}
              <div className="mb-8">
                {loading ? (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </p>
                ) : error ? (
                  <p className="text-red-600">{error}</p>
                ) : (
                  <p className="text-gray-600">
                    {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                  </p>
                )}
              </div>

              {/* Results Grid */}
              {!loading && searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResults.map((product) => (
                    <div key={product.id} className="group">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                        {product.badge && (
                          <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {product.badge}
                          </span>
                        )}
                        <Link href={`/product/${product.id}`}>
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Link>
                        <button className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600 hover:text-white">
                          <Heart className="w-5 h-5" />
                        </button>
                        <Link
                          href={`/product/${product.id}`}
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                        >
                          Quick View
                        </Link>
                      </div>
                      <Link href={`/product/${product.id}`}>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">({product.reviews})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loading && searchResults.length === 0  && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Searches</h2>
                <div className="flex flex-wrap gap-3 mb-12">
                  {popularSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => setSearchQuery(search)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:border-pink-600 hover:text-pink-600 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>

                {/* Browse by Category */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <Link
                      key={category.name}
                      href={`/${category.slug}`}
                      className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-pink-600 hover:shadow-lg transition-all"
                    >
                      <p className="font-semibold text-gray-900">{category.name}</p>
                    </Link>
                  ))}
                </div>
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
