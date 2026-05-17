'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Types
export interface OrderItem {
  id: string
  productName: string
  productImage: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: any
  billingAddress: any
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string | null
  trackingNumber: string | null
  trackingStatus: string | null
  estimatedDeliveryDate: string | null
  notes: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null
  refundedAt: string | null
  refundedAmount: number | null
  orderItems: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderFilters {
  userId?: string
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

// Fetch orders
export async function fetchOrders(filters?: OrderFilters): Promise<Order[]> {
  const params = new URLSearchParams()

  if (filters?.userId) {
    params.append('userId', filters.userId)
  }

  if (filters?.status) {
    params.append('status', filters.status)
  }

  if (filters?.search) {
    params.append('search', filters.search)
  }

  const url = `/api/orders${params.toString() ? '?' + params.toString() : ''}`
  const response = await fetch(url, {
    credentials: 'include', // Include cookies for authentication
  })

  if (!response.ok) {
    throw new Error('Failed to fetch orders')
  }

  const result = await response.json() as any
  return result.data || []
}

// Custom hook to fetch orders
export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    meta: {
      errorMessage: 'Failed to load orders',
    },
  })
}

// Fetch single order
export async function fetchOrder(orderId: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}`, {
    credentials: 'include', // Include cookies for authentication
  })

  if (!response.ok) {
    throw new Error('Failed to fetch order')
  }

  const result = await response.json() as any
  return result.data
}

// Custom hook to fetch single order
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    meta: {
      errorMessage: 'Failed to load order',
    },
  })
}

// Create new order
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate orders queries to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create order')
    },
  })
}

// Cancel order
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          cancelledBy: 'user',
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel order')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate orders queries to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order')
    },
  })
}

// Request refund
export function useRefundOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to request refund')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate orders queries to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Refund requested successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to request refund')
    },
  })
}
