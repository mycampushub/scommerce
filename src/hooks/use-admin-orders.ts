'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { Order, OrderFilters, OrderItem } from './use-orders'

// Re-export Order type for convenience
export type { Order, OrderFilters, OrderItem }

// Fetch admin orders with pagination
export async function fetchAdminOrdersPage({ pageParam = 1, filters }: { 
  pageParam?: number
  filters?: OrderFilters 
}): Promise<{
  data: Order[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}> {
  const params = new URLSearchParams()
  params.append('page', pageParam.toString())
  params.append('limit', '20')
  
  if (filters?.status) {
    params.append('status', filters.status)
  }
  
  if (filters?.search) {
    params.append('search', filters.search)
  }

  if (filters?.dateFrom) {
    params.append('dateFrom', filters.dateFrom)
  }

  if (filters?.dateTo) {
    params.append('dateTo', filters.dateTo)
  }

  const url = `/api/admin/orders${params.toString() ? '?' + params.toString() : ''}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  const result = await response.json() as any
  return result
}

// Fetch admin orders with filters (legacy for compatibility)
export async function fetchAdminOrders(filters?: OrderFilters): Promise<Order[]> {
  const params = new URLSearchParams()
  
  if (filters?.status) {
    params.append('status', filters.status)
  }
  
  if (filters?.search) {
    params.append('search', filters.search)
  }

  if (filters?.dateFrom) {
    params.append('dateFrom', filters.dateFrom)
  }

  if (filters?.dateTo) {
    params.append('dateTo', filters.dateTo)
  }

  const url = `/api/admin/orders${params.toString() ? '?' + params.toString() : ''}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  const result = await response.json() as any
  return result.data || []
}

// Custom hook to fetch admin orders with infinite scroll
export function useAdminOrdersInfinite(filters?: OrderFilters) {
  const { toast } = useToast()

  return useInfiniteQuery({
    queryKey: ['admin-orders', filters],
    queryFn: ({ pageParam = 1 }) => fetchAdminOrdersPage({ pageParam, filters }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    meta: {
      errorMessage: 'Failed to load orders',
    },
  })
}

// Custom hook to fetch admin orders (legacy for backward compatibility)
export function useAdminOrders(filters?: OrderFilters) {
  const { toast } = useToast()

  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () => fetchAdminOrders(filters),
    meta: {
      errorMessage: 'Failed to load orders',
    },
  })
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      trackingNumber, 
      trackingStatus, 
      estimatedDeliveryDate 
    }: { 
      orderId: string
      status: string
      trackingNumber?: string | null
      trackingStatus?: string | null
      estimatedDeliveryDate?: string | null
    }) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || null,
          trackingStatus: trackingStatus || 'PENDING',
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update order status')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate orders queries to refetch
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      })
    },
  })
}

// Update order details
export function useUpdateOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: Partial<Order> }) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update order')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate orders queries to refetch
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Success',
        description: 'Order updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order',
        variant: 'destructive',
      })
    },
  })
}

// Delete order
export function useDeleteOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete order')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      // Invalidate orders queries to refetch
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Success',
        description: 'Order deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete order',
        variant: 'destructive',
      })
    },
  })
}

// Export orders to CSV
export function useExportOrders() {
  const { toast } = useToast()
  
  return {
    export: async (filters?: OrderFilters) => {
      try {
        const params = new URLSearchParams()
        if (filters?.status) {
          params.append('status', filters.status)
        }
        
        const exportUrl = `/api/admin/orders/export${params.toString() ? '?' + params.toString() : ''}`
        const response = await fetch(exportUrl)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Export failed')
        }
        
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: 'Export Complete',
          description: 'Your orders export has been downloaded',
        })
      } catch (error) {
        console.error('Export error:', error)
        toast({
          title: 'Export Failed',
          description: 'Failed to export orders. Please try again.',
          variant: 'destructive',
        })
      }
    },
  }
}
