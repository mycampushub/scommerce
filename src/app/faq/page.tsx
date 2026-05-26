'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'

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
        a: 'Absolutely! For bulk or corporate orders, please contact us at sales@modernecommerce.com for special pricing and dedicated support.'
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
      <Header />

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
