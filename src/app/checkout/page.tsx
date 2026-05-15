'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, ArrowRight, Check, Trash2, Home as HomeIcon, Lock, CreditCard, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format-currency'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PriceDisplay } from '@/components/price-display'

interface OrderResponse {
  success: boolean
  data?: {
    id: string
    orderNumber: string
  }
  error?: string
  message?: string
}

interface SettingsResponse {
  success: boolean
  data?: {
    taxRate?: number
    freeShippingThreshold?: number
  }
  error?: string
}

interface ShippingResponse {
  success: boolean
  data?: {
    shippingCost: number
  }
  error?: string
}

interface ProductResponse {
  success: boolean
  data?: {
    id: string
    name: string
    stock?: number
    variants?: Array<{
      id: string
      stock?: number
    }>
  }
  error?: string
}

interface AuthResponse {
  success: boolean
  data?: {
    user?: {
      id: string
      email: string
      name: string
    }
  }
  error?: string
}

// Components

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, getSubtotal, clearCart } = useCartStore()
  const { user, loading } = useAuth()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stockIssues, setStockIssues] = useState<{[key: string]: { inStock: boolean, availableStock: number }}>({})
  const [shippingCost, setShippingCost] = useState(150)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login')
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null)

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    division: '',
    district: '',
    city: '',
    zipCode: '',
    country: 'Bangladesh'
  })

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [taxRate, setTaxRate] = useState(0.18) // Default fallback
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000) // Default fallback

  const subtotal = getSubtotal()
  const tax = subtotal * taxRate
  const total = getTotal()


  // Fetch site settings for tax rate and shipping threshold
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result: SettingsResponse = await response.json()
        if (result.success && result.data) {
          setTaxRate(result.data.taxRate || 0.18)
          setFreeShippingThreshold(result.data.freeShippingThreshold || 5000)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        // Keep default values on error
      }
    }

    fetchSettings()
  }, [])

  // Calculate shipping based on division
  const calculateShippingCost = async (division: string) => {
    if (!division) return
    setCalculatingShipping(true)
    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtotal: total,
          division,
          weight: 1, // Default weight 1kg
        }),
      })
      const result: ShippingResponse = await response.json()
      if (result.success && result.data) {
        setShippingCost(result.data.shippingCost)
      }
    } catch (error) {
      console.error('Error calculating shipping:', error)
      setShippingCost(150) // Fallback to default
    } finally {
      setCalculatingShipping(false)
    }
  }

  // Calculate shipping when division changes
  useEffect(() => {
    if (shippingInfo.division) {
      calculateShippingCost(shippingInfo.division)
    }
  }, [shippingInfo.division, total])

  // Check stock status for all cart items
  const checkStockStatus = async () => {
    try {
      const itemKeys: {[key: string]: {
        inStock: boolean;
        availableStock: number;
      }} = {}
      
      for (const item of items) {
        const itemKey = `${item.id}-${item.variantId || 'no-variant'}`
        const response = await fetch(`/api/products/${item.id}`)
        const data: ProductResponse = await response.json()
        
        if (data.success && data.data) {
          const product = data.data
          let stock = 0
          
          if (item.variantId) {
            // Check variant stock
            const variant = product.variants?.find(v => v.id === item.variantId)
            stock = variant?.stock || 0
          } else {
            // Check product stock
            stock = product.stock || 0
          }
          
          itemKeys[itemKey] = {
            inStock: stock >= item.quantity,
            availableStock: stock
          }
        }
      }
      
      setStockIssues(itemKeys)
      
      // Check if any items are out of stock
      const hasOutOfStock = Object.values(itemKeys).some(item => !item.inStock)
      if (hasOutOfStock) {
        toast.error('Some items in your cart are out of stock')
      }
      
      return !hasOutOfStock
    } catch (error) {
      console.error('Error checking stock:', error)
      return true // Allow checkout if stock check fails
    }
  }

  // Check stock status on mount
  useEffect(() => {
    if (items.length > 0) {
      checkStockStatus()
    }
  }, [items])

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check stock status before proceeding
    const stockOk = await checkStockStatus()
    if (!stockOk) {
      return
    }

    // Validate all required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'division', 'district', 'city', 'zipCode']
    const missingFields = requiredFields.filter(field => !shippingInfo[field as keyof typeof shippingInfo])

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone (10-14 digits, allowing common formats)
    const phoneRegex = /^\d{10,14}$/
    if (!phoneRegex.test(shippingInfo.phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid phone number (10-14 digits)')
      return
    }

    // Proceed to confirm order
    handleConfirmOrder()
  }

  const handleConfirmOrder = async () => {
    // Check if user is logged in (either from useAuth or from login/signup dialog)
    const currentUser = user || authenticatedUser
    if (!currentUser) {
      setShowLoginDialog(true)
      return
    }

    // User is logged in, proceed with order placement
    await handlePlaceOrder()
  }

  const handlePlaceOrder = async () => {
    // Use authenticatedUser if available, otherwise use user from useAuth
    const currentUser = authenticatedUser || user
    // Double-check stock before placing order
    const stockOk = await checkStockStatus()
    if (!stockOk) {
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Calculate order totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const shipping = shippingCost
      const tax = subtotal * taxRate // Dynamic tax rate from settings
      const discount = 0 // Can be extended to include promo codes
      const total = subtotal + shipping + tax - discount

      // Format shipping address as object for API
      const addressObject = {
        address: shippingInfo.address,
        city: shippingInfo.city,
        district: shippingInfo.district,
        division: shippingInfo.division,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country
      }

      // Format order items to match API expectations
      const orderItems = items.map(item => ({
        productId: item.id,
        productName: item.name,
        productImage: item.image,
        price: item.price,
        quantity: item.quantity,
        // Include variant information if available
        ...(item.variantId && {
          variantId: item.variantId,
          variantSku: item.variantSku,
          variantSize: item.size,
          variantColor: item.color,
          variantMaterial: item.material,
        }),
      }))
      
      // Prepare order data
      const orderData = {
        userId: currentUser?.id, // Include userId if user is logged in
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        shippingAddress: addressObject,
        billingAddress: addressObject, // Same as shipping for now
        paymentMethod: paymentMethod === 'cod' ? 'CASH_ON_DELIVERY' : 'ONLINE_PAYMENT',
        orderItems,
        subtotal,
        shipping,
        tax,
        discount,
        total
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })
      
      const result: OrderResponse = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create order')
      }
      
      // Order created successfully
      toast.success(result.message || 'Order placed successfully!')
      
      // Clear the cart
      clearCart()
      
      // Navigate to order confirmation page with order ID
      router.push(`/order-confirmation?id=${result.data?.id}`)
      
    } catch (error: any) {
      console.error('Error placing order:', error)

      // Check if it's a network error (likely offline)
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch')

      // Show appropriate error message
      if (isNetworkError) {
        toast.error('Order failed. You need internet connection to place the order')
      } else {
        toast.error(error.message || 'Order failed. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <ShoppingBag className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 text-gray-300" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-sm md:text-base text-gray-600 mb-6">Add some items to your cart before checkout</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors text-base min-h-[52px]"
          >
            Start Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-6 md:py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <div className="flex items-center gap-2 mt-3 md:mt-4 text-xs md:text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-pink-600">Cart</Link>
            <span>/</span>
            <span className="text-gray-900">Checkout</span>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-center gap-2 md:gap-4 lg:gap-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${step >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="hidden lg:inline">Checkout</span>
            </div>
            <div className={`h-0.5 w-4 md:w-8 lg:w-16 ${step >= 2 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${step >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="hidden lg:inline">Complete</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-6 md:py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Side - Forms */}
            <div className="flex-1">
              {/* Single Step: Shipping + Payment */}
              <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-sm">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Checkout Information</h2>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    handleShippingSubmit(e)
                  }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.firstName}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.lastName}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base resize-y"
                        placeholder="123 Main Street, Apt 4B"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Division <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={shippingInfo.division}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, division: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Division</option>
                          <option value="Dhaka">Dhaka</option>
                          <option value="Chittagong">Chittagong</option>
                          <option value="Khulna">Khulna</option>
                          <option value="Rajshahi">Rajshahi</option>
                          <option value="Barisal">Barisal</option>
                          <option value="Sylhet">Sylhet</option>
                          <option value="Rangpur">Rangpur</option>
                          <option value="Mymensingh">Mymensingh</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.district}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, district: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="e.g., Dhaka"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="e.g., Gulshan"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP/Postal Code <span className="text-red-500">*</span>
                      </label>
                        <input
                          type="text"
                          value={shippingInfo.zipCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="400001"
                          required
                        />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                            paymentMethod === 'cod'
                              ? 'border-pink-600 bg-pink-50'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <Wallet className="w-6 h-6 text-gray-700" />
                          <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('online')}
                          className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                            paymentMethod === 'online'
                              ? 'border-pink-600 bg-pink-50'
                              : 'border-gray-200 hover:border-pink-300'
                          }`}
                        >
                          <CreditCard className="w-6 h-6 text-gray-700" />
                          <span className="text-sm font-medium text-gray-900">Online Payment</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full min-h-[56px] bg-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        'Processing...'
                      ) : (
                        <>
                          Confirm Order
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
            </div>

            {/* Right Side - Order Summary */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm lg:sticky lg:top-24">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Order Summary</h2>

                {/* Cart Items with Stock Status */}
                <div className="space-y-3 md:space-y-4 mb-6 max-h-60 md:max-h-64 overflow-y-auto -mx-2 px-2">
                  {items.map((item) => {
                    const itemKey = `${item.id}-${item.variantId || 'no-variant'}`
                    const stockInfo = stockIssues[itemKey]
                    const isOutOfStock = stockInfo?.inStock === false
                    const stockCount = stockInfo?.availableStock || 0

                    return (
                      <div key={itemKey} className={`flex gap-3 p-2 rounded-lg ${isOutOfStock ? 'opacity-60' : ''}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-16 md:w-16 md:h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</h3>
                          {item.variantId && (
                            <p className="text-xs text-gray-500 truncate">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <PriceDisplay value={item.price * item.quantity} showDecimals={false} className="text-sm font-semibold text-gray-900" />
                            {stockInfo && (
                              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700'
                                  : stockCount < 5
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                              }`}>
                                {isOutOfStock
                                  ? 'Out of Stock'
                                  : stockCount < 5
                                    ? `Only ${stockCount} left`
                                    : 'In Stock'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Stock Warning */}
                {Object.values(stockIssues).some(issue => !issue.inStock) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4">
                    <p className="text-xs md:text-sm text-red-700 font-medium">
                      Some items in your cart are out of stock. Please remove them or reduce quantities before placing your order.
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <PriceDisplay value={subtotal} showDecimals={false} />
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {calculatingShipping ? (
                        <span className="text-gray-400">Calculating...</span>
                      ) : shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        <PriceDisplay value={shippingCost} showDecimals={false} />
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Tax ({((taxRate || 0) * 100).toFixed(0)}%)</span>
                    <span className="font-semibold"><PriceDisplay value={tax} showDecimals={false} /></span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-base md:text-lg font-bold text-gray-900">Total</span>
                    <PriceDisplay value={subtotal + shippingCost + tax} showDecimals={false} className="text-base md:text-lg font-bold text-pink-600" />
                  </div>
                </div>

                {/* Free Shipping Progress */}
                {shippingCost > 0 && total < freeShippingThreshold && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium text-blue-800">
                        Free shipping progress
                      </span>
                      <span className="text-xs md:text-sm text-blue-600">
                        <PriceDisplay value={total} showDecimals={false} /> / <PriceDisplay value={freeShippingThreshold} showDecimals={false} />
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((total / freeShippingThreshold) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Add <PriceDisplay value={freeShippingThreshold - total} showDecimals={false} /> more for free shipping!
                    </p>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="mt-6 space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>SSL encrypted payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>30-day easy returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />

      {/* Login/Signup Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="complete-order-description">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription id="complete-order-description">
              Please log in or sign up to complete your order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Lock className="w-12 h-12 text-pink-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Please log in or sign up to complete your order</p>
            </div>
            <Tabs defaultValue="login" onValueChange={(v) => setLoginTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const email = formData.get('email') as string
                    const password = formData.get('password') as string

                    if (!email || !password) {
                      toast.error('Please fill in all fields')
                      return
                    }

                    try {
                      const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                      })

                      const result: AuthResponse = await response.json()

                      if (result.success && result.data?.user) {
                        // Store the authenticated user data
                        setAuthenticatedUser(result.data.user)
                        toast.success('Logged in successfully!')
                        setShowLoginDialog(false)
                        // After successful login, place the order
                        await handlePlaceOrder()
                      } else {
                        toast.error(result.error || 'Invalid email or password')
                      }
                    } catch (error) {
                      console.error('Login error:', error)
                      toast.error('Failed to login. Please try again.')
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="•••••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Login & Order
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginTab('signup')}
                      className="text-pink-600 hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const firstName = formData.get('firstName') as string
                    const lastName = formData.get('lastName') as string
                    const email = formData.get('email') as string
                    const phone = formData.get('phone') as string
                    const password = formData.get('password') as string
                    const confirmPassword = formData.get('confirmPassword') as string

                    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
                      toast.error('Please fill in all fields')
                      return
                    }

                    if (password !== confirmPassword) {
                      toast.error('Passwords do not match')
                      return
                    }

                    if (password.length < 8) {
                      toast.error('Password must be at least 8 characters')
                      return
                    }

                    // Use shipping info from checkout form for address fields
                    // Combine firstName and lastName into name for API compatibility
                    const registerData = {
                      name: `${firstName} ${lastName}`,
                      firstName,
                      lastName,
                      email,
                      phone,
                      password,
                      confirmPassword,
                      guestCart: items.map(item => ({
                        id: item.id,
                        variantId: item.variantId,
                        quantity: item.quantity
                      })),
                      address: shippingInfo.address,
                      division: shippingInfo.division,
                      district: shippingInfo.district,
                      city: shippingInfo.city,
                      zipCode: shippingInfo.zipCode,
                      country: shippingInfo.country
                    }

                    try {
                      const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(registerData),
                      })

                      const result: AuthResponse = await response.json()

                      if (result.success && result.data?.user) {
                        // Store the authenticated user data
                        setAuthenticatedUser(result.data.user)
                        toast.success('Account created successfully!')
                        setShowLoginDialog(false)
                        // After successful signup, place the order
                        await handlePlaceOrder()
                      } else {
                        toast.error(result.error || 'Failed to create account')
                      }
                    } catch (error) {
                      console.error('Register error:', error)
                      toast.error('Failed to create account. Please try again.')
                    }
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="•••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      minLength={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="•••••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Account & Order
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginTab('login')}
                      className="text-pink-600 hover:underline font-medium"
                    >
                      Log in
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
