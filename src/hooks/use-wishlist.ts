'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
export interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number
    images: string[]
    stock: number
    hasVariants?: boolean
    rating?: number
    reviews?: number
    category: {
      name: string
      slug: string
    }
  }
}

// Fetch wishlist items
export async function fetchWishlist(): Promise<WishlistItem[]> {
  const response = await fetch('/api/wishlist', {
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error('Failed to fetch wishlist')
  }

  const data = await response.json() as any
  return data.data || []
}

// Custom hook to fetch wishlist
export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
    meta: {
      errorMessage: 'Failed to load wishlist',
    },
  })
}

// Add item to wishlist
export function useAddToWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error('Failed to add to wishlist')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Added to wishlist')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to wishlist')
    },
  })
}

// Remove item from wishlist
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Removed from wishlist')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove from wishlist')
    },
  })
}

// Toggle wishlist item (add if not exists, remove if exists)
export function useToggleWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, isInWishlist }: { productId: string; isInWishlist: boolean }) => {
      const url = `/api/wishlist?productId=${productId}`
      const method = isInWishlist ? 'DELETE' : 'POST'

      const response = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        credentials: 'include',
        body: method === 'POST' ? JSON.stringify({ productId }) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update wishlist')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success(variables.isInWishlist ? 'Removed from wishlist' : 'Added to wishlist')
    },
    onError: (error: Error) => {
      // Don't show error here - let the calling component handle it
      // The error will be caught in the component
    },
  })
}

// Clear entire wishlist
export function useClearWishlist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to clear wishlist')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Wishlist cleared')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clear wishlist')
    },
  })
}
