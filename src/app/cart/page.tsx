'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { formatCurrency } from '@/lib/format-currency'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { useToast } from '@/hooks/use-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getTotal } = useCartStore()
  const [promoCode, setPromoCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number; code: string } | null>(null)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const { toast } = useToast()
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(5000)
  const [baseShippingCost, setBaseShippingCost] = useState(150)

  // Fetch site settings for shipping thresholds
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const result = await response.json() as any
        if (result.success && result.data) {
          setFreeShippingThreshold(result.data.freeShippingThreshold || 5000)
          setBaseShippingCost(result.data.baseShippingCost || 150)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        // Keep default values on error
      }
    }

    fetchSettings()
  }, [])

  const subtotal = getSubtotal()
  const discount = appliedDiscount ? appliedDiscount.amount : items.reduce((sum, item) =>
    sum + ((item.originalPrice || item.price) - item.price) * item.quantity, 0
  )
  const shipping = subtotal > freeShippingThreshold ? 0 : baseShippingCost
  const total = getTotal()

  // Apply promo button handler
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a promo code',
        variant: 'destructive',
      })
      return
    }

    setIsApplyingPromo(true)

    try {
      const response = await fetch('/api/cart/apply-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: promoCode.trim() }),
      })

      const data = await response.json() as any

      if (data.success) {
        setAppliedDiscount({
          code: data.data.promoCode,
          amount: data.data.discountAmount,
        })
        toast({
          title: 'Success',
          description: `Promo code applied: ${data.data.discountAmount}${data.data.discountType === 'percentage' ? '%' : ' off'}`,
        })
      } else {
        setAppliedDiscount(null)
        toast({
          title: 'Error',
          description: data.error || 'Invalid promo code',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setAppliedDiscount(null)
      toast({
        title: 'Error',
        description: 'Failed to apply promo code',
        variant: 'destructive',
      })
    } finally {
      setIsApplyingPromo(false)
    }
  }

  // Clear promo code handler
  const handleClearPromo = () => {
    setPromoCode('')
    setAppliedDiscount(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">Review your items before checkout</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Cart</span>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1 space-y-4">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                    {/* Desktop Layout: Horizontal */}
                    <div className="hidden md:flex gap-4 md:gap-6">
                      <div className="w-24 md:w-28 flex-shrink-0">
                        <Link href={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full aspect-[3/4] object-cover rounded-lg"
                          />
                        </Link>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <Link href={`/product/${item.id}`}>
                              <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-2 hover:text-pink-600 transition-colors">
                                {item.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-500 mb-2">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.size && item.color && ' | '}
                              {item.color && <span>Color: {item.color}</span>}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-bold text-gray-900">{formatCurrency(item.price)}</span>
                              {item.originalPrice && (
                                <span className="text-sm text-gray-400 line-through">{formatCurrency(item.originalPrice)}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id, item.variantId)}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                            className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                            className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Layout: Vertical with better spacing */}
                    <div className="flex md:hidden gap-3">
                      <div className="w-20 flex-shrink-0">
                        <Link href={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full aspect-[3/4] object-cover rounded-lg"
                          />
                        </Link>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
                          <Link href={`/product/${item.id}`} className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 hover:text-pink-600 transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          <button
                            onClick={() => removeItem(item.id, item.variantId)}
                            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                          {item.size && <span>Size: {item.size}</span>}
                          {item.size && item.color && ' | '}
                          {item.color && <span>Color: {item.color}</span>}
                        </p>
                        <div className="flex items-center justify-between mt-auto gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 flex-shrink-0"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-semibold text-base">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                              className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price)}</span>
                            {item.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">{formatCurrency(item.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:w-96 flex-shrink-0">
                <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    {(discount > 0 || appliedDiscount) && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span className="font-semibold">
                          -{formatCurrency(appliedDiscount ? appliedDiscount.amount : discount)}
                          {appliedDiscount && ` (${appliedDiscount.code})`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">
                        {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-pink-600">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        disabled={!!appliedDiscount}
                        className="flex-1 min-w-0 px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      {!appliedDiscount ? (
                        <button
                          onClick={handleApplyPromo}
                          disabled={isApplyingPromo}
                          className="px-6 py-3 min-h-[48px] bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50"
                        >
                          {isApplyingPromo ? 'Applying...' : 'Apply'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg">
                          <span className="font-semibold whitespace-nowrap">{appliedDiscount.code}</span>
                          <button
                            onClick={handleClearPromo}
                            className="text-green-600 hover:text-green-800 font-medium"
                            title="Remove promo code"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-pink-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">Free Shipping on Orders Over {formatCurrency(freeShippingThreshold)}</p>
                        <p className="text-sm text-gray-600">
                          {subtotal >= freeShippingThreshold
                            ? "You've qualified for free shipping!"
                            : `Add ${formatCurrency(freeShippingThreshold - subtotal)} more to qualify`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Link
                    href="/checkout"
                    className="w-full min-h-[52px] bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 mb-4"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/shop"
                    className="w-full min-h-[52px] py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
