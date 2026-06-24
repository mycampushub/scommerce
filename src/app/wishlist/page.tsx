'use client'

import React, { useState, useCallback } from 'react'
import { Heart, Trash2, ShoppingCart, ShoppingBag, ArrowRight, Loader2, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWishlist, useRemoveFromWishlist, type WishlistItem } from '@/hooks/use-wishlist'
import { parseImages } from '@/lib/images'
import { PriceDisplay } from '@/components/price-display'

export default function WishlistPage() {
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCartStore()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [movingAll, setMovingAll] = useState(false)
  
  // Fetch wishlist using React Query
  const { data: wishlistItems = [], isLoading, refetch } = useWishlist()
  
  // Remove from wishlist mutation
  const { mutate: removeFromWishlist, isPending: removing } = useRemoveFromWishlist()
  
  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId)
  }

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      const images = parseImages(item.product.images)
      const imageUrl = images.length > 0 ? images[0] : ''

      addItem({
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        price: item.product.price,
        originalPrice: item.product.comparePrice,
        image: imageUrl,
        quantity: 1,
      })

      toast.success('Added to cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.size === wishlistItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(wishlistItems.map(item => item.id)))
    }
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleMoveAllToCart = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to move to cart')
      return
    }

    try {
      setMovingAll(true)
      let successCount = 0
      let failedCount = 0

      for (const itemId of selectedItems) {
        const item = wishlistItems.find(i => i.id === itemId)
        if (item && (item.product.hasVariants || item.product.stock > 0)) {
          const images = parseImages(item.product.images)
          const imageUrl = images.length > 0 ? images[0] : ''

          addItem({
            id: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            price: item.product.price,
            originalPrice: item.product.comparePrice,
            image: imageUrl,
            quantity: 1,
          })
          successCount++
        } else {
          failedCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Moved ${successCount} item${successCount > 1 ? 's' : ''} to cart${failedCount > 0 ? ` (${failedCount} out of stock)` : ''}`)
      }
      if (failedCount > 0 && successCount === 0) {
        toast.error('All selected items are out of stock')
      }

      setSelectedItems(new Set())
    } catch (error) {
      console.error('Error moving items to cart:', error)
      toast.error('Failed to move items to cart')
    } finally {
      setMovingAll(false)
    }
  }

  const handleBulkRemove = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to remove')
      return
    }

    if (!confirm(`Are you sure you want to remove ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} from your wishlist?`)) {
      return
    }

    try {
      let removedCount = 0

      for (const itemId of selectedItems) {
        const item = wishlistItems.find(i => i.id === itemId)
        if (item) {
          removeFromWishlist(item.productId)
          removedCount++
        }
      }

      if (removedCount > 0) {
        toast.success(`Removed ${removedCount} item${removedCount > 1 ? 's' : ''} from wishlist`)
        await refetch()
      }

      setSelectedItems(new Set())
    } catch (error) {
      console.error('Error removing items:', error)
      toast.error('Failed to remove items')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-md mx-auto text-center">
            <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-pink-600 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Sign in to view your wishlist
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Save your favorite products and never miss out on great deals.
            </p>
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 text-sm sm:text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-pink-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gray-50 py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {wishlistItems.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 sm:p-5 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === wishlistItems.length}
                  onChange={handleSelectAll}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded border-gray-300 text-pink-600 focus:ring-pink-600"
                />
                <span className="text-sm sm:text-base text-gray-600">
                  {selectedItems.size === wishlistItems.length ? 'Deselect All' : 'Select All'} ({selectedItems.size})
                </span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handleMoveAllToCart}
                disabled={selectedItems.size === 0 || movingAll}
                size="sm"
                className="flex-1 sm:flex-none h-10 sm:h-11 text-xs sm:text-sm"
              >
                {movingAll ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                )}
                <span className="hidden xs:inline sm:inline">Move All to Cart</span>
                <span className="xs:hidden sm:hidden">Move to Cart</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkRemove}
                disabled={selectedItems.size === 0}
                size="sm"
                className="flex-1 sm:flex-none h-10 sm:h-11 text-xs sm:text-sm"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">Remove Selected</span>
                <span className="xs:hidden sm:hidden">Remove</span>
              </Button>
            </div>
          </div>
        )}

        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 sm:py-16">
              <div className="text-center px-4">
                <Heart className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Your wishlist is empty
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
                  Save items you love to keep them organized and easy to find.
                </p>
                <Link href="/shop">
                  <Button size="lg" className="h-12 sm:h-14 text-sm sm:text-base px-6 sm:px-8">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((item) => {
              const images = parseImages(item.product.images)
              const imageUrl = images.length > 0 ? images[0] : ''
              const isOutOfStock = !item.product.hasVariants && (!(item.product.stock ?? 0) || item.product.stock <= 0)

              const isSelected = selectedItems.has(item.id)

              return (
                <Card key={item.id} className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-pink-600' : ''}`}>
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] bg-gray-100">
                      <Link href={`/product/${item.product.slug}`}>
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">Out of Stock</span>
                        </div>
                      )}

                      {/* Select Checkbox */}
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className="absolute top-3 left-3 sm:top-4 sm:left-4 w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                        aria-label={isSelected ? 'Deselect item' : 'Select item'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                        ) : (
                          <Square className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        )}
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromWishlist(item.productId)}
                        disabled={removing}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Remove from wishlist"
                      >
                        {removing ? (
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 sm:p-5">
                      <Link
                        href={`/collections/${item.product.category.slug}`}
                        className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 block mb-1.5 sm:mb-2 truncate"
                      >
                        {item.product.category.name}
                      </Link>
                      
                      <Link href={`/product/${item.product.slug}`}>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] hover:text-pink-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          <PriceDisplay value={item.product.price} />
                        </span>
                        {item.product.comparePrice && (
                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                            <PriceDisplay value={item.product.comparePrice} />
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 sm:gap-3">
                        <Button
                          onClick={() => handleMoveToCart(item)}
                          disabled={isOutOfStock}
                          className="flex-1 h-10 sm:h-11 text-xs sm:text-sm"
                          size="default"
                        >
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                          <span className="hidden xs:inline sm:inline">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                          <span className="xs:hidden sm:hidden">{isOutOfStock ? 'No Stock' : 'Cart'}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0"
                          onClick={() => handleRemoveFromWishlist(item.productId)}
                          disabled={removing}
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Continue Shopping */}
      {wishlistItems.length > 0 && (
        <div className="container mx-auto px-4 pb-12 sm:pb-16">
          <Card>
            <CardContent className="py-6 sm:py-8">
              <div className="text-center">
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Looking for more products?
                </p>
                <Link href="/shop">
                  <Button variant="outline" size="lg" className="h-10 sm:h-12 text-sm sm:text-base">
                    Continue Shopping
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
