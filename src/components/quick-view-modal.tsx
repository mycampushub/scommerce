'use client'

import React, { useState, useEffect } from 'react'
import { X, Star, ShoppingCart, Heart, Plus, Minus, Check, Truck, Shield, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCartStore } from '@/lib/store/cart-store'
import { formatCurrency } from '@/lib/format-currency'
import { toast } from 'sonner'

export interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  comparePrice?: number
  stock: number
  images?: string[]
  size?: string
  color?: string
  material?: string
  isDefault: boolean
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  basePrice?: number
  comparePrice?: number
  originalPrice?: number
  image: string
  images?: string[]
  rating: number
  reviews: number
  badge?: string
  category?: string
  categoryId?: string
  description?: string
  hasVariants?: boolean
  stock?: number
  variants?: ProductVariant[]
}

interface QuickViewModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000)
  const { addItem } = useCartStore()

  // Process variants and selections
  const variants = product?.variants || []
  const hasVariants = product?.hasVariants && variants.length > 0
  
  // Get available sizes, colors, materials from variants
  const availableSizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  const availableColors = [...new Set(variants.map(v => v.color).filter(Boolean))]
  const availableMaterials = [...new Set(variants.map(v => v.material).filter(Boolean))]
  
  // Get current price and stock based on selected variant
  const currentPrice = selectedVariant ? selectedVariant.price : (product?.basePrice || product?.price || 0)
  const currentComparePrice = selectedVariant ? selectedVariant.comparePrice : (product?.comparePrice || product?.originalPrice || null)
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0)
  const currentImages = selectedVariant?.images && selectedVariant.images.length > 0 ? selectedVariant.images : (product?.images?.length ? product.images : [product?.image || ''])
  
  // Calculate discount percentage
  const discountPercentage = currentComparePrice
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0

  // Handle variant selection
  const handleVariantSelection = (size: string | undefined, color?: string, material?: string) => {
    setSelectedSize(size || '')
    setSelectedColor(color || '')
    setSelectedMaterial(material || '')

    // Find matching variant
    const matchingVariant = variants.find(v =>
      (!size || v.size === size) &&
      (!color || v.color === color) &&
      (!material || v.material === material)
    )

    if (matchingVariant) {
      setSelectedVariant(matchingVariant)
      setSelectedImageIndex(0)
    }
  }

  // Auto-select default variant on product load
  useEffect(() => {
    if (hasVariants && variants.length > 0) {
      const defaultVariant = variants.find(v => v.isDefault) || variants[0]
      setSelectedVariant(defaultVariant)
      setSelectedSize(defaultVariant.size || '')
      setSelectedColor(defaultVariant.color || '')
      setSelectedMaterial(defaultVariant.material || '')
    } else {
      setSelectedVariant(null)
      setSelectedSize('')
      setSelectedColor('')
      setSelectedMaterial('')
    }
  }, [product, hasVariants, variants])

  // Fetch site settings for free shipping threshold
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result = await response.json() as any
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

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    // Use variant data if available
    if (hasVariants && selectedVariant) {
      addItem({
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        originalPrice: selectedVariant.comparePrice || product.comparePrice || product.originalPrice,
        image: (selectedVariant.images && selectedVariant.images[0]) || product.images?.[0] || product.image,
        variantId: selectedVariant.id,
        variantSku: selectedVariant.sku,
        size: selectedVariant.size,
        color: selectedVariant.color,
        material: selectedVariant.material,
        quantity,
      })
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.basePrice || product.price,
        originalPrice: product.comparePrice || product.originalPrice,
        image: product.images?.[0] || product.image,
        quantity,
      })
    }

    toast.success('Added to cart successfully!')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick View - {product.name}</DialogTitle>
        </DialogHeader>

        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close quick view"
          className="absolute right-4 top-4 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative bg-gray-50 p-6 md:p-8">
            <div className="space-y-4">
              <div className="relative max-w-[350px] mx-auto aspect-[3/4] rounded-xl overflow-hidden bg-white shadow-sm">
                {product.badge && (
                  <span className="absolute top-4 left-4 z-10 bg-pink-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                    {product.badge}
                  </span>
                )}
                <img
                  src={currentImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className="absolute top-4 right-4 min-w-[44px] min-h-[44px] w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-pink-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-600 text-pink-600' : ''}`} />
                </button>
              </div>
              {/* Thumbnail Gallery */}
              {currentImages.length > 1 && (
                <div className="flex gap-3 justify-center overflow-x-auto pb-2">
                  {currentImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`View image ${idx + 1} of ${currentImages.length}`}
                      className={`flex-shrink-0 min-w-[72px] min-h-[72px] w-18 h-18 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
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
          </div>

          {/* Product Details */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="mb-4">
              {product.category && (
                <p className="text-sm text-pink-600 font-medium mb-1.5">{product.category}</p>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h2>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
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
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(currentPrice)}</span>
              {currentComparePrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(currentComparePrice)}
                  </span>
                  <span className="text-sm text-pink-600 font-medium">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {currentStock > 0 ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-600 font-medium">
                    In Stock ({currentStock} available)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Variant Selectors */}
            {hasVariants && (
              <div className="space-y-5 mb-6">
                {/* Size Selection */}
                {availableSizes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Size: <span className="text-pink-600">{selectedSize || 'Select'}</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleVariantSelection(size, selectedColor, selectedMaterial)}
                          className={`min-h-[44px] w-20 px-3 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                            selectedSize === size
                              ? 'border-pink-600 bg-pink-50 text-pink-600'
                              : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                          }`}
                        >
                          <span className="transition-all">
                            {size}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {availableColors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Color: <span className="text-pink-600">{selectedColor || 'Select'}</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleVariantSelection(selectedSize, color, selectedMaterial)}
                          className={`min-h-[44px] px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                            selectedColor === color
                              ? 'border-pink-600 bg-pink-50 text-pink-600'
                              : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                          }`}
                        >
                          <span className="transition-all">
                            {color}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Material Selection */}
                {availableMaterials.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Material: <span className="text-pink-600">{selectedMaterial || 'Select'}</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {availableMaterials.map((material) => (
                        <button
                          key={material}
                          onClick={() => handleVariantSelection(selectedSize, selectedColor, material)}
                          className={`min-h-[44px] px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                            selectedMaterial === material
                              ? 'border-pink-600 bg-pink-50 text-pink-600'
                              : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                          }`}
                        >
                          <span className="transition-all">
                            {material}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-16 text-center text-xl font-semibold" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                  className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0 || (hasVariants && !selectedVariant)}
                className={`min-h-[48px] w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {currentStock <= 0 ? 'Out of Stock' : hasVariants && !selectedVariant ? 'Select a Variant' : 'Add to Cart'}
              </button>
              <button 
                className="min-h-[48px] w-full border-2 border-pink-600 text-pink-600 py-4 rounded-xl font-semibold hover:bg-pink-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
              >
                Buy Now
              </button>
            </div>

            {/* Features */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Free Shipping</h4>
                  <p className="text-xs text-gray-600">On orders over {formatCurrency(freeShippingThreshold)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Secure Payment</h4>
                  <p className="text-xs text-gray-600">100% secure checkout</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Easy Returns</h4>
                  <p className="text-xs text-gray-600">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
