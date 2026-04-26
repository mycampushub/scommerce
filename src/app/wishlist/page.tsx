'use client'

import React, { useState, useEffect } from 'react'
import { Heart, Trash2, ShoppingCart, ShoppingBag, ArrowRight, Loader2, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number
    images: string
    stock: number
    rating?: number
    reviews?: number
    category: {
      name: string
      slug: string
    }
  }
}

export default function WishlistPage() {
  const { user, isAuthenticated } = useAuth()
  const { addItem } = useCartStore()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [movingAll, setMovingAll] = useState(false)
  const [bulkRemoving, setBulkRemoving] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wishlist')
      const data = await response.json()
      
      if (data.success) {
        setWishlistItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setRemoving(productId)
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setWishlistItems((prev) => 
          prev.filter((item) => item.productId !== productId)
        )
        toast.success('Removed from wishlist')
      } else {
        toast.error(data.error || 'Failed to remove from wishlist')
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove from wishlist')
    } finally {
      setRemoving(null)
    }
  }

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      const images = JSON.parse(item.product.images || '[]')
      const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : item.product.images

      addItem({
        id: item.product.id,
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
        if (item && item.product.stock > 0) {
          const images = JSON.parse(item.product.images || '[]')
          const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : item.product.images

          addItem({
            id: item.product.id,
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
      setBulkRemoving(true)
      let removedCount = 0

      for (const itemId of selectedItems) {
        const item = wishlistItems.find(i => i.id === itemId)
        if (item) {
          const response = await fetch(`/api/wishlist?productId=${item.productId}`, {
            method: 'DELETE',
          })
          const data = await response.json()
          if (data.success) {
            removedCount++
          }
        }
      }

      if (removedCount > 0) {
        toast.success(`Removed ${removedCount} item${removedCount > 1 ? 's' : ''} from wishlist`)
        await fetchWishlist()
      }

      setSelectedItems(new Set())
    } catch (error) {
      console.error('Error removing items:', error)
      toast.error('Failed to remove items')
    } finally {
      setBulkRemoving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Heart className="w-16 h-16 text-pink-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sign in to view your wishlist
            </h1>
            <p className="text-gray-600 mb-8">
              Save your favorite products and never miss out on great deals.
            </p>
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="container mx-auto px-4 py-8">
        {wishlistItems.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.size === wishlistItems.length}
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-600"
                />
                <span className="text-sm text-gray-600">
                  {selectedItems.size === wishlistItems.length ? 'Deselect All' : 'Select All'} ({selectedItems.size})
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleMoveAllToCart}
                disabled={selectedItems.size === 0 || movingAll}
                size="sm"
              >
                {movingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Move All to Cart
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkRemove}
                disabled={selectedItems.size === 0 || bulkRemoving}
                size="sm"
              >
                {bulkRemoving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Remove Selected
              </Button>
            </div>
          </div>
        )}

        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your wishlist is empty
                </h2>
                <p className="text-gray-600 mb-8">
                  Save items you love to keep them organized and easy to find.
                </p>
                <Link href="/shop">
                  <Button size="lg">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const images = JSON.parse(item.product.images || '[]')
              const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : item.product.images
              const isOutOfStock = item.product.stock <= 0

              const isSelected = selectedItems.has(item.id)

              return (
                <Card key={item.id} className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-pink-600' : ''}`}>
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] bg-gray-100">
                      <Link href={`/product/${item.product.id}`}>
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
                        className="absolute top-3 left-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-pink-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromWishlist(item.productId)}
                        disabled={removing === item.productId}
                        className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removing === item.productId ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link 
                        href={`/${item.product.category.slug}`}
                        className="text-sm text-pink-600 hover:text-pink-700 mb-1 block"
                      >
                        {item.product.category.name}
                      </Link>
                      
                      <Link href={`/product/${item.product.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-pink-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-bold text-gray-900">
                          ৳{item.product.price.toLocaleString()}
                        </span>
                        {item.product.comparePrice && (
                          <span className="text-sm text-gray-400 line-through">
                            ৳{item.product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleMoveToCart(item)}
                          disabled={isOutOfStock}
                          className="flex-1"
                          size="sm"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromWishlist(item.productId)}
                          disabled={removing === item.productId}
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="container mx-auto px-4 pb-16">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Looking for more products?
                </p>
                <Link href="/shop">
                  <Button variant="outline" size="lg">
                    Continue Shopping
                    <ArrowRight className="w-4 h-4 ml-2" />
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
