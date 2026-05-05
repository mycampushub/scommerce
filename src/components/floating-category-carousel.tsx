'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'

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
  price: number
  image: string
}

interface FloatingCategoryCarouselProps {
  categories: Category[]
  products?: Product[]
}

export function FloatingCategoryCarousel({ categories, products = [] }: FloatingCategoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % categories.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused, categories.length])

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % categories.length)
  }

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + categories.length) % categories.length)
  }

  if (!categories || categories.length === 0) {
    return null
  }

  const currentCategory = categories[currentIndex]
  const categoryProducts = products.filter(p =>
    currentCategory && p.name.toLowerCase().includes(currentCategory.name.toLowerCase())
  ).slice(0, 4)

  const href = currentCategory?.href || `/collections/${currentCategory?.slug}`

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 md:hidden">
      <div className="bg-white shadow-2xl border-t border-gray-200">
        {/* Category Name Carousel with Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-600 to-pink-500">
          <button
            onClick={prevSlide}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" strokeWidth={2} />
          </button>
          
          <h3 className="flex-1 text-center text-white font-bold text-base">
            {currentCategory.name}
          </h3>
          
          <button
            onClick={nextSlide}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={2} />
          </button>
        </div>

        {/* Active Category Products */}
        {categoryProducts.length > 0 && (
          <div className="p-3 bg-white">
            <div className="grid grid-cols-4 gap-2">
              {categoryProducts.map(product => (
                <a
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[10px] font-medium text-center text-gray-900 line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-[10px] font-bold text-pink-600">
                    ৳{product.price}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <a
            href={href}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors w-full justify-center"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={2} />
            View All {currentCategory.name}
          </a>
        </div>
      </div>
    </div>
  )
}
