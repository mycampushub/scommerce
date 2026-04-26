'use client'

import React, { useState } from 'react'
import { Search, Package, MapPin, Calendar, Clock, Truck, CheckCircle, AlertCircle, ExternalLink, Loader2, Home, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface TrackingTimeline {
  status: string
  description: string
  date: Date | null
  completed: boolean
}

interface TrackingData {
  order: {
    id: string
    orderNumber: string
    status: string
    trackingStatus: string | null
    trackingNumber: string | null
    estimatedDeliveryDate: Date | null
    createdAt: Date
    updatedAt: Date
  }
  customer: {
    name: string
    email: string
    phone: string | null
  }
  shipping: {
    address: string
    city: string | null
    district: string | null
    division: string | null
  }
  courier: {
    name: string
    trackingUrl: string
  } | null
  timeline: TrackingTimeline[]
  items: Array<{
    id: string
    productName: string
    productImage: string | null
    quantity: number
    price: number
  }>
}

// Components
function Navbar() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="Modern Ecommerce"
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
          </div>
        </div>
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
              <Home className="w-6 h-6" strokeWidth={2.5} />
            </Link>
            <Link
              href="/shop"
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
              aria-label="Navigate to shop"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function TrackOrderPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'orderId' | 'orderNumber'>('orderNumber')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an order number or email',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    setError(null)
    setTrackingData(null)

    try {
      // If searching by order ID directly
      if (searchType === 'orderId') {
        const response = await fetch(`/api/orders/${searchQuery.trim()}/track`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Order not found')
        }

        setTrackingData(result.data)
      } else {
        // Search by order number - need to find the order first
        const searchResponse = await fetch(`/api/orders?orderNumber=${searchQuery.trim()}`)
        const searchResult = await searchResponse.json()

        if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
          throw new Error('Order not found')
        }

        const order = searchResult.data[0]
        const trackingResponse = await fetch(`/api/orders/${order.id}/track`)
        const trackingResult = await trackingResponse.json()

        if (!trackingResult.success) {
          throw new Error(trackingResult.error || 'Failed to fetch tracking information')
        }

        setTrackingData(trackingResult.data)
      }
    } catch (err: any) {
      console.error('Error tracking order:', err)
      setError(err.message || 'Failed to track order')
      toast({
        title: 'Error',
        description: err.message || 'Failed to track order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'N/A'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Track Your Order
              </h1>
              <p className="text-gray-600">
                Enter your order number to track your shipment
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSearchType('orderNumber')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      searchType === 'orderNumber'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Order Number
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('orderId')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      searchType === 'orderId'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Order ID
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchType === 'orderNumber' ? 'Enter order number (e.g., ORD-123456)' : 'Enter order ID'}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Track Order
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 md:p-8 mb-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <p className="text-sm text-gray-500">
                  Please check your order number or contact customer support
                </p>
              </div>
            )}

            {/* Tracking Results */}
            {trackingData && !error && (
              <>
                {/* Order Status Card */}
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg p-6 md:p-8 text-white mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/80 mb-1">Order Number</p>
                      <h2 className="text-2xl md:text-3xl font-bold">{trackingData.order.orderNumber}</h2>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-white/80 mb-1">Status</p>
                      <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                        <Package className="h-4 w-4" />
                        {trackingData.order.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {trackingData.order.trackingNumber && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-white/80 mb-1">Tracking Number</p>
                          <p className="font-mono font-semibold">{trackingData.order.trackingNumber}</p>
                        </div>
                        {trackingData.courier && (
                          <div className="flex-1">
                            <p className="text-sm text-white/80 mb-1">Courier</p>
                            <p className="font-semibold">{trackingData.courier.name}</p>
                          </div>
                        )}
                        {trackingData.order.estimatedDeliveryDate && (
                          <div className="flex-1">
                            <p className="text-sm text-white/80 mb-1">Estimated Delivery</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(trackingData.order.estimatedDeliveryDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Details */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Shipping Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{trackingData.customer.name}</p>
                        <p className="text-sm text-gray-600">{trackingData.customer.email}</p>
                        {trackingData.customer.phone && (
                          <p className="text-sm text-gray-600">{trackingData.customer.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                        <p className="font-medium text-gray-900">{trackingData.shipping.address}</p>
                        {(trackingData.shipping.city || trackingData.shipping.district || trackingData.shipping.division) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {[trackingData.shipping.city, trackingData.shipping.district, trackingData.shipping.division].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Timeline */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h3>
                  <div className="space-y-6">
                    {trackingData.timeline.map((step, index) => (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            step.completed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {step.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          {index < trackingData.timeline.length - 1 && (
                            <div className={`w-0.5 h-12 my-2 ${
                              step.completed ? 'bg-green-600' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step.status}
                          </p>
                          <p className={`text-sm ${step.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                            {step.description}
                          </p>
                          {step.date && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(step.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Order Items</h3>
                  <div className="space-y-4">
                    {trackingData.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-16 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-pink-600">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Courier Link */}
                {trackingData.courier && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
                    <Truck className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Track with Courier</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Track your package directly on {trackingData.courier.name}'s website
                    </p>
                    <a
                      href={trackingData.courier.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {trackingData.courier.name} Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
