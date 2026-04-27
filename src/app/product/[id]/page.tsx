'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Heart, Share2, Truck, Shield, RotateCcw, Star, ShoppingCart, Check, Minus, Plus, Home as HomeIcon, ShoppingBag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useCartStore } from '@/lib/store/cart-store'
import { useRecentlyViewedStore } from '@/lib/store/recently-viewed-store'
import { toast } from 'sonner'
import { ReviewsSection } from '@/components/reviews-section'
import { ReviewForm } from '@/components/review-form'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { RecentlyViewed } from '@/components/recently-viewed'
import { ProductStructuredData } from '@/components/product-structured-data'

// Types
interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  basePrice: number
  originalPrice?: number
  comparePrice?: number
  image: string
  images: string[]
  rating: number
  reviews: number
  badge?: string
  category: string | null
  categorySlug?: string | null
  categoryId: string
  stock: number
  lowStockAlert: number
  hasVariants: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  comparePrice?: number
  stock: number
  images: string[] | null
  size?: string
  color?: string
  material?: string
  isDefault: boolean
  isActive: boolean
}

interface RelatedProduct {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  badge?: string
}



// Navbar Component
function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isHeaderVisible = useScrollDirection()

  return (
    <header className={`bg-white shadow-sm z-40 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
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
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
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
  const pathname = usePathname()
  const isVisible = useScrollDirection()

  return (
    <>
      {isVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300">
          <div className="pb-safe pt-3 pb-6 px-4">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-4 py-2 flex items-center justify-between gap-2">
                <a
                  href="/"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-colors active:scale-95 ${
                    pathname === '/'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Navigate to home"
                >
                  <HomeIcon className="w-6 h-6" strokeWidth={2.5} />
                </a>
                <a
                  href="/shop"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-colors active:scale-95 ${
                    pathname?.startsWith('/shop') && pathname !== '/shop/search'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Navigate to shop"
                >
                  <ShoppingBag className="w-6 h-6" strokeWidth={2} />
                </a>
                <button
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-colors active:scale-95 ${
                    pathname === '/search'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Open search"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-colors active:scale-95 relative ${
                    pathname === '/cart'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="View cart"
                >
                  <ShoppingCart className="w-6 h-6" strokeWidth={2} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">{itemCount}</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  )
}

export default function ProductPage() {
  const pathname = usePathname()
  const productId = pathname.split('/').pop() || ''
  const { addItem } = useCartStore()
  const { addProduct } = useRecentlyViewedStore()
  const { user } = useAuth()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<RelatedProduct[]>([])
  const [reviewFormOpen, setReviewFormOpen] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)

  // Fetch related products
  async function fetchRelatedProducts(categoryId: string, currentProductId: string) {
    try {
      const response = await fetch(`/api/products?limit=8`)
      if (response.ok) {
        const products = await response.json()
        // Filter products from same category, excluding current product
        const related = products
          .filter((p: Product) => p.categoryId === categoryId && p.id !== currentProductId)
          .slice(0, 4)
        setRelatedProducts(related)
      }
    } catch (err) {
      console.error('Error fetching related products:', err)
    }
  }

  // Fetch recommended products
  async function fetchRecommendedProducts(currentProductId: string, categoryId?: string) {
    try {
      const response = await fetch(
        `/api/products/recommendations?productId=${currentProductId}&categoryId=${categoryId || ''}&limit=8&type=mixed`
      )
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.products) {
          setRecommendedProducts(result.data.products.slice(0, 4))
        }
      }
    } catch (err) {
      console.error('Error fetching recommended products:', err)
    }
  }

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        setError(null)
        
        const productResponse = await fetch(`/api/products/${productId}`)
        
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product')
        }
        
        const productData = await productResponse.json()
        setProduct(productData)
        
        // Fetch variants
        const variantsResponse = await fetch(`/api/products/${productId}/variants`)
        if (variantsResponse.ok) {
          const variantsData = await variantsResponse.json()
          setVariants(variantsData.data.variants || [])

          // Select default variant or first variant
          if (variantsData.data.variants && variantsData.data.variants.length > 0) {
            const defaultVariant = variantsData.data.variants.find((v: ProductVariant) => v.isDefault) || variantsData.data.variants[0]
            setSelectedVariant(defaultVariant)
            setSelectedSize(defaultVariant.size || '')
            setSelectedColor(defaultVariant.color || '')
            setSelectedMaterial(defaultVariant.material || '')
          }
        }

        // Fetch related products from the same category
        if (productData.categorySlug) {
          fetchRelatedProducts(productData.categoryId, productData.id)
        }

        // Fetch recommended products
        fetchRecommendedProducts(productId, productData.categoryId)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Unable to load product. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // Track recently viewed product
  useEffect(() => {
    if (product) {
      addProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice || product.price,
        comparePrice: product.comparePrice,
        image: product.images[0] || product.image,
        rating: product.rating,
        reviews: product.reviews,
        categoryId: product.categoryId,
        category: product.category,
      })
    }
  }, [product, addProduct])

  // Handle variant selection
  const handleVariantSelection = (size: string, color: string, material: string) => {
    setSelectedSize(size)
    setSelectedColor(color)
    setSelectedMaterial(material)

    // Find matching variant
    const matchingVariant = variants.find(v =>
      (!size || v.size === size) &&
      (!color || v.color === color) &&
      (!material || v.material === material)
    )

    if (matchingVariant) {
      setSelectedVariant(matchingVariant)
      setCurrentImage(0)
    }
  }

  // Get available sizes, colors, materials from variants
  const availableSizes = [...new Set(variants.map(v => v.size).filter(Boolean))]
  const availableColors = [...new Set(variants.map(v => v.color).filter(Boolean))]
  const availableMaterials = [...new Set(variants.map(v => v.material).filter(Boolean))]

  // Get current price based on selected variant
  const currentPrice = selectedVariant ? selectedVariant.price : product?.basePrice || product?.price || 0
  const currentComparePrice = selectedVariant ? selectedVariant.comparePrice : product?.comparePrice || null
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock || 0
  const currentImages = selectedVariant?.images && selectedVariant.images.length > 0 ? selectedVariant.images : product?.images || []

  // Check if user has purchased this product
  async function checkUserPurchase() {
    if (!user) return
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`)
      if (response.ok) {
        const orders = await response.json()
        const hasBought = orders.data?.some((order: any) =>
          order.orderItems?.some((item: any) => item.productId === productId)
        )
        setHasPurchased(hasBought)
      }
    } catch (err) {
      console.error('Error checking user purchase:', err)
    }
  }

  // Check purchase when product and user are loaded
  useEffect(() => {
    if (product && user) {
      checkUserPurchase()
    }
  }, [product, user])

  const handleAddToCart = () => {
    if (!product) return

    // Use variant data if available
    if (product.hasVariants) {
      if (!selectedVariant) {
        toast.error('Please select a variant')
        return
      }

      addItem({
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        originalPrice: selectedVariant.comparePrice || product.comparePrice,
        image: (selectedVariant.images && selectedVariant.images[0]) || product.images[0] || product.image,
        variantId: selectedVariant.id,
        variantSku: selectedVariant.sku,
        size: selectedVariant.size,
        color: selectedVariant.color,
        material: selectedVariant.material,
        quantity,
      })
    } else {
      addItem({
        id: product.id,
        name: product.name,
        price: product.basePrice || product.price,
        originalPrice: product.comparePrice,
        image: product.images[0] || product.image,
        quantity,
      })
    }
    toast.success('Added to cart successfully!')
  }

  const addRelatedProductToCart = (relatedProduct: RelatedProduct) => {
    addItem({
      id: relatedProduct.id,
      name: relatedProduct.name,
      price: relatedProduct.price,
      originalPrice: relatedProduct.originalPrice,
      image: relatedProduct.image,
      quantity: 1,
    })
    toast.success('Added to cart!')
  }

  const nextImage = () => {
    if (currentImages.length > 0) {
      setCurrentImage((prev) => (prev + 1) % currentImages.length)
    }
  }

  const prevImage = () => {
    if (currentImages.length > 0) {
      setCurrentImage((prev) => (prev - 1 + currentImages.length) % currentImages.length)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'We couldn\'t find the product you\'re looking for.'}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Product Structured Data for SEO */}
      {product && <ProductStructuredData product={product} />}
      <Navbar />

      {/* Breadcrumb */}
      <nav className="bg-gray-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-600">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-pink-600">Shop</Link>
            {product.categorySlug && (
              <>
                <span>/</span>
                <Link href={`/${product.categorySlug}`} className="hover:text-pink-600">
                  {product.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </nav>

      {/* Product Details */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={currentImages[currentImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <span className="absolute top-4 left-4 bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {product.badge}
                  </span>
                )}
                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {currentImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {currentImages.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        currentImage === index ? 'border-pink-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-pink-600 font-medium mb-2">{product.category || 'Uncategorized'}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-gray-600 ml-2">{product.rating} ({product.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">৳{currentPrice}</span>
                {(currentComparePrice || product.originalPrice) && (
                  <>
                    <span className="text-xl text-gray-400 line-through">৳{currentComparePrice || product.originalPrice}</span>
                    <span className="text-sm text-pink-600 font-medium">
                      {Math.round((1 - currentPrice / (currentComparePrice || product.originalPrice || currentPrice)) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentStock > 0 ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-green-600 font-medium">
                      In Stock ({currentStock} available)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Variant Selectors */}
              {product.hasVariants && variants.length > 0 && (
                <div className="space-y-6">
                  {/* Size Selection */}
                  {availableSizes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Size: <span className="text-pink-600">{selectedSize || 'Select'}</span></h3>
                      <div className="flex flex-wrap gap-3">
                        {availableSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => handleVariantSelection(size, selectedColor, selectedMaterial)}
                            className={`w-20 py-3 rounded-lg border-2 font-medium transition-all ${
                              selectedSize === size
                                ? 'border-pink-600 bg-pink-50 text-pink-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selection */}
                  {availableColors.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Color: <span className="text-pink-600">{selectedColor || 'Select'}</span></h3>
                      <div className="flex flex-wrap gap-3">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleVariantSelection(selectedSize, color, selectedMaterial)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              selectedColor === color
                                ? 'border-pink-600 bg-pink-50 text-pink-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Material Selection */}
                  {availableMaterials.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Material: <span className="text-pink-600">{selectedMaterial || 'Select'}</span></h3>
                      <div className="flex flex-wrap gap-3">
                        {availableMaterials.map((material) => (
                          <button
                            key={material}
                            onClick={() => handleVariantSelection(selectedSize, selectedColor, material)}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              selectedMaterial === material
                                ? 'border-pink-600 bg-pink-50 text-pink-600'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {material}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center text-xl font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={currentStock <= 0 || (product.hasVariants && !selectedVariant)}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                      currentStock <= 0 || (product.hasVariants && !selectedVariant)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {currentStock <= 0 ? 'Out of Stock' : product.hasVariants && !selectedVariant ? 'Select a Variant' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl font-semibold border-2 transition-colors flex items-center justify-center gap-2 ${
                      isWishlisted
                        ? 'border-pink-600 text-pink-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-600' : ''}`} />
                    {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                  </button>
                </div>
                <Button
                  onClick={() => setReviewFormOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  Write a Review
                </Button>
              </div>

              {/* Share */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                  Share this product
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <Truck className="w-6 h-6 text-pink-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Free Shipping</h4>
                    <p className="text-sm text-gray-600">On orders over $100</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-pink-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Payment</h4>
                    <p className="text-sm text-gray-600">100% secure checkout</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-6 h-6 text-pink-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Easy Returns</h4>
                    <p className="text-sm text-gray-600">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Description */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

            <h3 className="font-semibold text-gray-900 mb-3">Features:</h3>
            <ul className="space-y-2">
              {selectedMaterial && (
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-pink-600" />
                  Material: {selectedMaterial}
                </li>
              )}
              {currentStock > 0 && (
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-pink-600" />
                  {currentStock} items in stock
                </li>
              )}
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-pink-600" />
                Free shipping on orders over $100
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-5 h-5 text-pink-600" />
                30-day easy returns
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewsSection 
        productId={productId}
        averageRating={product?.rating || 0}
        reviewCount={product?.reviews || 0}
      />

      {/* Review Form Dialog */}
      {product && (
        <ReviewForm
          productId={productId}
          productName={product.name}
          isOpen={reviewFormOpen}
          onClose={() => setReviewFormOpen(false)}
          onSuccess={() => {
            // Refresh the page to update reviews
            window.location.reload()
          }}
          hasPurchased={hasPurchased}
        />
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <>
          <section className="py-8 md:py-12 bg-gray-50">
            <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <div key={product.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                  {product.badge && (
                    <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {product.badge}
                    </span>
                  )}
                  <Link href={`/product/${product.id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Link
                      href={`/product/${product.id}`}
                      className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                    >
                      Quick View
                    </Link>
                    <button
                      onClick={() => addRelatedProductToCart(product)}
                      className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </>
      )}

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <>
          <section className="py-8 md:py-12 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <ShoppingBag className="w-6 h-6 text-pink-600" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Recommended For You
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((product) => (
                  <div key={product.id} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                      <Link href={`/product/${product.id}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link
                          href={`/product/${product.id}`}
                          className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                        >
                          Quick View
                        </Link>
                        <button
                          onClick={() => addRelatedProductToCart(product)}
                          className="bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Recently Viewed Products */}
      <RecentlyViewed limit={4} />

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
