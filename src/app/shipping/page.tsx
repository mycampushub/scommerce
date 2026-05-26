import React from 'react'
import { Truck, Clock, Globe } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'







export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Shipping Policy</h1>
          <p className="text-gray-600">Everything you need to know about shipping</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Shipping Policy</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Shipping Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Worldwide Shipping</h3>
                <p className="text-gray-600 text-sm">We ship to over 50 countries worldwide</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Free Shipping</h3>
                <p className="text-gray-600 text-sm">On orders over $100</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
                <p className="text-gray-600 text-sm">Express shipping available</p>
              </div>
            </div>

            {/* Detailed Policy */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Time</h2>
                <p className="text-gray-600 mb-4">
                  Orders are processed within 1-3 business days. Custom stitched orders may take 5-7 business days.
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Ready-to-ship items: 1-2 business days</li>
                  <li>Standard items: 2-3 business days</li>
                  <li>Custom stitched items: 5-7 business days</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Domestic Shipping (India)</h2>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Standard: 5-7 business days (₹99)</li>
                  <li>Express: 2-3 business days (₹199)</li>
                  <li>Free on orders over ₹999</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">International Shipping</h2>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>Standard: 10-15 business days ($15-$25)</li>
                  <li>Express: 5-7 business days ($35-$50)</li>
                  <li>Free on orders over $100</li>
                </ul>
                <p className="text-gray-600 mt-4">
                  International orders may be subject to customs duties and taxes. These charges are the responsibility 
                  of the recipient and vary by country.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tracking Your Order</h2>
                <p className="text-gray-600 mb-4">
                  Once your order ships, you will receive a confirmation email with tracking information. 
                  You can track your package through the carrier's website.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Restrictions</h2>
                <p className="text-gray-600 mb-4">
                  We do not ship to PO Boxes or APO/FPO addresses. Please provide a physical address for delivery.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Lost or Damaged Packages</h2>
                <p className="text-gray-600 mb-4">
                  If your package is lost or arrives damaged, please contact us within 48 hours of delivery. 
                  We will work with the shipping carrier to resolve the issue and arrange a replacement or refund.
                </p>
              </div>

              <div className="bg-pink-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Have Questions?</h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about shipping, please don't hesitate to reach out to our customer service team.
                </p>
                <a
                  href="mailto:shipping@modernecommerce.com"
                  className="text-pink-600 hover:underline font-medium"
                >
                  shipping@modernecommerce.com
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
