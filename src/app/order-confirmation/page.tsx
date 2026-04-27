'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { Check, ShoppingBag, Home as HomeIcon, ArrowLeft, Download, Share2, Package, X, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  customerPhone?: string
  shippingAddress: string
  billingAddress: string
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
  refundMethod: string | null
  refundReason: string | null
  orderItems: OrderItem[]
  createdAt: string
}

interface OrderResponse {
  success: boolean
  data?: Order
  error?: string
}

// Components
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="modern ecommerce"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/collections/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</Link>
            <Link href="/collections/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</Link>
            <Link href="/collections/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</Link>
            <Link href="/collections/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</Link>
            <Link href="/collections/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Shop</span>
            </Link>
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-4">
              <Link href="/collections/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</Link>
              <Link href="/collections/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</Link>
              <Link href="/collections/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</Link>
              <Link href="/collections/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</Link>
              <Link href="/collections/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 modern ecommerce. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function MobileBottomNav() {
  const { getItemCount } = useCartStore()
  const cartCount = getItemCount()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="pb-safe pt-3 pb-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
              aria-label="Navigate to home"
            >
              <HomeIcon className="w-6 h-6" strokeWidth={2.5} />
            </Link>
            <Link
              href="/shop"
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
              aria-label="Navigate to shop"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
            </Link>
            <button
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 transition-colors active:scale-95"
              aria-label="Open search"
              onClick={() => window.location.href = '/search'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href="/cart"
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-pink-600 text-white relative transition-colors active:scale-95"
              aria-label="View cart"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-pink-600 text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundMethod, setRefundMethod] = useState('')

  const fetchOrder = async () => {
    if (!orderId) {
      setError('Order ID not found')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const result: OrderResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch order')
      }

      setOrder(result.data || null)
    } catch (err: any) {
      console.error('Error fetching order:', err)
      setError(err.message || 'Failed to fetch order details')
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchOrder()
  }, [orderId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleCancelOrder = async () => {
    if (!order) return

    setCancelLoading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: order.userId, // Will be checked by backend
          cancelledBy: 'user',
          reason: cancelReason || 'Customer requested cancellation',
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to cancel order')
      }

      toast.success('Order cancelled successfully')

      // Refresh order details
      await fetchOrder()

      setShowCancelDialog(false)
      setCancelReason('')
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      toast.error(err.message || 'Failed to cancel order')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleRefundRequest = async () => {
    if (!order) return

    // Validate inputs
    const amount = parseFloat(refundAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid refund amount')
      return
    }

    if (amount > order.total) {
      toast.error(`Refund amount cannot exceed order total of ৳${order.total.toFixed(2)}`)
      return
    }

    if (refundReason.length < 10) {
      toast.error('Refund reason must be at least 10 characters')
      return
    }

    if (!refundMethod) {
      toast.error('Please select a refund method')
      return
    }

    setRefundLoading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: order.userId,
          amount,
          reason: refundReason,
          refundMethod,
          initiatedBy: 'user',
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process refund request')
      }

      toast.success('Refund request submitted successfully')

      // Refresh order details
      await fetchOrder()

      setShowRefundDialog(false)
      setRefundAmount('')
      setRefundReason('')
      setRefundMethod('')
    } catch (err: any) {
      console.error('Error processing refund:', err)
      toast.error(err.message || 'Failed to process refund request')
    } finally {
      setRefundLoading(false)
    }
  }

  const canCancelOrder = order && ['PENDING', 'CONFIRMED'].includes(order.status)
  const canRequestRefund = order && order.status === 'DELIVERED' && !order.refundedAt

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Success Message */}
          <div className="max-w-4xl mx-auto">
            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Loading Order Details...</h1>
                <p className="text-gray-600">Please wait while we fetch your order information.</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <Check className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Order</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
                >
                  Continue Shopping
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </Link>
              </div>
            )}

            {/* Order Details */}
            {!loading && !error && order && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center mb-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-12 h-12 text-green-600" />
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Order Confirmed!
                  </h1>

                  <p className="text-gray-600 text-lg mb-6">
                    Thank you for your purchase. Your order has been received.
                  </p>

                  {/* Order Details Card */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Order Number</p>
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Order Date</p>
                        <p className="font-bold text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                        <p className="font-bold text-gray-900">{order.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <p className={`font-bold capitalize ${
                          order.status === 'CANCELLED' ? 'text-red-600' :
                          order.status === 'DELIVERED' ? 'text-green-600' :
                          order.status === 'SHIPPED' ? 'text-blue-600' :
                          'text-gray-900'
                        }`}>{order.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="bg-pink-50 rounded-xl p-6 mb-8 text-left">
                    <h3 className="font-bold text-gray-900 mb-3">Shipping Information</h3>
                    <p className="text-gray-700">
                      <span className="font-semibold">{order.customerName}</span><br />
                      {order.shippingAddress}
                    </p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Email: {order.customerEmail}</p>
                      {order.customerPhone && <p>Phone: {order.customerPhone}</p>}
                    </div>
                  </div>

                  {/* Tracking Information */}
                  {order.trackingNumber && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-3">Tracking Information</h3>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500">Tracking Number</p>
                              <p className="font-mono font-semibold text-lg">{order.trackingNumber}</p>
                            </div>
                            {order.estimatedDeliveryDate && (
                              <div>
                                <p className="text-xs text-gray-500">Estimated Delivery</p>
                                <p className="font-semibold">{formatDate(order.estimatedDeliveryDate)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/track-order?order=${order.orderNumber}`}
                          className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Track Order
                          <ArrowLeft className="w-5 h-5 rotate-180" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Cancellation Information */}
                  {order.status === 'CANCELLED' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-left">
                      <h3 className="font-bold text-red-900 mb-3">Order Cancelled</h3>
                      <div className="space-y-2">
                        {order.cancelledAt && (
                          <div>
                            <p className="text-xs text-gray-500">Cancelled On</p>
                            <p className="font-semibold">{formatDate(order.cancelledAt)}</p>
                          </div>
                        )}
                        {order.cancelledBy && (
                          <div>
                            <p className="text-xs text-gray-500">Cancelled By</p>
                            <p className="font-semibold capitalize">{order.cancelledBy}</p>
                          </div>
                        )}
                        {order.cancellationReason && (
                          <div>
                            <p className="text-xs text-gray-500">Reason</p>
                            <p className="font-semibold">{order.cancellationReason}</p>
                          </div>
                        )}
                        {order.refundedAmount > 0 && (
                          <div className="pt-2 border-t border-red-200">
                            <p className="text-sm text-green-700 font-semibold">
                              Refund of ৳{order.refundedAmount.toFixed(2)} has been processed
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center gap-2 bg-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
                    >
                      Continue Shopping
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                    {canCancelOrder && (
                      <Button
                        onClick={() => setShowCancelDialog(true)}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                    {canRequestRefund && (
                      <Button
                        onClick={() => setShowRefundDialog(true)}
                        variant="outline"
                        className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400"
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Request Refund
                      </Button>
                    )}
                    <button className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                      <Download className="w-5 h-5" />
                      Download Invoice
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                      <Share2 className="w-5 h-5" />
                      Share Order
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
                  <div className="space-y-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-20 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.productName}</h3>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          <p className="text-lg font-bold text-pink-600 mt-2">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">৳{order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-semibold">৳{order.shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-semibold">৳{order.tax.toFixed(2)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span className="font-semibold">-৳{order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-pink-600">৳{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h2>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Order Placed</p>
                        <p className="text-sm text-gray-500">Your order has been successfully placed.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.status !== 'PENDING' ? 'bg-green-600' : 'bg-gray-200'}`}>
                        {order.status !== 'PENDING' ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-600">2</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Processing</p>
                        <p className="text-sm text-gray-500">Your order is being processed and packed.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-green-600' : 'bg-gray-200'}`}>
                        {['SHIPPED', 'DELIVERED'].includes(order.status) ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-600">3</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Shipped</p>
                        <p className="text-sm text-gray-500">Your order has been shipped and is on its way.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'DELIVERED' ? 'bg-green-600' : 'bg-gray-200'}`}>
                        {order.status === 'DELIVERED' ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs text-gray-600">4</span>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Delivered</p>
                        <p className="text-sm text-gray-500">Your order has been delivered successfully.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Help Section - Always Visible */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about your order, our customer support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you want to cancel this order..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancelOrder()
              }}
              disabled={cancelLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Request Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Please provide details for your refund request. This will be reviewed by our team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="refund-amount">Refund Amount (৳)</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                placeholder={`Max: ৳${order?.total.toFixed(2) || '0.00'}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={refundLoading}
              />
              <p className="text-xs text-gray-500">
                Order total: ৳{order?.total.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="refund-method">Refund Method</Label>
              <select
                id="refund-method"
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                disabled={refundLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              >
                <option value="">Select refund method</option>
                <option value="original_payment">Original Payment Method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="store_credit">Store Credit</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="refund-reason">Reason for Refund</Label>
              <Textarea
                id="refund-reason"
                rows={4}
                placeholder="Please explain why you are requesting a refund (minimum 10 characters)..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                disabled={refundLoading}
              />
              <p className="text-xs text-gray-500">
                {refundReason.length}/10 characters minimum
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={refundLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefundRequest}
              disabled={refundLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {refundLoading ? 'Submitting...' : 'Submit Refund Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent animate-spin rounded-full" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
