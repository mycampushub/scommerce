'use client'

import React from 'react'
import { ShoppingBag, Home as HomeIcon } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'




export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: January 2024</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Terms of Service</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Acceptance of Terms</h2>
              <p className="text-gray-600 mb-6">
                By accessing and using modern ecommerce, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our website.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to Terms</h2>
              <p className="text-gray-600 mb-6">
                We reserve the right to modify these terms at any time. Your continued use of the website 
                following any changes constitutes acceptance of the new terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to notify us immediately of any unauthorized use of your account</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must provide accurate and complete information when creating an account</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Products and Services</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
                <li>All prices are in USD unless otherwise specified</li>
                <li>We reserve the right to discontinue products at any time</li>
                <li>We strive for accuracy but cannot guarantee that product descriptions are error-free</li>
                <li>Colors may vary slightly due to monitor settings and photography lighting</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders and Payment</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
                <li>We reserve the right to cancel or refuse any order</li>
                <li>Payment is required at the time of purchase</li>
                <li>We accept major credit cards and digital payment methods</li>
                <li>All payments are processed through secure payment gateways</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping</h2>
              <p className="text-gray-600 mb-4">
                Shipping times and costs vary based on your location and selected shipping method. 
                Please refer to our Shipping Policy for detailed information.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Returns and Refunds</h2>
              <p className="text-gray-600 mb-4">
                Our return policy allows you to return products within 30 days of delivery. 
                Please refer to our Returns & Exchanges Policy for detailed information.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Intellectual Property</h2>
              <p className="text-gray-600 mb-6">
                All content on this website, including images, text, graphics, and logos, is the property 
                of modern ecommerce and protected by copyright laws. You may not use, reproduce, or distribute 
                any content without our written permission.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Limitation of Liability</h2>
              <p className="text-gray-600 mb-6">
                To the fullest extent permitted by law, modern ecommerce shall not be liable for any 
                indirect, incidental, special, or consequential damages arising from your use of the website.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Governing Law</h2>
              <p className="text-gray-600 mb-6">
                These terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes shall be resolved in the courts of Mumbai, India.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
              <p className="text-gray-600 mb-2">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <p className="text-gray-600">
                Email: legal@modernecommerce.com<br />
                Address: 123 Fashion Street, Mumbai, Maharashtra 400001, India
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
