'use client'

import React, { useState, useEffect } from 'react'
import { X, Star, ShoppingCart, Heart, Plus, Minus, Check, Truck, Shield, RotateCcw, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { PriceDisplay } from '@/components/price-display'
import { parseImages } from '@/lib/images'
import { resolveProductImages, fetchColorImages, ColorImage } from '@/lib/product-images'

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
  brandName?: string | null
  countryOfOrigin?: string | null
  sizeType?: string | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
  // Material and color for single products
  material?: string | null
  color?: string | null
  // Multi-size/color system
  availableSizes?: string[]
  availableColors?: string[]
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
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [colorImages, setColorImages] = useState<ColorImage[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [variantsError, setVariantsError] = useState(false)
  const { addItem } = useCartStore()

  // Process variants and selections
  const hasVariants = product?.hasVariants || false

  // Fetch variants if not already loaded
  useEffect(() => {
    const fetchVariants = async () => {
      if (product?.hasVariants && (!product.variants || product.variants.length === 0)) {
        setLoadingVariants(true)
        setVariantsError(false)
        try {
          const response = await fetch(`/api/products/${product.id}/variants`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data.variants) {
              setVariants(data.data.variants)
            } else {
              setVariantsError(true)
            }
          } else {
            setVariantsError(true)
          }
        } catch (error) {
          console.error('Error fetching variants:', error)
          setVariantsError(true)
        } finally {
          setLoadingVariants(false)
        }
      } else if (product?.variants) {
        setVariants(product.variants)
      }
    }

    if (product && open) {
      fetchVariants()
    }
  }, [product, open])

  // Fetch color images when product is loaded
  useEffect(() => {
    const fetchColorImagesForProduct = async () => {
      if (!product) return

      try {
        const images = await fetchColorImages(product.id)
        setColorImages(images)
      } catch (error) {
        console.error('Error fetching color images:', error)
      }
    }

    if (product && open) {
      fetchColorImagesForProduct()
    }
  }, [product?.id, open])

  // Get available sizes, colors, materials from variants OR product-level fields
  // Priority: product.availableSizes/availableColors > derived from variants
  const availableSizes = (product?.availableSizes && product.availableSizes.length > 0)
    ? product.availableSizes
    : [...new Set(variants.map(v => v.size).filter(Boolean))]

  const availableColors = (product?.availableColors && product.availableColors.length > 0)
    ? product.availableColors
    : [...new Set(variants.map(v => v.color).filter(Boolean))]

  const availableMaterials = [...new Set(variants.map(v => v.material).filter(Boolean))]

  // Get current price and stock based on selected variant
  const currentPrice = selectedVariant ? selectedVariant.price : (product?.basePrice || product?.price || 0)
  const currentComparePrice = selectedVariant ? selectedVariant.comparePrice : (product?.comparePrice || product?.originalPrice || undefined)
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0)

  // ENHANCED IMAGE LOGIC:
  // 1. If a variant is selected and has images, use those images
  // 2. If color is selected and color images exist for that color, use those
  // 3. Otherwise, use the default product images (product.images or product.image)
  const currentImages = resolveProductImages({
    productId: product?.id || '',
    selectedColor,
    selectedSize,
    variantImages: selectedVariant?.images,
    productImages: product?.images || null,
    colorImages,
  })

  // Get the display image (fallback to placeholder if empty)
  const displayImage = currentImages[selectedImageIndex] || (currentImages.length > 0 ? currentImages[0] : (product?.image || '/placeholder-image.jpg'))

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
      setSelectedImageIndex(0) // Reset to first image when variant changes
    } else {
      setSelectedVariant(null)
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
    // Reset image index when product/variants change
    setSelectedImageIndex(0)
  }, [variants, hasVariants, product?.id])

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

  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    setAddingToCart(true)

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      let cartItem: any

      // Use variant data if available
      if (hasVariants && selectedVariant) {
        cartItem = {
          id: product.id,
          slug: product.slug,
          name: selectedVariant.name || product.name,
          price: selectedVariant.price,
          originalPrice: selectedVariant.comparePrice || product.comparePrice || product.originalPrice,
          image: (selectedVariant.images && selectedVariant.images[0]) || product.images?.[0] || product.image,
          variantId: selectedVariant.id,
          variantSku: selectedVariant.sku,
          size: selectedVariant.size,
          color: selectedVariant.color,
          material: selectedVariant.material,
          quantity,
        }
      } else {
        cartItem = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.basePrice || product.price,
          originalPrice: product.comparePrice || product.originalPrice,
          image: product.images?.[0] || product.image,
          quantity,
        }
      }

      // Add to local cart store
      addItem(cartItem)

      // Sync to server (harmless for guest users - API returns success)
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'add',
            item: {
              productId: cartItem.id,
              variantId: cartItem.variantId,
              quantity: cartItem.quantity,
              size: cartItem.size,
              color: cartItem.color,
            },
          }),
        })
      } catch (syncError) {
        console.error('[QuickView] Error syncing cart to server:', syncError)
      }

      toast.success('Added to cart successfully!')
      onOpenChange(false)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    setAddingToCart(true)

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      let cartItem: any

      // Use variant data if available
      if (hasVariants && selectedVariant) {
        cartItem = {
          id: product.id,
          slug: product.slug,
          name: selectedVariant.name || product.name,
          price: selectedVariant.price,
          originalPrice: selectedVariant.comparePrice || product.comparePrice || product.originalPrice,
          image: (selectedVariant.images && selectedVariant.images[0]) || product.images?.[0] || product.image,
          variantId: selectedVariant.id,
          variantSku: selectedVariant.sku,
          size: selectedVariant.size,
          color: selectedVariant.color,
          material: selectedVariant.material,
          quantity,
        }
      } else {
        cartItem = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.basePrice || product.price,
          originalPrice: product.comparePrice || product.originalPrice,
          image: product.images?.[0] || product.image,
          quantity,
        }
      }

      // Add to local cart store
      addItem(cartItem)

      // Sync to server
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'add',
            item: {
              productId: cartItem.id,
              variantId: cartItem.variantId,
              quantity: cartItem.quantity,
              size: cartItem.size,
              color: cartItem.color,
            },
          }),
        })
      } catch (syncError) {
        console.error('[QuickView] Error syncing cart to server:', syncError)
      }

      // Navigate to checkout
      window.location.href = '/checkout'
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    setIsTogglingWishlist(true)
    try {
      if (isWishlisted) {
        // Remove from wishlist
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: product.id })
        })
        const data = await response.json() as any
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to remove from wishlist')
        }
        toast.success('Removed from wishlist')
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: product.id })
        })
        const data = await response.json() as any
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to add to wishlist')
        }
        toast.success('Added to wishlist')
      }
      setIsWishlisted(!isWishlisted)
    } catch (error: any) {
      console.error('Wishlist toggle error:', error)
      toast.error(error.message || 'Failed to update wishlist')
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-7xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 rounded-lg" aria-describedby="quick-view-description">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick View - {product.name}</DialogTitle>
          <DialogDescription id="quick-view-description" className="sr-only">
            Quick view dialog for {product.name}
          </DialogDescription>
        </DialogHeader>

        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative bg-gray-50 p-4">
            <div className="space-y-3">
              <div className="relative max-w-[320px] mx-auto aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-sm">
                {product.badge && (
                  <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                    {product.badge}
                  </span>
                )}
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleToggleWishlist}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  disabled={isTogglingWishlist}
                  className={`absolute top-3 right-3 h-9 w-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-pink-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                    isTogglingWishlist ? 'opacity-50' : ''
                  }`}
                >
                  {isTogglingWishlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-pink-600 text-pink-600' : ''}`} />}
                </button>
              </div>
              {/* Thumbnail Gallery */}
              {currentImages.length > 1 && (
                <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                  {currentImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`View image ${idx + 1} of ${currentImages.length}`}
                      className={`flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                        selectedImageIndex === idx
                          ? 'border-pink-600 ring-1 ring-pink-200'
                          : 'border-gray-200 hover:border-pink-400'
                      }`}
                    >
                      <img
                        src={img || '/placeholder-image.jpg'}
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-5 flex flex-col">
            <div className="mb-3">
              {product.category && (
                <p className="text-xs text-pink-600 font-medium mb-1.5">{product.category}</p>
              )}
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
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
              <span className="text-xs text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-3">
              <PriceDisplay
                value={currentPrice}
                originalPrice={currentComparePrice}
                showDecimals={false}
                className="text-2xl font-bold text-gray-900"
              />
              {currentComparePrice && (
                <span className="text-xs text-pink-600 font-medium">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-4">
              {currentStock > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-green-600 font-medium">
                    In Stock ({currentStock} available)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Product Metadata: Brand and Country of Origin */}
            <div className="space-y-2 mb-4 py-2 border-t border-b border-gray-200">
              {product.brandName && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Brand:</span>
                  <span className="text-xs font-medium text-gray-900">{product.brandName}</span>
                </div>
              )}
              {product.countryOfOrigin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Origin:</span>
                  <span className="text-xs font-medium text-gray-900">{product.countryOfOrigin}</span>
                </div>
              )}
              {!hasVariants && (product.sizeLabel || (product.sizeValue && product.sizeUnit)) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Size:</span>
                  <span className="text-xs font-medium text-gray-900">
                    {product.sizeLabel || `${product.sizeValue}${product.sizeUnit}`}
                  </span>
                </div>
              )}
              {!hasVariants && product.material && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Material:</span>
                  <span className="text-xs font-medium text-gray-900">{product.material}</span>
                </div>
              )}
              {!hasVariants && product.color && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Color:</span>
                  <span className="text-xs font-medium text-gray-900">{product.color}</span>
                </div>
              )}
            </div>

            {/* Variant Selectors */}
            {hasVariants && (
              <div className="space-y-4 mb-4">
                {loadingVariants ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
                  </div>
                ) : variantsError ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    Failed to load variant options. Please open the product page to select variants.
                  </div>
                ) : variants.length === 0 ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                    No variants available for this product.
                  </div>
                ) : (
                  <>
                    {/* Size Selection */}
                    {availableSizes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Size: <span className="text-pink-600 text-sm">{selectedSize || 'Select'}</span></h3>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => handleVariantSelection(size, selectedColor, selectedMaterial)}
                              className={`h-9 px-3 rounded-md border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                                selectedSize === size
                                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                                  : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Selection */}
                    {availableColors.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Color: <span className="text-pink-600 text-sm">{selectedColor || 'Select'}</span></h3>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleVariantSelection(selectedSize, color, selectedMaterial)}
                              className={`h-9 px-3 rounded-md border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                                selectedColor === color
                                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                                  : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Material Selection */}
                    {availableMaterials.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Material: <span className="text-pink-600 text-sm">{selectedMaterial || 'Select'}</span></h3>
                        <div className="flex flex-wrap gap-2">
                          {availableMaterials.map((material) => (
                            <button
                              key={material}
                              onClick={() => handleVariantSelection(selectedSize, selectedColor, material)}
                              className={`h-9 px-3 rounded-md border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                                selectedMaterial === material
                                  ? 'border-pink-600 bg-pink-50 text-pink-600'
                                  : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                              }`}
                            >
                              {material}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="h-10 w-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-base font-semibold" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                  className="h-10 w-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0 || (hasVariants && !selectedVariant && !variantsError) || addingToCart || variantsError}
                  className={`h-12 flex-1 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                    currentStock <= 0 || (hasVariants && !selectedVariant && !variantsError) || addingToCart || variantsError
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {addingToCart ? 'Adding...' : variantsError ? 'View Product Page' : currentStock <= 0 ? 'Out of Stock' : hasVariants && !selectedVariant ? 'Select a Variant' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={currentStock <= 0 || (hasVariants && !selectedVariant && !variantsError) || addingToCart || variantsError}
                  className={`h-12 w-full sm:w-auto px-6 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                    currentStock <= 0 || (hasVariants && !selectedVariant && !variantsError) || addingToCart || variantsError
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {addingToCart ? 'Processing...' : variantsError ? 'View Product Page' : currentStock <= 0 ? 'Out of Stock' : hasVariants && !selectedVariant ? 'Select a Variant' : 'Buy Now'}
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200 mt-auto">
              <div className="flex items-start gap-2">
                <Truck className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Free Shipping</h4>
                  <p className="text-xs text-gray-600">On orders over <PriceDisplay value={freeShippingThreshold} showDecimals={false} /></p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Secure Payment</h4>
                  <p className="text-xs text-gray-600">100% secure checkout</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="w-5 h-5 text-pink-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Easy Returns</h4>
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
