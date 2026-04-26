'use client'

import React from 'react'
import { ShoppingBag, Home as HomeIcon, Truck, Clock, Globe } from 'lucide-react'
import Link from 'next/link'

// Navbar Component
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

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
            <Link href="/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</Link>
            <Link href="/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</Link>
            <Link href="/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</Link>
            <Link href="/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</Link>
            <Link href="/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
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
              <Link href="/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</Link>
              <Link href="/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</Link>
              <Link href="/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</Link>
              <Link href="/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</Link>
              <Link href="/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Shop</h3>
            <ul className="space-y-2">
              <li><Link href="/saree" className="text-gray-300 hover:text-white transition-colors">Sarees</Link></li>
              <li><Link href="/salwar" className="text-gray-300 hover:text-white transition-colors">Salwar Suits</Link></li>
              <li><Link href="/lehengas" className="text-gray-300 hover:text-white transition-colors">Lehengas</Link></li>
              <li><Link href="/gowns" className="text-gray-300 hover:text-white transition-colors">Gowns</Link></li>
              <li><Link href="/kurtas" className="text-gray-300 hover:text-white transition-colors">Kurtas</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Wedding</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Festive</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-gray-300 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-300 hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Connect With Us</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 modern ecommerce. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Mobile Bottom Navigation
function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="pb-safe pt-3 pb-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
            <a 
              href="/"
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
              aria-label="Navigate to home"
            >
              <HomeIcon className="w-6 h-6" strokeWidth={2.5} />
            </a>
            <a 
              href="/shop" 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-pink-600 text-white transition-colors active:scale-95"
              aria-label="Navigate to shop"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
            </a>
            <button 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 transition-colors active:scale-95"
              aria-label="Open search"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-700 relative transition-colors active:scale-95"
              aria-label="View cart"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={2} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
                  href="mailto:shipping@modern ecommerce.com"
                  className="text-pink-600 hover:underline font-medium"
                >
                  shipping@modern ecommerce.com
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
