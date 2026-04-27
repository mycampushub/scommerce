'use client'

import React, { useState, useEffect } from 'react'
import { X, Star, ShoppingCart, Heart, Plus, Minus, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCartStore } from '@/lib/store/cart-store'
import { formatCurrency } from '@/lib/format-currency'
import { toast } from 'sonner'

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  rating: number
  reviews: number
  badge?: string
  category: string
  description?: string
  sizes?: string[]
  colors?: string[]
}

interface QuickViewModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000)
  const { addItem } = useCartStore()

  // Fetch site settings for free shipping threshold
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result = await response.json()
        if (result.success && result.data) {
          setFreeShippingThreshold(result.data.freeShippingThreshold || 5000)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        // Keep default value on error
      }
    }

    fetchSettings()
  }, [])

  // Guard for null product
  if (!product) {
    return null
  }

  const sizes = product.sizes || ['XS', 'S', 'M', 'L', 'XL']
  const colors = product.colors || ['Red', 'Blue', 'Green', 'Black', 'White']
  const productImages = product.images?.length ? product.images : [product.image]

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      quantity,
    })

    toast.success('Added to cart successfully!')
    onOpenChange(false)
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick View - {product.name}</DialogTitle>
        </DialogHeader>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image - Made smaller to prevent cropping */}
          <div className="space-y-3">
            <div className="relative max-w-[300px] mx-auto aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
              {product.badge && (
                <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {product.badge}
                </span>
              )}
              <img
                src={productImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-pink-600 hover:text-white transition-colors"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-600 text-pink-600' : ''}`} />
              </button>
            </div>
            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-pink-600 ring-2 ring-pink-200'
                        : 'border-gray-200 hover:border-pink-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="text-sm text-gray-500">{product.category}</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{product.name}</h2>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="text-2xl font-bold text-pink-600">{formatCurrency(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-600 text-sm px-2 py-1 rounded font-medium">
                    -{discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Size
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-pink-600'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                        selectedColor === color
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-pink-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="w-full border-2 border-pink-600 text-pink-600 py-4 rounded-xl font-semibold hover:bg-pink-50 transition-colors">
                Buy Now
              </button>
            </div>

            {/* Features */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-600" />
                <span>Free shipping on orders over {formatCurrency(freeShippingThreshold)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-600" />
                <span>30-day easy returns</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-600" />
                <span>Secure payment</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
