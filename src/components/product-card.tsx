'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Heart, Star, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { QuickViewModal, Product } from '@/components/quick-view-modal'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { PriceDisplay } from '@/components/price-display'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isWishlistLoading, setIsWishlistLoading] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const { addItem } = useCartStore()

  const checkWishlistStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        const isProductWishlisted = data.data?.some((item: any) => item.productId === product.id)
        setIsWishlisted(isProductWishlisted)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }, [product.id])

  // Check if product is in wishlist on mount
  useEffect(() => {
    checkWishlistStatus()
  }, [checkWishlistStatus])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isWishlistLoading) return

    setIsWishlistLoading(true)

    // Optimistic update - toggle immediately
    setIsWishlisted(prev => !prev)

    try {
      const method = !isWishlisted ? 'POST' : 'DELETE'
      const url = method === 'DELETE'
        ? `/api/wishlist?productId=${product.id}`
        : '/api/wishlist'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ productId: product.id }) : undefined,
      })

      if (!response.ok) {
        // Revert optimistic update if failed
        setIsWishlisted(prev => !prev)

        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Please login to manage wishlist')
        } else if (errorData.error) {
          toast.error(errorData.error)
        } else {
          toast.error('Failed to update wishlist')
        }

        return
      }

      const data = await response.json()

      // Show success message
      if (!isWishlisted) {
        toast.success('Added to wishlist!')
      } else {
        toast.success('Removed from wishlist')
      }

    } catch (error) {
      // Revert optimistic update on error
      setIsWishlisted(prev => !prev)
      console.error('Wishlist error:', error)
      toast.error('Failed to update wishlist')
    } finally {
      setIsWishlistLoading(false)
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()

    // For products with variants, show quick view instead of adding directly
    if (product.hasVariants) {
      setShowQuickView(true)
      return
    }

    // For simple products, add directly to cart
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
        <Link href={`/product/${product.slug}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
        <button
          onClick={toggleWishlist}
          disabled={isWishlistLoading}
          className={`absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${isWishlistLoading ? 'opacity-100' : ''}`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
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
      <Link href={`/product/${product.slug}`}>
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
        <PriceDisplay value={product.price} originalPrice={product.originalPrice} />
        <button
          onClick={handleAddToCart}
          className={`${product.hasVariants ? 'bg-gray-600' : 'bg-pink-600'} text-white p-2 rounded-lg hover:bg-pink-700 transition-colors`}
          aria-label={product.hasVariants ? 'View options' : 'Add to cart'}
          title={product.hasVariants ? 'View options' : 'Add to cart'}
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
