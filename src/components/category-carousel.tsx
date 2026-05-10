'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { useFormatCurrency } from '@/hooks/use-format-currency'

interface Category {
  id: string
  name: string
  image: string
  slug: string
  href?: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image: string
  categoryId?: string
  rating?: number
  reviews?: number
}

interface CategoryCarouselProps {
  categories: Category[]
  products?: Product[]
}

export function CategoryCarousel({ categories, products = [] }: CategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { formatCurrency } = useFormatCurrency()

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % categories.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, categories.length])

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % categories.length)
  }, [categories.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + categories.length) % categories.length)
  }, [categories.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (!categories || categories.length === 0) {
    return null
  }

  const currentCategory = categories[currentIndex]
  const categoryProducts = products.filter(p =>
    currentCategory &&
    p.categoryId === currentCategory.id
  ).slice(0, 4)

  const href = currentCategory?.href || `/collections/${currentCategory?.slug}`

  return (
    <section className="w-full py-6 md:py-8 bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4">
        {/* Category Name Carousel with Left/Right Controls */}
        <div
          className="relative bg-white rounded-2xl shadow-sm p-4 md:p-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Button */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors border border-gray-200"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Category Name Display */}
          <div className="text-center py-4 md:py-6">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
              {currentCategory?.name}
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-2">
              Swipe or use arrows to explore
            </p>
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors border border-gray-200"
            aria-label="Next category"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Category Dots Indicator */}
          <div className="flex justify-center gap-2 mt-2">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-pink-600 w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to category ${index + 1}`}
                aria-current={index === currentIndex ? 'step' : undefined}
              />
            ))}
          </div>
        </div>

        {/* Active Category Products - Shown Below Carousel */}
        {categoryProducts.length > 0 && (
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categoryProducts.map(product => (
                <a
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm md:text-base font-medium text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    {product.rating !== undefined && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {product.reviews !== undefined && product.reviews > 0 && (
                          <span className="text-xs text-gray-500">({product.reviews})</span>
                        )}
                      </div>
                    )}
                    <p className="text-base md:text-lg font-bold text-pink-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="mt-6 text-center">
          <a
            href={href}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-base md:text-lg font-medium hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2} />
            View All {currentCategory?.name}
          </a>
        </div>
      </div>
    </section>
  )
}
