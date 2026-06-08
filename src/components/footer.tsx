'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Footer() {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?hierarchical=false')
        const data = await response.json()
        if (data.success) {
          // Show only active parent categories
          const parentCategories = data.data.filter((cat: any) => !cat.slug.includes('-') && cat.name !== cat.slug.replace(/-/g, ' ')).slice(0, 6)
          setCategories(parentCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Shop</h3>
            <ul className="space-y-2">
              {loading ? (
                <li className="text-gray-400">Loading...</li>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/collections/${cat.slug}`} className="text-gray-300 hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">All Products</Link></li>
                  <li><Link href="/collections/skincare" className="text-gray-300 hover:text-white transition-colors">Skincare</Link></li>
                  <li><Link href="/collections/hair-care" className="text-gray-300 hover:text-white transition-colors">Hair Care</Link></li>
                  <li><Link href="/collections/body-care" className="text-gray-300 hover:text-white transition-colors">Body Care</Link></li>
                  <li><Link href="/collections/baby-care" className="text-gray-300 hover:text-white transition-colors">Baby Care</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Featured</Link></li>
              <li><Link href="/shop" className="text-gray-300 hover:text-white transition-colors">Shop All</Link></li>
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
              <li>
                <a
                  href="https://www.instagram.com/scommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Visit our Instagram page"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/scommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Visit our Facebook page"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.twitter.com/scommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Visit our Twitter page"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@scommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Visit our YouTube channel"
                >
                  YouTube
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/scommerce"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Visit our LinkedIn page"
                >
                  LinkedIn
                </a>
              </li>
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
