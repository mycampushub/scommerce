'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  basePrice: number
  originalPrice?: number
  comparePrice?: number
  image: string
  images: string[]
  rating: number
  reviews: number
  badge?: string
  category: string | null
  categorySlug?: string | null
  categoryId: string
  stock: number
  lowStockAlert: number
  hasVariants: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  category?: string
  search?: string
  limit?: number
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'bestselling'
}

// Fetch all products with optional filters
export async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams()

  if (filters?.category) {
    params.append('category', filters.category)
  }

  if (filters?.search) {
    params.append('search', filters.search)
  }

  if (filters?.limit) {
    params.append('limit', filters.limit.toString())
  }

  const url = `/api/products${params.toString() ? '?' + params.toString() : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }

  const data = await response.json() as any
  // API returns { success: true, data: { products: [...] } }
  return Array.isArray(data.data?.products) ? data.data.products : (Array.isArray(data.products) ? data.products : (Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])))
}

// Custom hook to fetch products with filters
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    meta: {
      errorMessage: 'Failed to load products. Please try again.',
    },
  })
}

// Fetch single product by slug or ID
export async function fetchProduct(slugOrId: string): Promise<Product> {
  const response = await fetch(`/api/products/${slugOrId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  
  return await response.json() as any
}

// Custom hook to fetch single product
export function useProduct(slugOrId: string) {
  return useQuery({
    queryKey: ['product', slugOrId],
    queryFn: () => fetchProduct(slugOrId),
    enabled: !!slugOrId,
    meta: {
      errorMessage: 'Failed to load product. Please try again.',
    },
  })
}

// Fetch product variants
export async function fetchProductVariants(slugOrId: string): Promise<any> {
  const response = await fetch(`/api/products/${slugOrId}/variants`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch product variants')
  }
  
  return await response.json()
}

// Custom hook to fetch product variants
export function useProductVariants(slugOrId: string) {
  return useQuery({
    queryKey: ['product-variants', slugOrId],
    queryFn: () => fetchProductVariants(slugOrId),
    enabled: !!slugOrId,
  })
}

// Fetch recommended products
export async function fetchRecommendedProducts(productId: string, categoryId?: string, limit = 8): Promise<Product[]> {
  const params = new URLSearchParams()
  params.append('productId', productId)
  if (categoryId) {
    params.append('categoryId', categoryId)
  }
  params.append('limit', limit.toString())
  params.append('type', 'mixed')
  
  const response = await fetch(`/api/products/recommendations?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommended products')
  }
  
  const result = await response.json() as any
  return result.data?.products || []
}

// Custom hook to fetch recommended products
export function useRecommendedProducts(productId: string, categoryId?: string) {
  return useQuery({
    queryKey: ['recommended-products', productId, categoryId],
    queryFn: () => fetchRecommendedProducts(productId, categoryId),
    enabled: !!productId,
  })
}

// Hook to prefetch products for navigation
export function usePrefetchProduct() {
  const queryClient = useQueryClient()
  
  return (slugOrId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', slugOrId],
      queryFn: () => fetchProduct(slugOrId),
      staleTime: 1000 * 60 * 5, // 5 minutes
    })
  }
}

// Mutation to update product
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update product')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate products queries to refetch
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product')
    },
  })
}
