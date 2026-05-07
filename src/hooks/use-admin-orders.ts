'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { Order, OrderFilters, OrderItem } from './use-orders'

// Re-export Order type for convenience
export type { Order, OrderFilters, OrderItem }

// Fetch admin orders with filters
export async function fetchAdminOrders(filters?: OrderFilters): Promise<Order[]> {
  const params = new URLSearchParams()
  
  if (filters?.status) {
    params.append('status', filters.status)
  }
  
  if (filters?.search) {
    params.append('search', filters.search)
  }
  
  const url = `/api/admin/orders${params.toString() ? '?' + params.toString() : ''}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }
  
  const result = await response.json() as any
  return result.data || []
}

// Custom hook to fetch admin orders
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
        throw new Error('Failed to update order status')
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
        throw new Error('Failed to update order')
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
        throw new Error('Failed to delete order')
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
        
        // Open export endpoint in a new tab to trigger download
        const exportUrl = `/api/admin/orders/export${params.toString() ? '?' + params.toString() : ''}`
        window.open(exportUrl, '_blank')
        
        toast({
          title: 'Export Started',
          description: 'Your orders export is being downloaded',
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
