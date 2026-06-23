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
import { PriceDisplay } from '@/components/price-display'
import { useParams } from 'next/navigation'

interface BrandData {
  id: string
  name: string
  slug: string
  logo: string | null
  description: string | null
  website: string | null
  country: string | null
}

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Selling', value: 'bestselling' }
]

const priceRanges = [
  { label: 'Under ৳500', min: 0, max: 500 },
  { label: '৳500 - ৳1000', min: 500, max: 1000 },
  { label: '৳1000 - ৳2000', min: 1000, max: 2000 },
  { label: '৳2000 - ৳3000', min: 2000, max: 3000 },
  { label: '৳3000+', min: 3000, max: 999999 }
]

export default function BrandPage() {
  const params = useParams()
  const slug = params.slug as string
  const [brand, setBrand] = useState<BrandData | null>(null)
  const [brandLoading, setBrandLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<string>>(new Set())
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { addItem } = useCartStore()

  const mobileFilterRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const fetchBrand = async () => {
      setBrandLoading(true)
      try {
        const response = await fetch('/api/brands')
        const data = await response.json()
        if (data.success) {
          const found = data.data.find((b: BrandData) => b.slug === slug)
          if (found) {
            setBrand(found)
          } else {
            setBrand(null)
          }
        }
      } catch (error) {
        console.error('Error fetching brand:', error)
      } finally {
        setBrandLoading(false)
      }
    }

    fetchBrand()
  }, [slug])

  // Fetch products with pagination
  const fetchProductsPage = useCallback(async (pageNum: number) => {
    const params = new URLSearchParams()
    params.append('brand', slug)
    params.append('page', pageNum.toString())
    params.append('limit', '12')
    const response = await fetch(`/api/products?${params}`)
    const data = await response.json()
    if (!data.success) throw new Error('Failed to fetch products')
    return data.data
  }, [slug])

  // Initial load + reset on filter change
  useEffect(() => {
    setProductsLoading(true)
    setAllProducts([])
    setPage(1)
    setHasMore(true)
    fetchProductsPage(1)
      .then((data) => {
        setAllProducts(data.products)
        setHasMore(data.pagination.hasNextPage)
        setPage(1)
      })
      .catch((err) => {
        console.error('Error fetching products:', err)
        setAllProducts([])
      })
      .finally(() => setProductsLoading(false))
  }, [fetchProductsPage])

  // Load more products for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const data = await fetchProductsPage(nextPage)
      setAllProducts(prev => [...prev, ...data.products])
      setHasMore(data.pagination.hasNextPage)
      setPage(nextPage)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, fetchProductsPage])

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !productsLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore, hasMore, loadingMore, productsLoading])

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

  if (!brandLoading && !brand) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Brand Not Found</h1>
          <p className="text-gray-600 mb-6">The brand you're looking for doesn't exist.</p>
          <Link href="/" className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors">
            Return Home
          </Link>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-r from-pink-50 to-purple-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          {brandLoading ? (
            <>
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-5 w-96 mx-auto" />
            </>
          ) : brand ? (
            <>
              {brand.logo && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-16 md:h-20 object-contain"
                  />
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{brand.name}</h1>
              <p className="text-gray-600">{brand.description || `Explore ${brand.name} products`}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <Link href="/" className="hover:text-pink-600">Home</Link>
                <span>/</span>
                <span className="text-gray-900">{brand.name}</span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-pink-600" />
                  Filters
                </h2>

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

                {priceRange && (
                  <button
                    onClick={() => {
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

            <div className="flex-1">
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <p className="text-gray-600 text-sm">
                  Showing {sortedProducts.length} products
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value)
                      }}
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

              {productsLoading || brandLoading ? (
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
                  <p className="text-gray-600">No products found for this brand.</p>
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
              {!hasMore && sortedProducts.length > 0 && !productsLoading && (
                <p className="text-center text-gray-500 text-sm py-8">All products loaded</p>
              )}
            </div>
          </div>
        </div>
      </section>

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
