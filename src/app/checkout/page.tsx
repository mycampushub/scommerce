'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, ArrowRight, Check, Trash2, Home as HomeIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format-currency'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'

interface OrderResponse {
  success: boolean
  data?: {
    id: string
    orderNumber: string
  }
  error?: string
  message?: string
}

// Components

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stockIssues, setStockIssues] = useState<{[key: string]: { inStock: boolean, availableStock: number }}>({})
  const [shippingCost, setShippingCost] = useState(150)
  const [calculatingShipping, setCalculatingShipping] = useState(false)

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

  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    nameOnCard: ''
  })

  const total = getTotal()

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
      const result = await response.json()
      if (result.success) {
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
      const itemKeys: {[key: string]: string} = {}
      
      for (const item of items) {
        const itemKey = `${item.id}-${item.variantId || 'no-variant'}`
        const response = await fetch(`/api/products/${item.id}`)
        const data = await response.json()
        
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
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'division', 'district', 'city']
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
    
    // Validate phone (Bangladesh format: 01XXXXXXXXX)
    const phoneRegex = /^01[3-9]\d{8}$/
    if (!phoneRegex.test(shippingInfo.phone)) {
      toast.error('Please enter a valid Bangladesh phone number (01XXXXXXXXX)')
      return
    }
    
    setStep(2)
    toast.success('Shipping information saved')
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate card details if card payment selected
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.cvv || !cardDetails.expiryMonth || !cardDetails.expiryYear) {
        toast.error('Please fill in all card details')
        return
      }
      
      // Basic card number validation (16 digits)
      const cardNumberDigits = cardDetails.cardNumber.replace(/\D/g, '')
      if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
        toast.error('Please enter a valid card number')
        return
      }
      
      // CVV validation
      if (cardDetails.cvv.length < 3) {
        toast.error('Please enter a valid CVV')
        return
      }
    }
    
    await handlePlaceOrder()
  }

  const handlePlaceOrder = async () => {
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
      const tax = subtotal * 0.18 // 18% tax rate
      const discount = 0 // Can be extended to include promo codes
      const total = subtotal + shipping + tax - discount
      
      // Format shipping address for Bangladesh
      const fullAddress = `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.district}, ${shippingInfo.division}, ${shippingInfo.zipCode}, ${shippingInfo.country}`
      
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
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        shippingAddress: fullAddress,
        billingAddress: fullAddress, // Same as shipping for now
        paymentMethod: paymentMethod.toUpperCase(),
        orderItems,
        subtotal,
        shipping,
        tax,
        discount,
        total
      }
      
      // Call the orders API
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
      toast.error(error.message || 'Failed to place order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-300" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
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
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="hidden md:inline">Shipping</span>
            </div>
            <div className={`h-0.5 w-8 md:w-16 ${step >= 2 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="hidden md:inline">Payment</span>
            </div>
            <div className={`h-0.5 w-8 md:w-16 ${step >= 3 ? 'bg-pink-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-pink-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="hidden md:inline">Complete</span>
            </div>
          </div>
        </div>
      </section>

      {/* Check stock on mount */}
      <section className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Side - Forms */}
            <div className="flex-1">
              {/* Step 1: Shipping */}
              {step === 1 && (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                  <form onSubmit={handleShippingSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="123 Main Street, Apt 4B"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                    <button
                      type="submit"
                      className="w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Continue to Payment
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

                  {/* Payment Options */}
                  <div className="space-y-4 mb-6">
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-pink-600 bg-pink-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="w-5 h-5 text-pink-600"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Credit/Debit Card</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-pink-600 bg-pink-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="w-5 h-5 text-pink-600"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Cash on Delivery</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-pink-600 bg-pink-50' : 'border-gray-200'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="w-5 h-5 text-pink-600"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">UPI Payment</span>
                      </div>
                    </label>
                  </div>

                  {/* Card Details */}
                  {paymentMethod === 'card' && (
                    <form onSubmit={handlePaymentSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={cardDetails.cardNumber}
                            onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            maxLength={19}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name on Card <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={cardDetails.nameOnCard}
                            onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })}
                            placeholder="JOHN DOE"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                            <select
                              value={cardDetails.expiryMonth}
                              onChange={(e) => setCardDetails({ ...cardDetails, expiryMonth: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                              <option value="">MM</option>
                              {[...Array(12)].map((_, i) => (
                                <option key={i} value={String(i + 1).padStart(2, '0')}>
                                  {String(i + 1).padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                            <select
                              value={cardDetails.expiryYear}
                              onChange={(e) => setCardDetails({ ...cardDetails, expiryYear: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            >
                              <option value="">YY</option>
                              {[...Array(10)].map((_, i) => (
                                <option key={i} value={String(new Date().getFullYear() + i)}>
                                  {new Date().getFullYear() + i}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                              placeholder="123"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="flex-1 bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : 'Place Order'}
                          {!isProcessing && <ArrowRight className="w-5 h-5" />}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* COD/UPI Direct Submit */}
                  {(paymentMethod === 'cod' || paymentMethod === 'upi') && (
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing || Object.values(stockIssues).some(issue => !issue.inStock)}
                        className="flex-1 bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : 'Place Order'}
                        {!isProcessing && <ArrowRight className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Cart Items with Stock Status */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => {
                    const itemKey = `${item.id}-${item.variantId || 'no-variant'}`
                    const stockInfo = stockIssues[itemKey]
                    const isOutOfStock = stockInfo?.inStock === false
                    const stockCount = stockInfo?.availableStock || 0
                    
                    return (
                      <div key={itemKey} className={`flex gap-3 ${isOutOfStock ? 'opacity-60' : ''}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</h3>
                          {item.variantId && (
                            <p className="text-xs text-gray-500">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && ' | '}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                            {stockInfo && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
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
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-700 font-medium">
                      Some items in your cart are out of stock. Please remove them or reduce quantities before placing your order.
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {calculatingShipping ? (
                        <span className="text-gray-400">Calculating...</span>
                      ) : shippingCost === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatCurrency(shippingCost)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span className="font-semibold">{formatCurrency(total * 0.18)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-pink-600">{formatCurrency(total + (total * 0.18) + shippingCost)}</span>
                  </div>
                </div>

                {/* Free Shipping Progress */}
                {shippingCost > 0 && total < 5000 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        Free shipping progress
                      </span>
                      <span className="text-sm text-blue-600">
                        {formatCurrency(total)} / ৳5,000
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((total / 5000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Add {formatCurrency(5000 - total)} more for free shipping!
                    </p>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>SSL encrypted payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
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
    </div>
  )
}
