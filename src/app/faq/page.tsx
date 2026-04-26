'use client'

import React, { useState } from 'react'
import { ShoppingBag, Home as HomeIcon, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

// FAQ Data
const faqs = [
  {
    category: 'Ordering',
    questions: [
      {
        q: 'How do I place an order?',
        a: 'Simply browse our products, select your desired size and color, and click "Add to Cart". Review your cart and proceed to checkout. You can checkout as a guest or create an account for faster future purchases.'
      },
      {
        q: 'Can I modify or cancel my order after placing it?',
        a: 'Orders can be modified or cancelled within 24 hours of placing them, provided they haven\'t been shipped. Please contact our customer service team as soon as possible if you need to make changes.'
      },
      {
        q: 'Do you offer gift wrapping?',
        a: 'Yes! We offer complimentary gift wrapping on orders above $50. You can select this option during checkout.'
      },
      {
        q: 'Can I order items for bulk purchases?',
        a: 'Absolutely! For bulk or corporate orders, please contact us at sales@modern ecommerce.com for special pricing and dedicated support.'
      }
    ]
  },
  {
    category: 'Payment',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and bank transfers.'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes, we use industry-standard SSL encryption and secure payment gateways to protect your payment information. We never store your complete credit card details on our servers.'
      },
      {
        q: 'Do you offer EMI options?',
        a: 'Yes, we offer EMI options on select credit cards and through our financing partners. EMI options are available at checkout for eligible orders.'
      },
      {
        q: 'Will I be charged any additional fees?',
        a: 'No, we do not charge any additional fees. The price you see at checkout is the final amount you pay, unless there are customs duties for international orders.'
      }
    ]
  },
  {
    category: 'Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'Domestic orders typically arrive within 5-7 business days. International shipping takes 10-15 business days. Express shipping options are available for faster delivery.'
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes, we offer free shipping on orders over $100. For orders below $100, standard shipping rates apply based on your location.'
      },
      {
        q: 'Can I track my order?',
        a: 'Absolutely! Once your order ships, you will receive a tracking number via email. You can track your package through the carrier\'s website or your account dashboard.'
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes, we ship to over 50 countries worldwide. International orders may be subject to customs duties and taxes, which are the responsibility of the recipient.'
      }
    ]
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy on most items. Items must be unworn, unwashed, and in original condition with tags attached. Custom stitched and personalized items are not returnable.'
      },
      {
        q: 'How do I return an item?',
        a: 'Log in to your account, go to "My Orders," select the item you want to return, and follow the prompts. You will receive a return shipping label via email.'
      },
      {
        q: 'How long does it take to process a refund?',
        a: 'Once we receive and inspect your return, refunds are processed within 5-7 business days. The time it takes to appear in your account depends on your payment method.'
      },
      {
        q: 'Can I exchange for a different size?',
        a: 'Yes, you can exchange for a different size within 30 days. We recommend returning the original item and placing a new order to ensure you get the desired item before it goes out of stock.'
      }
    ]
  },
  {
    category: 'Product Information',
    questions: [
      {
        q: 'Are product colors accurate?',
        a: 'We strive to provide accurate color representations, but colors may vary slightly due to monitor settings and photography lighting. We recommend viewing our products on multiple devices if color accuracy is crucial.'
      },
      {
        q: 'Do you offer custom stitching?',
        a: 'Yes, we offer custom stitching services on select products. You can provide your measurements during checkout, and our expert tailors will create a perfect fit for you.'
      },
      {
        q: 'How do I care for my ethnic wear?',
        a: 'Care instructions vary by fabric. Most silk and embroidered items should be dry cleaned. Cotton and synthetic items may be hand washed or machine washed on gentle cycle. Specific care instructions are included with each product.'
      },
      {
        q: 'Are your products authentic?',
        a: 'Yes, all our products are 100% authentic and sourced directly from artisans and manufacturers. We take pride in offering genuine handcrafted products.'
      }
    ]
  },
  {
    category: 'Account',
    questions: [
      {
        q: 'Do I need an account to place an order?',
        a: 'No, you can checkout as a guest. However, creating an account allows you to track orders, save addresses, view order history, and enjoy faster checkout in the future.'
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the email you receive to reset your password.'
      },
      {
        q: 'Can I update my shipping address?',
        a: 'Yes, you can update your shipping address in your account settings. For orders already placed, please contact customer service within 24 hours if you need to change the delivery address.'
      },
      {
        q: 'How do I subscribe to your newsletter?',
        a: 'You can subscribe by entering your email address in the newsletter signup section at the bottom of our website or during checkout.'
      }
    ]
  }
]

// Navbar Component
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

export default function FAQPage() {
  const [openQuestion, setOpenQuestion] = useState<{ category: string; index: number } | null>(null)

  const toggleQuestion = (category: string, index: number) => {
    if (openQuestion?.category === category && openQuestion?.index === index) {
      setOpenQuestion(null)
    } else {
      setOpenQuestion({ category, index })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600">Find answers to common questions about shopping with us</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">FAQs</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {faqs.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(category.category, index)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                        {openQuestion?.category === category.category && openQuestion?.index === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {openQuestion?.category === category.category && openQuestion?.index === index && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-pink-50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
              <p className="text-gray-600 mb-6">
                Can't find the answer you're looking for? Our customer service team is here to help.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
