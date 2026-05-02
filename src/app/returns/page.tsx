'use client'

import React from 'react'
import { ShoppingBag, Home as HomeIcon, RotateCcw, Package, Clock, Shield } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'




export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Returns & Exchanges</h1>
          <p className="text-gray-600">Hassle-free returns within 30 days</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Returns & Exchanges</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">30 Days</h3>
                <p className="text-gray-600 text-sm">Easy return window</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Free Returns</h3>
                <p className="text-gray-600 text-sm">On eligible orders</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Full Refund</h3>
                <p className="text-gray-600 text-sm">Money back guarantee</p>
              </div>
            </div>

            {/* Detailed Policy */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Return Policy</h2>
                <p className="text-gray-600 mb-4">
                  We want you to be completely satisfied with your purchase. If you're not happy with your order, 
                  you can return it within 30 days of delivery for a full refund or exchange.
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Items must be unworn, unwashed, and in original condition</li>
                  <li>Original tags and packaging must be intact</li>
                  <li>Return request must be initiated within 30 days of delivery</li>
                  <li>Proof of purchase required</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Non-Returnable Items</h2>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Custom stitched items</li>
                  <li>Personalized or monogrammed products</li>
                  <li>Items marked as "Final Sale"</li>
                  <li>Intimate apparel and undergarments</li>
                  <li>Items worn or damaged after delivery</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Initiate a Return</h2>
                <ol className="list-decimal pl-6 text-gray-600 space-y-3">
                  <li>Log in to your account and go to "My Orders"</li>
                  <li>Select the order and item you want to return</li>
                  <li>Choose your return reason and submit the request</li>
                  <li>Receive a return confirmation email with shipping label</li>
                  <li>Pack the item securely and attach the label</li>
                  <li>Drop off at the designated shipping carrier</li>
                </ol>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Process</h2>
                <p className="text-gray-600 mb-4">
                  Once we receive your return and inspect the item, we will process your refund within 5-7 business days. 
                  The refund will be credited to the original payment method.
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Credit card refunds: 5-7 business days to appear on statement</li>
                  <li>PayPal refunds: 3-5 business days</li>
                  <li>Store credit: Immediate</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Exchanges</h2>
                <p className="text-gray-600 mb-4">
                  If you'd like to exchange for a different size or color, please initiate a return for the original 
                  item and place a new order for the desired item. This ensures you get the item before it goes out of stock.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Damaged or Incorrect Items</h2>
                <p className="text-gray-600 mb-4">
                  If you receive a damaged or incorrect item, please contact us within 48 hours of delivery. 
                  We will arrange for a free replacement or full refund, including return shipping costs.
                </p>
              </div>

              <div className="bg-pink-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about returns or exchanges, our customer service team is here to help.
                </p>
                <a
                  href="mailto:returns@modern ecommerce.com"
                  className="text-pink-600 hover:underline font-medium"
                >
                  returns@modern ecommerce.com
                </a>
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
