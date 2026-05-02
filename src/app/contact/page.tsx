'use client'

import React, { useState } from 'react'
import { ShoppingBag, Mail, Phone, MapPin, Home as HomeIcon, Instagram, Facebook, Twitter, Youtube, Linkedin, Send } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'




export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="bg-gray-50 py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600">We'd love to hear from you. Get in touch with us today.</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Contact</span>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:w-2/5">
              <div className="bg-pink-50 rounded-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Get in Touch
                </h2>
                <p className="text-gray-600 mb-6">
                  Have questions about our products or need help with your order? 
                  We're here to assist you. Reach out to us through any of the following channels.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <p className="text-gray-600">info@modern ecommerce.com</p>
                      <p className="text-gray-600">support@modern ecommerce.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                      <p className="text-gray-600">Mon - Fri, 9am - 6pm IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600">
                        123 Fashion Street<br />
                        Mumbai, Maharashtra 400001<br />
                        India
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Follow Us
                </h3>
                <p className="text-gray-600 mb-6">
                  Stay connected with us on social media for the latest updates, offers, and fashion inspiration.
                </p>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-6 h-6" />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:w-3/5">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Send us a Message
                </h2>

                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="">Select a subject</option>
                        <option value="order">Order Inquiry</option>
                        <option value="product">Product Information</option>
                        <option value="return">Returns & Refunds</option>
                        <option value="shipping">Shipping Information</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-pink-600 text-white py-4 rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send Message
                    </button>

                    <p className="text-sm text-gray-500 text-center">
                      By submitting this form, you agree to our{' '}
                      <Link href="/privacy" className="text-pink-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </form>
                )}
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
