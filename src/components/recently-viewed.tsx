'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Clock, X } from 'lucide-react'
import { useRecentlyViewedStore } from '@/lib/store/recently-viewed-store'
import { formatCurrency } from '@/lib/format-currency'
import { Star } from 'lucide-react'

interface RecentlyViewedProps {
  limit?: number
  showTitle?: boolean
  showClearButton?: boolean
}

export function RecentlyViewed({
  limit = 4,
  showTitle = true,
  showClearButton = true,
}: RecentlyViewedProps) {
  const { items, getRecentProducts, clearHistory } = useRecentlyViewedStore()
  const recentProducts = getRecentProducts(limit)

  if (recentProducts.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          {showTitle && (
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-pink-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Recently Viewed
              </h2>
            </div>
          )}
          {showClearButton && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {recentProducts.map((product) => (
            <div key={product.id} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                <Link href={`/product/${product.slug || product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">
                  <Link
                    href={`/product/${product.slug || product.id}`}
                    className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white transition-colors"
                  >
                    Quick View
                  </Link>
                </div>
              </div>
              <Link href={`/product/${product.slug || product.id}`}>
                <h3 className="font-medium text-gray-900 mb-2 mt-4 line-clamp-2 group-hover:text-pink-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
              {product.category && (
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              )}
              {product.rating && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {product.reviews && (
                    <span className="text-sm text-gray-500">({product.reviews})</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(product.price)}
                  </span>
                  {product.comparePrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.comparePrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Component for showing a smaller horizontal list (e.g., on homepage)
export function RecentlyViewedHorizontal({ limit = 6 }: { limit?: number }) {
  const { getRecentProducts, clearHistory } = useRecentlyViewedStore()
  const recentProducts = getRecentProducts(limit)

  if (recentProducts.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-pink-600" />
          <h3 className="text-xl font-bold text-gray-900">Recently Viewed</h3>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug || product.id}`}
            className="flex-shrink-0 w-32"
          >
            <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-2">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-pink-600">
              {product.name}
            </h4>
            <p className="text-sm font-bold text-pink-600">
              {formatCurrency(product.price)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Component for showing in a sidebar or smaller space
export function RecentlyViewedCompact({ limit = 5 }: { limit?: number }) {
  const { getRecentProducts } = useRecentlyViewedStore()
  const recentProducts = getRecentProducts(limit)

  if (recentProducts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-pink-600" />
        <h3 className="font-semibold text-gray-900">Recently Viewed</h3>
      </div>
      <div className="space-y-3">
        {recentProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug || product.id}`}
            className="flex gap-3 group"
          >
            <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                {product.name}
              </h4>
              <p className="text-sm font-bold text-pink-600 mt-1">
                {formatCurrency(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
