'use client'

import React, { useEffect, useState } from 'react'
import { Package, Calendar, ArrowRight, X, RotateCcw, Search, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderItem {
  id: string
  productName: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod: string
  trackingNumber: string | null
  trackingStatus: string | null
  estimatedDeliveryDate: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancellationReason: string | null
  refundedAt: string | null
  refundedAmount: number | null
  orderItems: OrderItem[]
  createdAt: string
}

interface OrdersResponse {
  success: boolean
  data?: Order[]
  error?: string
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get current user from localStorage (auth token)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Please log in to view your orders')
        setLoading(false)
        return
      }

      // Decode JWT to get userId (simple approach - in production, verify with backend)
      const userId = getUserIdFromToken(token)
      if (!userId) {
        setError('Unable to verify user identity. Please log in again.')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/orders?userId=${userId}`)
      const result: OrdersResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch orders')
      }

      setOrders(result.data || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
      toast.error('Failed to load your orders')
    } finally {
      setLoading(false)
    }
  }

  // Simple JWT decoder - in production, use proper auth library
  const getUserIdFromToken = (token: string): string | null => {
    try {
      const payload = token.split('.')[1]
      const decoded = JSON.parse(atob(payload))
      return decoded.userId || decoded.sub || null
    } catch {
      return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'DELIVERED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const canCancelOrder = (order: Order) =>
    ['PENDING', 'CONFIRMED'].includes(order.status)

  const canRequestRefund = (order: Order) =>
    order.status === 'DELIVERED' && !order.refundedAt

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelledBy: 'user',
          reason: 'Customer requested cancellation',
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to cancel order')
      }

      toast.success('Order cancelled successfully')
      fetchOrders() // Refresh orders
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      toast.error(err.message || 'Failed to cancel order')
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderItems.some((item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-1">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by order number or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Link href="/login">
                <Button className="mt-4 bg-red-600 hover:bg-red-700">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!error && filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'No orders found matching your criteria'
                  : orders.length === 0
                  ? "You haven't placed any orders yet"
                  : 'No orders found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {orders.length === 0
                  ? 'Start shopping to create your first order'
                  : 'Try adjusting your search or filter'}
              </p>
              <Link href="/">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                      <Link href={`/order-confirmation?id=${order.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items Preview */}
                  <div className="flex gap-4 overflow-x-auto pb-2 mb-4">
                    {order.orderItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          +{order.orderItems.length - 3}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}</span>
                      <span>•</span>
                      <span>{order.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-lg font-bold text-pink-600">
                        ৳{order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {canCancelOrder(order) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                    {canRequestRefund(order) && (
                      <Link href={`/order-confirmation?id=${order.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Request Refund
                        </Button>
                      </Link>
                    )}
                    {order.trackingNumber && order.status === 'SHIPPED' && (
                      <Link href={`/track-order?order=${order.orderNumber}`}>
                        <Button size="sm" variant="outline">
                          Track Order
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage
