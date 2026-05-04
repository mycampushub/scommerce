'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, SlidersHorizontal, Heart, ShoppingCart, Star, Filter, X, ChevronDown, Home as HomeIcon } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { QuickViewModal, Product } from '@/components/quick-view-modal'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/use-debounce'
import { useFocusTrap } from '@/hooks/use-focus-trap'

// Use Product type from QuickViewModal component

const categories = ['All', 'Sarees', 'Salwar Suits', 'Lehengas', 'Gowns', 'Kurtas', 'Menswear', 'Dresses']
const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Selling', value: 'bestselling' }
]

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $200', min: 100, max: 200 },
  { label: '$200 - $300', min: 200, max: 300 },
  { label: '$300+', min: 300, max: 9999 }
]




export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<string>>(new Set())
  const itemsPerPage = 8
  const { addItem, items: cartItems } = useCartStore()

  // Focus trap for mobile filter modal
  const mobileFilterRef = useFocusTrap<HTMLDivElement>({ isOpen: mobileFiltersOpen })

  // Close mobile filter modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileFiltersOpen) {
        setMobileFiltersOpen(false)
      }
    }

    if (mobileFiltersOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileFiltersOpen])

  // Dynamic data states
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Get URL search params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const categoryParam = searchParams.get('category')
  const searchParam = searchParams.get('search')

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build query parameters
        const params = new URLSearchParams()
        
        // Add category filter
        if (categoryParam && categoryParam !== 'all') {
          params.append('category', categoryParam)
        } else if (selectedCategory !== 'All') {
          params.append('category', selectedCategory.toLowerCase())
        }
        
        // Add search filter
        if (searchParam) {
          setSearchQuery(searchParam)
          params.append('search', searchParam)
        } else if (debouncedSearchQuery) {
          params.append('search', debouncedSearchQuery)
        }

        const url = `/api/products?${params.toString()}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json() as any
        const productsArray = Array.isArray(data.products) ? data.products : (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []))
        setProducts(productsArray)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categoryParam, selectedCategory, searchParam, debouncedSearchQuery])

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product)
  }

  const closeQuickView = () => {
    setQuickViewProduct(null)
  }

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      quantity: 1,
    })
    toast.success('Added to cart!')
  }

  const toggleWishlist = (productId: string) => {
    setWishlistedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
        toast.success('Removed from wishlist')
      } else {
        newSet.add(productId)
        toast.success('Added to wishlist!')
      }
      return newSet
    })
  }

  const filteredProducts = products.filter(product => {
    // Apply category filter
    let categoryMatch = true
    if (selectedCategory !== 'All' && !categoryParam) {
      categoryMatch = product.category?.toLowerCase() === selectedCategory.toLowerCase()
    }
    
    // Apply price range filter
    const priceMatch = !priceRange || (product.price >= priceRange.min && product.price <= priceRange.max)
    
    return categoryMatch && priceMatch
  })

  let sortedProducts = [...filteredProducts]
  if (sortBy === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price)
  } else if (sortBy === 'newest') {
    sortedProducts.reverse()
  }

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const displayedProducts = sortedProducts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shop All Products</h1>
          <p className="text-gray-600">Discover our complete collection</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Shop</span>
          </div>
        </div>
      </section>

      {/* Filters and Products */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-pink-600" />
                  Filters
                </h2>

                {/* Categories */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-gray-900">Categories</h3>
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li key={category}>
                        <button
                          onClick={() => {
                            setSelectedCategory(category)
                            setCurrentPage(0)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedCategory === category || (categoryParam && category.toLowerCase() === categoryParam.toLowerCase())
                              ? 'bg-pink-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {category}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-gray-900">Price Range</h3>
                  <ul className="space-y-2">
                    {priceRanges.map((range) => (
                      <li key={range.label}>
                        <button
                          onClick={() => {
                            setSelectedPriceRange(range.label)
                            setPriceRange(range)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedPriceRange === range.label
                              ? 'bg-pink-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {range.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Clear Filters */}
                {(selectedCategory !== 'All' || priceRange) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All')
                      setPriceRange(null)
                      setSelectedPriceRange(null)
                    }}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Mobile Filter Toggle */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
                <div className="text-sm text-gray-500">
                  {sortedProducts.length} products
                </div>
              </div>

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
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-64 w-full rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="col-span-full py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-800 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-600">No products found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedProducts.map((product) => (
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
                      <button 
                        onClick={() => toggleWishlist(product.id)}
                        className={`absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600 hover:text-white ${
                          wishlistedProducts.has(product.id) ? 'text-pink-600' : ''
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${wishlistedProducts.has(product.id) ? 'fill-pink-600' : ''}`} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openQuickView(product)}
                          className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                        >
                          Quick View
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700"
                        >
                          Add to Cart
                        </button>
                      </div>
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
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                        currentPage === i
                          ? 'bg-pink-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                      aria-label={`Page ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden" ref={mobileFilterRef} role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
            role="presentation"
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg" id="mobile-filter-title">Filters</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Close filters"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-900">Categories</h3>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category}>
                      <button
                        onClick={() => {
                          setSelectedCategory(category)
                          setCurrentPage(0)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category
                            ? 'bg-pink-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-900">Price Range</h3>
                <ul className="space-y-2">
                  {priceRanges.map((range) => (
                    <li key={range.label}>
                      <button
                        onClick={() => {
                          setSelectedPriceRange(range.label)
                          setPriceRange(range)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedPriceRange === range.label
                            ? 'bg-pink-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {range.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Apply Filters */}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
      <QuickViewModal product={quickViewProduct as Product} open={!!quickViewProduct} onOpenChange={closeQuickView} />
    </div>
  )
}
