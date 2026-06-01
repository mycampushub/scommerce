'use client'
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Package, Calendar, ArrowRight, X, RotateCcw, Search, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { useAuth } from '@/hooks/use-auth'
import { useOrders, useCancelOrder, type Order, type OrderItem } from '@/hooks/use-orders'
import { PriceDisplay } from '@/components/price-display'

function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user, loading: authLoading } = useAuth()
  
  // Fetch orders using React Query
  const filters = {
    userId: user?.id,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
  }
  
  const { data: orders = [], isLoading, error } = useOrders(filters)
  
  // Cancel order mutation
  const { mutate: cancelOrder } = useCancelOrder()

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

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) {
      return
    }

    cancelOrder({ orderId, reason: 'Customer requested cancellation' })
  }

  // Orders are already filtered by the server-side API

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
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
          {error && !user && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-700">Please log in to view your orders</p>
                <Link href="/login">
                  <Button className="mt-4 bg-red-600 hover:bg-red-700">
                    Go to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!error && orders.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No orders found matching your criteria'
                    : "You haven't placed any orders yet"}
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
              {orders.map((order) => (
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
                        <span>{order.paymentMethod?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-lg font-bold text-pink-600">
                          <PriceDisplay value={order.total} />
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
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}

export default OrdersPage
