'use client'

import React, { useState } from 'react'
import { Heart, Star, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { QuickViewModal, Product } from '@/components/quick-view-modal'
import { useCartStore } from '@/lib/store/cart-store'
import { formatCurrency } from '@/lib/format-currency'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const { addItem } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
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

  return (
    <div className="group">
      <QuickViewModal
        product={product}
        open={showQuickView}
        onOpenChange={setShowQuickView}
      />
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
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600 hover:text-white"
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-600 text-pink-600' : ''}`} />
        </button>
        <button
          onClick={() => setShowQuickView(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white whitespace-nowrap"
        >
          Quick View
        </button>
      </div>
      <Link href={`/product/${product.id}`}>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
      </Link>
      <div className="flex items-center gap-1 mb-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500">({product.reviews})</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          className="bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors"
          aria-label="Add to cart"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
