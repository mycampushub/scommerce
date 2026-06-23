'use client'


import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Heart, Share2, Truck, Shield, RotateCcw, Star, ShoppingCart, Check, Minus, Plus, Home as HomeIcon, ShoppingBag, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { usePathname } from 'next/navigation'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useCartStore } from '@/lib/store/cart-store'
import { useRecentlyViewedStore } from '@/lib/store/recently-viewed-store'
import { toast } from 'sonner'
import { ReviewsSection, ReviewsSectionHandle } from '@/components/reviews-section'
import { ReviewForm } from '@/components/review-form'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { RecentlyViewed } from '@/components/recently-viewed'
import { ProductStructuredData } from '@/components/product-structured-data'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceDisplay } from '@/components/price-display'
import { parseImages } from '@/lib/images'
import { resolveProductImages, fetchColorImages, ColorImage } from '@/lib/product-images'
import { shareContent, getProductShareData } from '@/lib/share'

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
  brandName?: string | null
  countryOfOrigin?: string | null
  sizeType?: string | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
  // Material and color for single products
  material?: string | null
  color?: string | null
  // Multi-size/color system
  availableSizes?: string[]
  availableColors?: string[]
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
  slug: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  badge?: string
}



// Navbar Component

// Footer Component

// Mobile Bottom Navigation

export default function ProductPage() {
  const pathname = usePathname()
  const productSlug = pathname.split('/').pop() || ''
  const { addItem, getItemCount } = useCartStore()
  const { addProduct } = useRecentlyViewedStore()
  const { user } = useAuth()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [colorImages, setColorImages] = useState<ColorImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<RelatedProduct[]>([])
  const [reviewFormOpen, setReviewFormOpen] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [togglingWishlist, setTogglingWishlist] = useState(false)
  const reviewsSectionRef = useRef<ReviewsSectionHandle>(null)

  // Fetch related products
  async function fetchRelatedProducts(categoryId: string, currentProductId: string) {
    try {
      const response = await fetch(`/api/products?limit=8`)
      if (response.ok) {
        const result = await response.json() as any
        // Get products array from response
        const products = result.success
          ? (Array.isArray(result.data) ? result.data : (result.data?.products || []))
          : []
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
        const result = await response.json() as any
        if (result.success && result.data.products) {
          setRecommendedProducts(result.data.products.slice(0, 4))
        }
      }
    } catch (err) {
      console.error('Error fetching recommended products:', err)
    }
  }

  // Fetch product data
  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

        const productResponse = await fetch(`/api/products/${productSlug}`)

        if (!productResponse.ok) {
          throw new Error('Failed to fetch product')
        }

        const productData = await productResponse.json() as any
        // API returns { success: true, data: {...productData } }
        const actualProduct = productData.data || productData
        console.log('[Product Page] Product data received:', {
          id: actualProduct.id,
          name: actualProduct.name,
          hasVariants: actualProduct.hasVariants,
          hasVariantsType: typeof actualProduct.hasVariants,
          slug: actualProduct.slug,
        })
        setProduct(actualProduct as any)

        // Fetch variants
        setLoadingVariants(true)
        try {
          const variantsResponse = await fetch(`/api/products/${productSlug}/variants`)
          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json() as any
            // Handle different response structures
            const variantsArray = variantsData?.data?.variants || variantsData?.variants || variantsData?.data || []
            console.log('[Product Page] Fetched variants:', variantsArray.length, 'variants')
            setVariants(variantsArray)

            // Select default variant or first variant
            if (variantsArray && variantsArray.length > 0) {
              const defaultVariant = variantsArray.find((v: ProductVariant) => v.isDefault) || variantsArray[0]
              console.log('[Product Page] Selected default variant:', defaultVariant)
              setSelectedVariant(defaultVariant)
              setSelectedSize(defaultVariant.size || '')
              setSelectedColor(defaultVariant.color || '')
              setSelectedMaterial(defaultVariant.material || '')
            }
          } else {
            console.warn('[Product Page] Variants API returned non-OK status:', variantsResponse.status)
          }
        } catch (err) {
          console.error('[Product Page] Error fetching variants:', err)
        } finally {
          setLoadingVariants(false)
        }

        // Fetch related products from the same category
        if (actualProduct.categorySlug) {
          fetchRelatedProducts(actualProduct.categoryId, actualProduct.id)
        }

        // Fetch recommended products
        fetchRecommendedProducts(actualProduct.slug, actualProduct.categoryId)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Unable to load product. Please try again later.')
      } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productSlug) {
      fetchProduct()
    }
  }, [productSlug])

  // Track recently viewed product
  useEffect(() => {
    if (product) {
      addProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.basePrice || product.price,
        comparePrice: product.comparePrice,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image,
        rating: product.rating,
        reviews: product.reviews,
        categoryId: product.categoryId,
        category: product.category,
      })
    }
  }, [product, addProduct])

  // Reset image index when product/variant changes
  useEffect(() => {
    setCurrentImage(0)
  }, [selectedVariant?.id, product?.id])

  // Fetch color images when product is loaded
  useEffect(() => {
    const fetchColorImagesForProduct = async () => {
      if (!product) return

      try {
        const images = await fetchColorImages(product.id)
        setColorImages(images)
      } catch (error) {
        console.error('Error fetching color images:', error)
      }
    }

    fetchColorImagesForProduct()
  }, [product?.id])

  // Handle variant selection
  const handleVariantSelection = (size: string | undefined, color?: string, material?: string) => {
    setSelectedSize(size || '')
    setSelectedColor(color || '')
    setSelectedMaterial(material || '')

    // Find matching variant
    const matchingVariant = variants.find(v =>
      (!size || v.size === size) &&
      (!color || v.color === color) &&
      (!material || v.material === material)
    )

    if (matchingVariant) {
      setSelectedVariant(matchingVariant)
      setCurrentImage(0) // Reset to first image when variant changes
    } else {
      setSelectedVariant(null)
    }
  }

  // Process variants and selections
  // Get available sizes, colors, materials from variants OR product-level fields
  // Priority: product.availableSizes/availableColors > derived from variants
  const availableSizes = (product?.availableSizes && product.availableSizes.length > 0)
    ? product.availableSizes
    : [...new Set(variants.map(v => v.size).filter(Boolean))]

  const availableColors = (product?.availableColors && product.availableColors.length > 0)
    ? product.availableColors
    : [...new Set(variants.map(v => v.color).filter(Boolean))]

  const availableMaterials = [...new Set(variants.map(v => v.material).filter(Boolean))]

  // Show variant selectors if variants exist OR if product has availableSizes/availableColors
  // This handles the case where a product has sizes/colors defined but no variant rows yet
  const hasVariantsFromDb = variants.length > 0
  const hasVariantsFromAttributes = availableSizes.length > 0 || availableColors.length > 0
  const hasVariants = hasVariantsFromDb || hasVariantsFromAttributes

  // Debug logging for variant attributes
  if (hasVariants) {
    console.log('[Product Page] Variant attributes:', {
      hasVariants,
      hasVariantsFromDb,
      hasVariantsFromAttributes,
      variantsCount: variants.length,
      productAvailableSizes: product?.availableSizes,
      productAvailableColors: product?.availableColors,
      availableSizes,
      availableColors,
      availableMaterials,
      willShowSizeSelector: availableSizes.length > 0,
      willShowColorSelector: availableColors.length > 0,
      willShowMaterialSelector: availableMaterials.length > 0,
    })
  } else {
    console.log('[Product Page] Variant selectors will NOT show:', {
      hasVariants,
      hasVariantsFromDb,
      hasVariantsFromAttributes,
      productHasVariants: product?.hasVariants,
      productAvailableSizes: product?.availableSizes,
      productAvailableColors: product?.availableColors,
      variantsLength: variants.length,
      reason: !product?.hasVariants && !hasVariantsFromAttributes ? 'Product hasVariants is false and no sizes/colors defined' : variants.length === 0 ? 'No variants loaded' : 'Unknown',
    })
  }

  // Get current price based on selected variant
  const currentPrice = selectedVariant ? selectedVariant.price : product?.basePrice || product?.price || 0
  const currentComparePrice = selectedVariant ? selectedVariant.comparePrice : product?.comparePrice || null
  const currentStock = selectedVariant ? selectedVariant.stock : product?.stock || 0

  // For variant products, hide stock info until variant is selected
  // (variant products have 0 stock at product level)
  const showStock = !hasVariants || (selectedVariant !== null)
  const stockDisplayMessage = hasVariants && !selectedVariant
    ? 'Select a variant to see stock'
    : (currentStock > 0 ? `In Stock (${currentStock} available)` : 'Out of Stock')
  const isStockLoading = hasVariants && loadingVariants

  // ENHANCED IMAGE LOGIC:
  // 1. If a variant is selected and has images, use those images
  // 2. If color is selected and color images exist for that color, use those
  // 3. Otherwise, use the default product images (product.images or product.image)
  const currentImages = resolveProductImages({
    productId: product?.id || '',
    selectedColor,
    selectedSize,
    variantImages: selectedVariant?.images,
    productImages: product?.images || null,
    colorImages,
  })

  // Get the display image (fallback to placeholder if empty)
  const displayImage = currentImages[currentImage] || (currentImages.length > 0 ? currentImages[0] : (product?.image || '/placeholder-image.jpg'))

  // Check if user has purchased this product
  async function checkUserPurchase() {
    if (!user || !product) return
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`)
      if (response.ok) {
        const orders = await response.json() as any
        const hasBought = (orders as any).data?.some((order: any) =>
          order.orderItems?.some((item: any) => item.productId === product.id)
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

  const handleAddToCart = async () => {
    if (!product) return

    // Use variant data if available
    if (hasVariantsFromDb) {
      if (!selectedVariant) {
        toast.error('Please select a variant')
        return
      }
    }

    // If product has size/color attributes but no variant rows, require selection
    if (!hasVariantsFromDb && hasVariantsFromAttributes) {
      if (availableSizes.length > 0 && !selectedSize) {
        toast.error('Please select a size')
        return
      }
      if (availableColors.length > 0 && !selectedColor) {
        toast.error('Please select a color')
        return
      }
    }

    setAddingToCart(true)
    try {
      const cartItem = hasVariantsFromDb
        ? {
            id: product.id,
            slug: product.slug,
            name: selectedVariant!.name || product.name,
            price: selectedVariant!.price,
            originalPrice: selectedVariant!.comparePrice || product.comparePrice,
            image: (Array.isArray(selectedVariant!.images) && selectedVariant!.images.length > 0 ? selectedVariant!.images[0] : null) || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image),
            variantId: selectedVariant!.id,
            variantSku: selectedVariant!.sku,
            size: selectedVariant!.size,
            color: selectedVariant!.color,
            material: selectedVariant!.material,
            quantity,
          }
        : {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.basePrice || product.price,
            originalPrice: product.comparePrice,
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image,
            size: selectedSize || undefined,
            color: selectedColor || undefined,
            material: selectedMaterial || undefined,
            quantity,
          }

      // Add to local cart store (useCartSync handles server sync)
      addItem(cartItem)

      toast.success('Added to cart successfully!')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleShare = async () => {
    if (!product) return

    try {
      const result = await shareContent(getProductShareData({
        name: product.name,
        slug: product.slug,
        description: product.description || undefined,
        price: product.basePrice || product.price,
        image: product.image
      }))

      if (result === 'clipboard') {
        toast.success('Product link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing product:', error)
      toast.error('Failed to share product')
    }
  }

  const handleToggleWishlist = async () => {
    if (!product) return

    setTogglingWishlist(true)
    try {
      const method = isWishlisted ? 'DELETE' : 'POST'
      const url = method === 'DELETE' ? `/api/wishlist?productId=${product.id}` : '/api/wishlist'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: method === 'POST' ? JSON.stringify({ productId: product.id }) : undefined
      })
      const data = await response.json() as any
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update wishlist')
      }
      if (data.action === 'removed') {
        toast.success('Removed from wishlist')
      } else {
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
      }
      setIsWishlisted(!isWishlisted)
    } catch (error: any) {
      console.error('Wishlist toggle error:', error)
      toast.error(error.message || 'Failed to update wishlist')
    } finally {
      setTogglingWishlist(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return

    // Use variant data if available
    if (hasVariantsFromDb) {
      if (!selectedVariant) {
        toast.error('Please select a variant')
        return
      }
    }

    // If product has size/color attributes but no variant rows, require selection
    if (!hasVariantsFromDb && hasVariantsFromAttributes) {
      if (availableSizes.length > 0 && !selectedSize) {
        toast.error('Please select a size')
        return
      }
      if (availableColors.length > 0 && !selectedColor) {
        toast.error('Please select a color')
        return
      }
    }

    setAddingToCart(true)
    try {
      const cartItem = hasVariantsFromDb
        ? {
            id: product.id,
            slug: product.slug,
            name: selectedVariant!.name || product.name,
            price: selectedVariant!.price,
            originalPrice: selectedVariant!.comparePrice || product.comparePrice,
            image: (Array.isArray(selectedVariant!.images) && selectedVariant!.images.length > 0 ? selectedVariant!.images[0] : null) || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image),
            variantId: selectedVariant!.id,
            variantSku: selectedVariant!.sku,
            size: selectedVariant!.size,
            color: selectedVariant!.color,
            material: selectedVariant!.material,
            quantity,
          }
        : {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.basePrice || product.price,
            originalPrice: product.comparePrice,
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.image,
            size: selectedSize || undefined,
            color: selectedColor || undefined,
            material: selectedMaterial || undefined,
            quantity,
          }

      // Add to local cart store
      addItem(cartItem)

      toast.success('Added to cart!')
      
      // Navigate to checkout
      window.location.href = '/checkout'
    } finally {
      setAddingToCart(false)
    }
  }

  const addRelatedProductToCart = (relatedProduct: RelatedProduct) => {
    addItem({
      id: relatedProduct.id,
      slug: relatedProduct.slug,
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
        <Header />
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery Skeleton */}
            <div className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>

              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" />
              </div>

              {/* Quantity Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-col gap-4">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>

              {/* Features Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
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
        <Header />
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
      <Header />

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
                <Link href={`/collections/${product.categorySlug}`} className="hover:text-pink-600">
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
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
                {product.badge && (
                  <span className="absolute top-4 left-4 bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {product.badge}
                  </span>
                )}
                <button
                  onClick={handleToggleWishlist}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  disabled={togglingWishlist}
                  className={`absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                    togglingWishlist ? 'opacity-50' : ''
                  }`}
                >
                  {togglingWishlist ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-pink-600' : ''}`} />}
                </button>
                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {currentImages.length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {currentImages.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      aria-label={`View image ${index + 1} of ${currentImages.length}`}
                      className={`min-h-[80px] aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                        currentImage === index ? 'border-pink-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image || '/placeholder-image.jpg'}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
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
                <PriceDisplay value={currentPrice} originalPrice={currentComparePrice || product.originalPrice} showDecimals={false} className="text-3xl font-bold text-gray-900" />
                {(currentComparePrice || product.originalPrice) && (
                  <span className="text-sm text-pink-600 font-medium">
                    {Math.round((1 - currentPrice / (currentComparePrice || product.originalPrice || currentPrice)) * 100)}% OFF
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isStockLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    <span className="text-gray-400 font-medium">Checking stock...</span>
                  </>
                ) : showStock ? (
                  currentStock > 0 ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-green-600 font-medium">{stockDisplayMessage}</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-red-600 font-medium">{stockDisplayMessage}</span>
                    </>
                  )
                ) : (
                  <>
                    <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                    <span className="text-gray-500 font-medium">{stockDisplayMessage}</span>
                  </>
                )}
              </div>

              {/* Product Metadata: Brand and Country of Origin */}
              <div className="space-y-3 py-3 border-t border-b border-gray-200">
                {product.brandName && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Brand:</span>
                    <span className="text-sm font-medium text-gray-900">{product.brandName}</span>
                  </div>
                )}
                {product.countryOfOrigin && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Origin:</span>
                    <span className="text-sm font-medium text-gray-900">{product.countryOfOrigin}</span>
                  </div>
                )}
                {!hasVariants && (product.sizeLabel || (product.sizeValue && product.sizeUnit)) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Size:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {product.sizeLabel || `${product.sizeValue}${product.sizeUnit}`}
                    </span>
                  </div>
                )}
                {!hasVariants && product.material && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Material:</span>
                    <span className="text-sm font-medium text-gray-900">{product.material}</span>
                  </div>
                )}
                {!hasVariants && product.color && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Color:</span>
                    <span className="text-sm font-medium text-gray-900">{product.color}</span>
                  </div>
                )}
              </div>

              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-semibold text-yellow-900 mb-2">🔍 Variant Debug Info:</p>
                  <ul className="space-y-1 text-yellow-800">
                    <li>hasVariants: {String(hasVariants)}</li>
                    <li>product.hasVariants: {String(product?.hasVariants)} (type: {typeof product?.hasVariants})</li>
                    <li>variants.length: {variants.length}</li>
                    <li>loadingVariants: {String(loadingVariants)}</li>
                    <li>availableSizes: {availableSizes.join(', ')}</li>
                    <li>availableColors: {availableColors.join(', ')}</li>
                    <li>availableMaterials: {availableMaterials.join(', ')}</li>
                    <li>Will show selectors: {String(hasVariants && !loadingVariants)}</li>
                  </ul>
                </div>
              )}

              {/* Variant Selectors */}
              {hasVariants && (
                <div className="space-y-6">
                  {loadingVariants ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 text-pink-600 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Size Selection */}
                      {availableSizes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Size: <span className="text-pink-600">{selectedSize || 'Select'}</span></h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {availableSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => handleVariantSelection(size, selectedColor as string, selectedMaterial as string)}
                            className={`min-h-[44px] w-20 px-3 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                              selectedSize === size
                                ? 'border-pink-600 bg-pink-50 text-pink-600'
                                : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                            }`}
                          >
                            <span className="transition-all">
                              {size}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selection */}
                  {availableColors.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Color: <span className="text-pink-600">{selectedColor || 'Select'}</span></h3>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {availableColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleVariantSelection(selectedSize as string, color, selectedMaterial as string)}
                            className={`min-h-[44px] px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                              selectedColor === color
                                ? 'border-pink-600 bg-pink-50 text-pink-600'
                                : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                            }`}
                          >
                            <span className="transition-all">
                              {color}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                      {/* Material Selection */}
                      {availableMaterials.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Material: <span className="text-pink-600">{selectedMaterial || 'Select'}</span></h3>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {availableMaterials.map((material) => (
                              <button
                                key={material}
                                onClick={() => handleVariantSelection(selectedSize as string, selectedColor as string, material)}
                                className={`min-h-[44px] px-4 py-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                                  selectedMaterial === material
                                    ? 'border-pink-600 bg-pink-50 text-pink-600'
                                    : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gray-50'
                                }`}
                              >
                                <span className="transition-all">
                                  {material}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label="Decrease quantity"
                    className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center text-xl font-semibold" aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    aria-label="Increase quantity"
                    className="min-w-[44px] min-h-[44px] w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
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
                    disabled={(!showStock || currentStock <= 0) || (hasVariantsFromDb && !selectedVariant) || (hasVariantsFromAttributes && !selectedSize && !selectedColor) || addingToCart}
                    className={`min-h-[48px] flex-1 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                      (!showStock || currentStock <= 0) && !hasVariants ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                      (hasVariantsFromDb && !selectedVariant) || (hasVariantsFromAttributes && !selectedSize && !selectedColor) || addingToCart
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                  >
                    {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                    {addingToCart ? 'Adding...' : (isStockLoading ? 'Loading...' : hasVariantsFromDb && !selectedVariant ? 'Select a Variant' : hasVariantsFromAttributes && !selectedSize && !selectedColor ? 'Select Options' : (!showStock || currentStock <= 0) ? 'Out of Stock' : 'Add to Cart')}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={(!showStock || currentStock <= 0) || (hasVariantsFromDb && !selectedVariant) || (hasVariantsFromAttributes && !selectedSize && !selectedColor) || addingToCart}
                    className={`min-h-[48px] w-full sm:w-auto px-8 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                      (!showStock || currentStock <= 0) && !hasVariants ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                      (hasVariantsFromDb && !selectedVariant) || (hasVariantsFromAttributes && !selectedSize && !selectedColor) || addingToCart
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {addingToCart ? 'Processing...' : (isStockLoading ? 'Loading...' : hasVariantsFromDb && !selectedVariant ? 'Select a Variant' : hasVariantsFromAttributes && !selectedSize && !selectedColor ? 'Select Options' : (!showStock || currentStock <= 0) ? 'Out of Stock' : 'Buy Now')}
                  </button>
                </div>
                <Button
                  onClick={() => setReviewFormOpen(true)}
                  variant="outline"
                  className="w-full min-h-[48px]"
                >
                  Write a Review
                </Button>
              </div>

              {/* Share */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleShare}
                  className="min-h-[44px] px-4 py-3 rounded-lg flex items-center gap-2 text-gray-600 hover:text-pink-600 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Share this product</span>
                  <span className="sm:hidden">Share</span>
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
        ref={reviewsSectionRef}
        productId={product.id}
        averageRating={product?.rating || 0}
        reviewCount={product?.reviews || 0}
      />

      {/* Review Form Dialog */}
      {product && (
        <ReviewForm
          productId={product.id}
          productName={product.name}
          isOpen={reviewFormOpen}
          onClose={() => setReviewFormOpen(false)}
          onSuccess={async () => {
            // Refresh the reviews section and product data
            if (reviewsSectionRef.current) {
              reviewsSectionRef.current.refetch()
            }
            // Re-fetch product data to update rating and review count
            await fetchProduct()
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <div key={product.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                  {product.badge && (
                    <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {product.badge}
                    </span>
                  )}
                  <Link href={`/product/${product.slug}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Link
                      href={`/product/${product.slug}`}
                      className="min-h-[40px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium bg-white text-gray-900 hover:bg-pink-600 hover:text-white transition-colors"
                    >
                      <span className="hidden sm:inline">Quick View</span>
                      <span className="sm:hidden">View</span>
                    </Link>
                    <button
                      onClick={() => addRelatedProductToCart(product)}
                      aria-label={`Add ${product.name} to cart`}
                      className="min-h-[40px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 transition-colors"
                    >
                      <span className="hidden sm:inline">Add to Cart</span>
                      <span className="sm:hidden">Add</span>
                    </button>
                  </div>
                </div>
                <Link href={`/product/${product.slug}`}>
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
                  <PriceDisplay value={product.price} originalPrice={product.originalPrice} />
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((product) => (
                  <div key={product.id} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                      <Link href={`/product/${product.slug}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link
                          href={`/product/${product.slug}`}
                          className="min-h-[40px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium bg-white text-gray-900 hover:bg-pink-600 hover:text-white transition-colors"
                        >
                          <span className="hidden sm:inline">Quick View</span>
                          <span className="sm:hidden">View</span>
                        </Link>
                        <button
                          onClick={() => addRelatedProductToCart(product)}
                          aria-label={`Add ${product.name} to cart`}
                          className="min-h-[40px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 transition-colors"
                        >
                          <span className="hidden sm:inline">Add to Cart</span>
                          <span className="sm:hidden">Add</span>
                        </button>
                      </div>
                    </div>
                    <Link href={`/product/${product.slug}`}>
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
                      <PriceDisplay value={product.price} originalPrice={product.originalPrice} />
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
