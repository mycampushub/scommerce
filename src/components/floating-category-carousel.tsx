'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  image: string
  slug: string
  href?: string
}

interface FloatingCategoryCarouselProps {
  categories: Category[]
}

export function FloatingCategoryCarousel({ categories }: FloatingCategoryCarouselProps) {
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

  const visibleCategories = []
  for (let i = 0; i < 5; i++) {
    visibleCategories.push(categories[(currentIndex + i) % categories.length])
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 z-40 md:hidden">
      <div className="mx-auto px-4">
        <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 rounded-2xl shadow-2xl p-3 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm">Shop Categories</h3>
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
              <button
                onClick={nextSlide}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {visibleCategories.map((category, index) => {
              const href = category.href || `/collections/${category.slug}`
              return (
                <a
                  key={category.id}
                  href={href}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-transform active:scale-95"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-white/20">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-white text-[10px] font-medium text-center whitespace-nowrap w-14 truncate">
                    {category.name}
                  </span>
                </a>
              )
            })}
          </div>
          <div className="flex justify-center mt-2">
            <a
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-pink-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={2} />
              View All
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
