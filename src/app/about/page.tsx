import { Metadata } from 'next'

// Skip SEO generation during build time for Cloudflare compatibility
export async function generateMetadata(): Promise<Metadata> {
  // Check if we're in build environment
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                      process.env.VERCEL_ENV === 'production' ||
                      process.env.CI === 'true' ||
                      process.env.NODE_ENV === 'production'

  // During build time, return static metadata
  return {
    title: 'About Us - SCommerce',
    description: 'Learn about SCommerce, Bangladesh\'s premier fashion and lifestyle online store. Discover our story, values, and commitment to quality fashion.',
    openGraph: {
      title: 'About Us - SCommerce',
      description: 'Learn about SCommerce, Bangladesh\'s premier fashion and lifestyle online store. Discover our story, values, and commitment to quality fashion.',
      type: 'website',
    },
  }
}

import Link from 'next/link'
import { Heart, Award, Users, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube, Linkedin, ShoppingBag } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'







export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 to-purple-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Story
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              Celebrating the rich heritage of Indian fashion while embracing modern elegance. 
              We bring you the finest collection of traditional and contemporary ethnic wear.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Our Mission
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  At modern ecommerce, we believe that every piece of clothing tells a story. 
                  Our mission is to make authentic Indian fashion accessible to everyone worldwide, 
                  while preserving the craftsmanship and traditions passed down through generations.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  We work directly with skilled artisans and weavers across India, ensuring fair 
                  compensation and sustainable practices. Every saree, lehenga, and salwar suit 
                  in our collection is a testament to their artistry and dedication.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-pink-50 px-6 py-4 rounded-xl">
                    <p className="text-3xl font-bold text-pink-600 mb-1">50K+</p>
                    <p className="text-gray-600 text-sm">Happy Customers</p>
                  </div>
                  <div className="bg-pink-50 px-6 py-4 rounded-xl">
                    <p className="text-3xl font-bold text-pink-600 mb-1">1000+</p>
                    <p className="text-gray-600 text-sm">Unique Designs</p>
                  </div>
                  <div className="bg-pink-50 px-6 py-4 rounded-xl">
                    <p className="text-3xl font-bold text-pink-600 mb-1">50+</p>
                    <p className="text-gray-600 text-sm">Countries Served</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849"
                  alt="Traditional Indian craftsmanship"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-pink-600 rounded-2xl -z-10 opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from sourcing to delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600">
                We never compromise on quality. Every fabric, thread, and embellishment is carefully selected.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fair Trade</h3>
              <p className="text-gray-600">
                Supporting artisans with fair wages and safe working conditions. Empowering communities.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Authenticity</h3>
              <p className="text-gray-600">
                Genuine handcrafted products from traditional artisans across India. No shortcuts, ever.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Love</h3>
              <p className="text-gray-600">
                Your satisfaction is our priority. We're here to make your shopping experience delightful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
              Our Journey
            </h2>

            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">The Beginning</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Founded in 2010 with a simple vision - to make authentic Indian ethnic wear 
                    accessible to fashion lovers worldwide. Starting as a small family business, 
                    we've grown into a trusted name in Indian fashion.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Connecting Artisans</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We built relationships with master craftsmen across India - from the weavers of 
                    Banaras to the embroiderers of Lucknow. Each partnership tells a story of 
                    tradition and artistry.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Going Global</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Today, we ship to over 50 countries, spreading the beauty of Indian fashion 
                    to every corner of the world. Our customers trust us for authentic designs, 
                    quality fabrics, and exceptional service.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Looking Ahead</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We continue to innovate while staying true to our roots. New collections, 
                    sustainable practices, and technology-driven shopping experiences - all while 
                    preserving the essence of Indian craftsmanship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-pink-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Get in Touch
            </h2>
            <p className="text-pink-100 text-lg mb-8">
              Have questions or want to learn more? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@modernecommerce.com"
                className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email Us
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-pink-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-pink-800 transition-colors"
              >
                Contact Form
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
