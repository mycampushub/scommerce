'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Heart, Star, Filter, X, ChevronDown, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { QuickViewModal, Product } from '@/components/quick-view-modal'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/use-debounce'
import { PriceDisplay } from '@/components/price-display'

// Use Product type from QuickViewModal component

interface Category {
  id: string
  name: string
  slug: string
}

const priceRanges = [
  { label: 'Under ৳500', min: 0, max: 500 },
  { label: '৳500 - ৳1000', min: 500, max: 1000 },
  { label: '৳1000 - ৳2000', min: 1000, max: 2000 },
  { label: '৳2000 - ৳3000', min: 2000, max: 3000 },
  { label: '৳3000+', min: 3000, max: 999999 }
]



const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Selling', value: 'bestselling' }
]

export default function ShopPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<string>>(new Set())
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { addItem } = useCartStore()

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true)
      try {
        const response = await fetch('/api/categories?hierarchical=false')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Focus trap for mobile filter modal
  const mobileFilterRef = useRef<HTMLDivElement>(null)

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

  // Search query state
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Get URL search params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const categoryParam = searchParams.get('category')
  const searchParam = searchParams.get('search')

  const effectiveCategory = (categoryParam && categoryParam !== 'all') ? categoryParam : (selectedCategory !== 'All' ? selectedCategory : undefined)
  const effectiveSearch = searchParam || debouncedSearchQuery || undefined

  // Fetch products with pagination
  const fetchProductsPage = useCallback(async (pageNum: number, category?: string, search?: string) => {
    const params = new URLSearchParams()
    params.append('page', pageNum.toString())
    params.append('limit', '12')
    if (category) params.append('category', category)
    if (search) params.append('search', search)
    const response = await fetch(`/api/products?${params}`)
    const data = await response.json()
    if (!data.success) throw new Error('Failed to fetch products')
    return data.data
  }, [])

  // Initial load + reset on filter change
  useEffect(() => {
    setInitialLoading(true)
    setAllProducts([])
    setPage(1)
    setHasMore(true)
    fetchProductsPage(1, effectiveCategory, effectiveSearch)
      .then((data) => {
        setAllProducts(data.products)
        setHasMore(data.pagination.hasNextPage)
        setPage(1)
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false))
  }, [effectiveCategory, effectiveSearch, fetchProductsPage])

  // Load more products for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const data = await fetchProductsPage(nextPage, effectiveCategory, effectiveSearch)
      setAllProducts(prev => [...prev, ...data.products])
      setHasMore(data.pagination.hasNextPage)
      setPage(nextPage)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, effectiveCategory, effectiveSearch, fetchProductsPage])

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore, hasMore, loadingMore])

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product)
  }

  const closeQuickView = () => {
    setQuickViewProduct(null)
  }

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      slug: product.slug,
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

  const filteredProducts = allProducts.filter(product => {
    const priceMatch = !priceRange || (product.price >= priceRange.min && product.price <= priceRange.max)
    return priceMatch
  })

  let sortedProducts = [...filteredProducts]
  if (sortBy === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price)
  } else if (sortBy === 'newest') {
    sortedProducts.reverse()
  }

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
                    <li>
                      <button
                        onClick={() => {
                          setSelectedCategory('All')
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === 'All' || !categoryParam
                            ? 'bg-pink-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        All Categories
                      </button>
                    </li>
                    {categoriesLoading ? (
                      <li className="text-gray-500 text-sm">Loading categories...</li>
                    ) : (
                      categories.map((category) => (
                        <li key={category.slug}>
                          <button
                            onClick={() => {
                              setSelectedCategory(category.slug)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              selectedCategory === category.slug || categoryParam === category.slug
                                ? 'bg-pink-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {category.name}
                          </button>
                        </li>
                      ))
                    )}
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
                  Showing {sortedProducts.length} products
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
              {initialLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              ) : sortedProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-600">No products found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                  <div key={product.id} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                      {product.badge && (
                        <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {product.badge}
                        </span>
                      )}
                      <Link href={`/product/${product.slug}`}>
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
                          onClick={() => openQuickView(product as Product)}
                          className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                        >
                          Quick View
                        </button>
                        <button
                          onClick={() => addToCart(product as Product)}
                          className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                    <Link href={`/product/${product.slug}`}>
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
                      <PriceDisplay value={product.price} originalPrice={product.originalPrice} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} className="h-4" />
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
                </div>
              )}
              {!hasMore && sortedProducts.length > 0 && (
                <p className="text-center text-gray-500 text-sm py-8">All products loaded</p>
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
                  <li>
                    <button
                      onClick={() => {
                        setSelectedCategory('All')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === 'All'
                          ? 'bg-pink-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                  </li>
                  {categoriesLoading ? (
                    <li className="text-gray-500 text-sm">Loading categories...</li>
                  ) : (
                    categories.map((category) => (
                      <li key={category.slug}>
                        <button
                          onClick={() => {
                            setSelectedCategory(category.slug)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedCategory === category.slug
                              ? 'bg-pink-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {category.name}
                        </button>
                      </li>
                    ))
                  )}
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
