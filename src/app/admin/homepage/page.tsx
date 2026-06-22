'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, 
  Save, RefreshCw, Image as ImageIcon, Video, ExternalLink,
  ChevronUp, ChevronDown, Settings, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/admin/image-upload'

// Types
interface Banner {
  id: string
  title: string
  description?: string
  image: string
  mobileImage?: string
  buttonText?: string
  buttonLink?: string
  isActive: boolean
  order: number
}

interface Story {
  id: string
  title: string
  thumbnail: string
  images: string[]
  isActive: boolean
  order: number
}

interface Reel {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  productIds: string[]
  isActive: boolean
  order: number
}

interface Promotion {
  id: string
  title: string
  description?: string
  image: string
  type?: string
  promoCode?: string
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  startDate?: string
  endDate?: string
  ctaText?: string
  ctaLink?: string
  usageLimit?: number
  userLimit?: number
  conditions?: string
  isActive: boolean
  order: number
}

interface HomepageSetting {
  sectionName: string
  isEnabled: boolean
  autoPlay: number | null
  displayLimit: number | null
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string | null
}

// Helper function to get first image from product
const getProductImage = (product: Product): string | null => {
  if (!product.images) return null

  // If images is already an array, return the first element
  if (Array.isArray(product.images)) {
    return product.images.length > 0 ? product.images[0] : null
  }

  // If images is a string, try to parse it
  if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0]
      }
      // If parsing returns a single string URL
      if (typeof parsed === 'string' && parsed.startsWith('http')) {
        return parsed
      }
      // If parsing fails, return the raw string if it looks like a URL
      if (product.images.startsWith('http')) {
        return product.images
      }
    } catch {
      // If parsing fails, return the raw string if it looks like a URL
      if (product.images.startsWith('http')) {
        return product.images
      }
    }
  }

  return null
}

export default function HomepageManagementPage() {
  // State
  const [activeTab, setActiveTab] = useState('banners')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  // Marquee state
  const [marqueeText, setMarqueeText] = useState('')
  const [marqueeEnabled, setMarqueeEnabled] = useState(true)
  const [marqueeAnimationSpeed, setMarqueeAnimationSpeed] = useState(20)
  const [marqueeHeading, setMarqueeHeading] = useState('Special Offers')
  const [marqueeDescription, setMarqueeDescription] = useState('Don\'t miss out on our amazing deals')
  const [savingMarquee, setSavingMarquee] = useState(false)

  // Category Carousel state
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedCategoryGridIds, setSelectedCategoryGridIds] = useState<string[]>([])
  const [categoryGridEnabled, setCategoryGridEnabled] = useState(true)
  const [categoryGridHeading, setCategoryGridHeading] = useState('Shop by Category')
  const [categoryGridDescription, setCategoryGridDescription] = useState('Explore our wide range of categories')
  const [savingCategoryGrid, setSavingCategoryGrid] = useState(false)
  
  const [categoryCarouselEnabled, setCategoryCarouselEnabled] = useState(true)
  const [categoryCarouselAutoScroll, setCategoryCarouselAutoScroll] = useState(true)
  const [categoryCarouselScrollInterval, setCategoryCarouselScrollInterval] = useState(4000)
  const [categoryCarouselHeading, setCategoryCarouselHeading] = useState('Shop by Category')
  const [categoryCarouselDescription, setCategoryCarouselDescription] = useState('Explore our wide range of categories')
  const [savingCategoryCarousel, setSavingCategoryCarousel] = useState(false)

  // Featured Products state
  const [selectedFeaturedProductIds, setSelectedFeaturedProductIds] = useState<string[]>([])
  const [featuredProductsEnabled, setFeaturedProductsEnabled] = useState(true)
  const [featuredProductsHeading, setFeaturedProductsHeading] = useState('Featured Products')
  const [featuredProductsDescription, setFeaturedProductsDescription] = useState('Discover our handpicked selection of top products')
  const [savingFeaturedProducts, setSavingFeaturedProducts] = useState(false)

  // Mosaic Grid state
  const [selectedMosaicProductIds, setSelectedMosaicProductIds] = useState<string[]>([])
  const [mosaicGridEnabled, setMosaicGridEnabled] = useState(true)
  const [mosaicGridHeading, setMosaicGridHeading] = useState('Shop the Look')
  const [mosaicGridDescription, setMosaicGridDescription] = useState('Explore our curated collection of trending styles')
  const [savingMosaicGrid, setSavingMosaicGrid] = useState(false)

  // Brands state
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([])
  const [brandsEnabled, setBrandsEnabled] = useState(true)
  const [brandsAutoScroll, setBrandsAutoScroll] = useState(true)
  const [brandsScrollInterval, setBrandsScrollInterval] = useState(4000)
  const [brandsHeading, setBrandsHeading] = useState('Featured Brands')
  const [brandsDescription, setBrandsDescription] = useState('Discover top brands in our collection')
  const [savingBrands, setSavingBrands] = useState(false)

  // Banners state
  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [savingBanner, setSavingBanner] = useState(false)
  const [deletingBanner, setDeletingBanner] = useState<string | null>(null)
  const [reorderingBanner, setReorderingBanner] = useState<string | null>(null)
  const [togglingBannerActive, setTogglingBannerActive] = useState<string | null>(null)
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    image: '',
    mobileImage: '',
    buttonText: '',
    buttonLink: ''
  })

  // Stories state
  const [stories, setStories] = useState<Story[]>([])
  const [storyDialogOpen, setStoryDialogOpen] = useState(false)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [savingStory, setSavingStory] = useState(false)
  const [deletingStory, setDeletingStory] = useState<string | null>(null)
  const [reorderingStory, setReorderingStory] = useState<string | null>(null)
  const [togglingStoryActive, setTogglingStoryActive] = useState<string | null>(null)
  const [storyForm, setStoryForm] = useState({
    title: '',
    thumbnail: '',
    images: [] as string[]
  })

  // Reels state
  const [reels, setReels] = useState<Reel[]>([])
  const [reelDialogOpen, setReelDialogOpen] = useState(false)
  const [editingReel, setEditingReel] = useState<Reel | null>(null)
  const [savingReel, setSavingReel] = useState(false)
  const [deletingReel, setDeletingReel] = useState<string | null>(null)
  const [togglingReelActive, setTogglingReelActive] = useState<string | null>(null)
  const [reorderingReel, setReorderingReel] = useState<string | null>(null)
  const [reelForm, setReelForm] = useState({
    title: '',
    thumbnail: '',
    videoUrl: '',
    productIds: [] as string[]
  })

  // Reels Carousel state
  const [reelsCarouselEnabled, setReelsCarouselEnabled] = useState(true)
  const [reelsCarouselAutoScroll, setReelsCarouselAutoScroll] = useState(true)
  const [reelsCarouselAutoPlay, setReelsCarouselAutoPlay] = useState(3000)
  const [reelsCarouselHeading, setReelsCarouselHeading] = useState('Trending Reels')
  const [reelsCarouselDescription, setReelsCarouselDescription] = useState('Watch the latest video content')
  const [savingReelsCarousel, setSavingReelsCarousel] = useState(false)

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [savingPromotion, setSavingPromotion] = useState(false)
  const [deletingPromotion, setDeletingPromotion] = useState<string | null>(null)
  const [reorderingPromotion, setReorderingPromotion] = useState<string | null>(null)
  const [togglingPromotionActive, setTogglingPromotionActive] = useState<string | null>(null)
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    image: '',
    type: 'banner',
    promoCode: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    ctaText: '',
    ctaLink: '',
    usageLimit: '',
    userLimit: '',
    conditions: ''
  })
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Settings state
  const [settings, setSettings] = useState<Record<string, HomepageSetting>>({})
  const [savingSettings, setSavingSettings] = useState(false)

  // Fullscreen Video state
  const [videoUrl, setVideoUrl] = useState('')
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [videoHeading, setVideoHeading] = useState('Featured Video')
  const [videoDescription, setVideoDescription] = useState('Experience our exclusive video content')
  const [savingVideo, setSavingVideo] = useState(false)

  // Section Manager state
  const [sections, setSections] = useState<any[]>([])
  const [savingSections, setSavingSections] = useState(false)

  // Fetch functions
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products?limit=100')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories?limit=1000')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchCategoryGrid = async () => {
    try {
      const res = await fetch('/api/admin/homepage/category-grid')
      const data = await res.json() as any
      if (data.success) {
        setSelectedCategoryGridIds(data.data.categoryIds || [])
        setCategoryGridEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setCategoryGridHeading(data.data.heading || 'Shop by Category')
        setCategoryGridDescription(data.data.description || 'Explore our wide range of categories')
      }
    } catch (error) {
      console.error('Error fetching category grid settings:', error)
    }
  }

  const handleSaveCategoryGrid = async () => {
    setSavingCategoryGrid(true)
    try {
      const res = await fetch('/api/admin/homepage/category-grid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryIds: selectedCategoryGridIds,
          isEnabled: categoryGridEnabled,
          heading: categoryGridHeading,
          description: categoryGridDescription
        })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Category grid settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save category grid settings')
      }
    } catch (error) {
      console.error('Error saving category grid settings:', error)
      toast.error('Failed to save category grid settings')
    } finally {
      setSavingCategoryGrid(false)
    }
  }

  const fetchCategoryCarousel = async () => {
    try {
      const res = await fetch('/api/admin/homepage/category-carousel')
      const data = await res.json() as any
      if (data.success) {
        setSelectedCategoryIds(data.data.categoryIds || [])
        setCategoryCarouselEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setCategoryCarouselAutoScroll(data.data.autoScroll !== undefined ? data.data.autoScroll : true)
        setCategoryCarouselScrollInterval(data.data.scrollInterval || 4000)
        setCategoryCarouselHeading(data.data.heading || 'Shop by Category')
        setCategoryCarouselDescription(data.data.description || 'Explore our wide range of categories')
      }
    } catch (error) {
      console.error('Error fetching category carousel settings:', error)
    }
  }

  const handleSaveCategoryCarousel = async () => {
    setSavingCategoryCarousel(true)
    try {
      const res = await fetch('/api/admin/homepage/category-carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryIds: selectedCategoryIds,
          isEnabled: categoryCarouselEnabled,
          autoScroll: categoryCarouselAutoScroll,
          scrollInterval: categoryCarouselScrollInterval,
          heading: categoryCarouselHeading,
          description: categoryCarouselDescription
        })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Category carousel settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save category carousel settings')
      }
    } catch (error) {
      console.error('Error saving category carousel settings:', error)
      toast.error('Failed to save category carousel settings')
    } finally {
      setSavingCategoryCarousel(false)
    }
  }

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/admin/homepage/featured-products')
      const data = await res.json() as any
      if (data.success) {
        setSelectedFeaturedProductIds(data.data.productIds || [])
        setFeaturedProductsEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setFeaturedProductsHeading(data.data.heading || 'Featured Products')
        setFeaturedProductsDescription(data.data.description || 'Discover our handpicked selection of top products')
      }
    } catch (error) {
      console.error('Error fetching featured products settings:', error)
    }
  }

  const handleSaveFeaturedProducts = async () => {
    setSavingFeaturedProducts(true)
    try {
      const payload = {
        productIds: selectedFeaturedProductIds,
        isEnabled: featuredProductsEnabled,
        heading: featuredProductsHeading,
        description: featuredProductsDescription
      }
      console.log('[Featured Products] Sending payload:', payload)

      const res = await fetch('/api/admin/homepage/featured-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json() as any
      console.log('[Featured Products] Response:', data)

      if (data.success) {
        toast.success('Featured products saved successfully')
      } else {
        toast.error(data.error || 'Failed to save featured products')
        if (data.details) {
          console.error('Featured products error details:', data.details)
        }
      }
    } catch (error) {
      console.error('Error saving featured products settings:', error)
      toast.error('Failed to save featured products')
    } finally {
      setSavingFeaturedProducts(false)
    }
  }

  const fetchMosaicGrid = async () => {
    try {
      const res = await fetch('/api/admin/homepage/mosaic-grid')
      const data = await res.json() as any
      if (data.success) {
        setSelectedMosaicProductIds(data.data.productIds || [])
        setMosaicGridEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setMosaicGridHeading(data.data.heading || 'Shop the Look')
        setMosaicGridDescription(data.data.description || 'Explore our curated collection of trending styles')
      }
    } catch (error) {
      console.error('Error fetching mosaic grid settings:', error)
    }
  }

  const handleSaveMosaicGrid = async () => {
    setSavingMosaicGrid(true)
    try {
      const payload = {
        productIds: selectedMosaicProductIds,
        isEnabled: mosaicGridEnabled,
        heading: mosaicGridHeading,
        description: mosaicGridDescription
      }
      console.log('[Mosaic Grid] Sending payload:', payload)

      const res = await fetch('/api/admin/homepage/mosaic-grid', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json() as any
      console.log('[Mosaic Grid] Response:', data)

      if (data.success) {
        toast.success('Mosaic grid saved successfully')
      } else {
        toast.error(data.error || 'Failed to save mosaic grid')
        if (data.details) {
          console.error('Mosaic grid error details:', data.details)
        }
      }
    } catch (error) {
      console.error('Error saving mosaic grid settings:', error)
      toast.error('Failed to save mosaic grid')
    } finally {
      setSavingMosaicGrid(false)
    }
  }

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands?limit=100')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        setBrands(data.data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const fetchBrandsSettings = async () => {
    try {
      const res = await fetch('/api/admin/homepage/brands')
      const data = await res.json() as any
      if (data.success) {
        setSelectedBrandIds(data.data.brandIds || [])
        setBrandsEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setBrandsAutoScroll(data.data.autoScroll !== undefined ? data.data.autoScroll : true)
        setBrandsScrollInterval(data.data.scrollInterval || 4000)
        setBrandsHeading(data.data.heading || 'Featured Brands')
        setBrandsDescription(data.data.description || 'Discover top brands in our collection')
      }
    } catch (error) {
      console.error('Error fetching brands settings:', error)
    }
  }

  const handleSaveBrands = async () => {
    setSavingBrands(true)
    try {
      const payload = {
        brandIds: selectedBrandIds,
        isEnabled: brandsEnabled,
        autoScroll: brandsAutoScroll,
        scrollInterval: brandsScrollInterval,
        heading: brandsHeading,
        description: brandsDescription
      }

      const res = await fetch('/api/admin/homepage/brands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json() as any

      if (data.success) {
        toast.success('Brands saved successfully')
      } else {
        toast.error(data.error || 'Failed to save brands')
      }
    } catch (error) {
      console.error('Error saving brands settings:', error)
      toast.error('Failed to save brands')
    } finally {
      setSavingBrands(false)
    }
  }

  const fetchMarquee = async () => {
    try {
      const res = await fetch('/api/admin/homepage/marquee')
      const data = await res.json() as any
      if (data.success) {
        setMarqueeText(data.data.text || '')
        setMarqueeEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setMarqueeAnimationSpeed(data.data.animationSpeed || 20)
        setMarqueeHeading(data.data.heading || 'Special Offers')
        setMarqueeDescription(data.data.description || 'Don\'t miss out on our amazing deals')
      }
    } catch (error) {
      console.error('Error fetching marquee settings:', error)
    }
  }

  const handleSaveMarquee = async () => {
    setSavingMarquee(true)
    try {
      const res = await fetch('/api/admin/homepage/marquee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: marqueeText,
          isEnabled: marqueeEnabled,
          animationSpeed: marqueeAnimationSpeed,
          heading: marqueeHeading,
          description: marqueeDescription
        })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Marquee settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save marquee settings')
      }
    } catch (error) {
      console.error('Error saving marquee settings:', error)
      toast.error('Failed to save marquee settings')
    } finally {
      setSavingMarquee(false)
    }
  }

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        setBanners(data.data)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to fetch banners')
    }
  }

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/admin/stories')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        setStories(data.data)
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
      toast.error('Failed to fetch stories')
    }
  }

  const fetchReels = async () => {
    try {
      const res = await fetch('/api/admin/reels')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        setReels(data.data)
      }
    } catch (error) {
      console.error('Error fetching reels:', error)
      toast.error('Failed to fetch reels')
    }
  }

  const fetchReelsCarousel = async () => {
    try {
      const res = await fetch('/api/admin/homepage/reels-carousel')
      const data = await res.json() as any
      if (data.success) {
        setReelsCarouselEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setReelsCarouselAutoScroll(data.data.autoScroll !== undefined ? data.data.autoScroll : true)
        setReelsCarouselAutoPlay(data.data.autoPlay || 3000)
        setReelsCarouselHeading(data.data.heading || 'Trending Reels')
        setReelsCarouselDescription(data.data.description || 'Watch the latest video content')
      }
    } catch (error) {
      console.error('Error fetching reels carousel settings:', error)
    }
  }

  const handleSaveReelsCarousel = async () => {
    setSavingReelsCarousel(true)
    try {
      const res = await fetch('/api/admin/homepage/reels-carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: reelsCarouselEnabled,
          autoScroll: reelsCarouselAutoScroll,
          autoPlay: reelsCarouselAutoPlay,
          heading: reelsCarouselHeading,
          description: reelsCarouselDescription
        })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Reels carousel settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save reels carousel settings')
      }
    } catch (error) {
      console.error('Error saving reels carousel settings:', error)
      toast.error('Failed to save reels carousel settings')
    } finally {
      setSavingReelsCarousel(false)
    }
  }

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/admin/promotions')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        setPromotions(data.data)
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
      toast.error('Failed to fetch promotions')
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/homepage/settings')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.data)) {
        const settingsObj: Record<string, HomepageSetting> = {}
        data.data.forEach((setting: HomepageSetting) => {
          settingsObj[setting.sectionName] = setting
        })
        setSettings(settingsObj)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    }
  }

  const fetchFullscreenVideo = async () => {
    try {
      const res = await fetch('/api/admin/homepage/fullscreen-video')
      const data = await res.json() as any
      if (data.success) {
        setVideoUrl(data.data.videoUrl || '')
        setVideoEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        setVideoHeading(data.data.heading || 'Featured Video')
        setVideoDescription(data.data.description || 'Experience our exclusive video content')
      }
    } catch (error) {
      console.error('Error fetching fullscreen video settings:', error)
    }
  }

  const handleSaveFullscreenVideo = async () => {
    setSavingVideo(true)
    try {
      const res = await fetch('/api/admin/homepage/fullscreen-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          isEnabled: videoEnabled,
          heading: videoHeading,
          description: videoDescription
        })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Fullscreen video settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save fullscreen video settings')
      }
    } catch (error) {
      console.error('Error saving fullscreen video settings:', error)
      toast.error('Failed to save fullscreen video settings')
    } finally {
      setSavingVideo(false)
    }
  }

  const fetchSectionManager = async () => {
    try {
      const res = await fetch('/api/admin/homepage/section-manager')
      const data = await res.json() as any
      if (data.success) {
        setSections(data.data.sections || [])
      }
    } catch (error) {
      console.error('Error fetching section manager settings:', error)
    }
  }

  const handleSaveSectionManager = async () => {
    if (sections.length === 0) {
      toast.error('No sections to save')
      return
    }

    setSavingSections(true)
    try {
      console.log('[Section Manager] Saving sections:', sections)
      const res = await fetch('/api/admin/homepage/section-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      })
      const data = await res.json() as any
      console.log('[Section Manager] Response:', data)
      if (data.success) {
        toast.success('Section order saved successfully')
      } else {
        console.error('[Section Manager] Error:', data.error, data.details)
        toast.error(data.error || 'Failed to save section order')
        if (data.details) {
          console.error('[Section Manager] Error details:', data.details)
        }
      }
    } catch (error) {
      console.error('[Section Manager] Error saving section manager settings:', error)
      toast.error('Failed to save section order')
    } finally {
      setSavingSections(false)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchMarquee(),
          fetchCategories(),
          fetchCategoryGrid(),
          fetchCategoryCarousel(),
          fetchFeaturedProducts(),
          fetchMosaicGrid(),
          fetchBrands(),
          fetchBrandsSettings(),
          fetchBanners(),
          fetchStories(),
          fetchReels(),
          fetchReelsCarousel(),
          fetchPromotions(),
          fetchSettings(),
          fetchProducts(),
          fetchFullscreenVideo(),
          fetchSectionManager()
        ])
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Banner handlers
  const handleSaveBanner = async () => {
    setSavingBanner(true)
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners'
      const method = editingBanner ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm)
      })

      const data = await res.json() as any
      if (data.success) {
        toast.success(editingBanner ? 'Banner updated' : 'Banner created')
        setBannerDialogOpen(false)
        setEditingBanner(null)
        setBannerForm({ title: '', description: '', image: '', mobileImage: '', buttonText: '', buttonLink: '' })
        fetchBanners()
      } else {
        toast.error(data.error || 'Failed to save banner')
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error('Failed to save banner')
    } finally {
      setSavingBanner(false)
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    setDeletingBanner(id)
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Banner deleted')
        fetchBanners()
      } else {
        toast.error(data.error || 'Failed to delete banner')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    } finally {
      setDeletingBanner(null)
    }
  }

  const handleToggleBannerActive = async (banner: Banner) => {
    setTogglingBannerActive(banner.id)
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success(banner.isActive ? 'Banner disabled' : 'Banner enabled')
        fetchBanners()
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('Failed to toggle banner')
    } finally {
      setTogglingBannerActive(null)
    }
  }

  // Story handlers
  const handleSaveStory = async () => {
    setSavingStory(true)
    try {
      const url = editingStory ? `/api/admin/stories/${editingStory.id}` : '/api/admin/stories'
      const method = editingStory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyForm)
      })

      const data = await res.json() as any
      if (data.success) {
        toast.success(editingStory ? 'Story updated' : 'Story created')
        setStoryDialogOpen(false)
        setEditingStory(null)
        setStoryForm({ title: '', thumbnail: '', images: [] })
        fetchStories()
      } else {
        toast.error(data.error || 'Failed to save story')
      }
    } catch (error) {
      console.error('Error saving story:', error)
      toast.error('Failed to save story')
    } finally {
      setSavingStory(false)
    }
  }

  const handleDeleteStory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return

    setDeletingStory(id)
    try {
      const res = await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Story deleted')
        fetchStories()
      } else {
        toast.error(data.error || 'Failed to delete story')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error('Failed to delete story')
    } finally {
      setDeletingStory(null)
    }
  }

  const handleToggleStoryActive = async (story: Story) => {
    setTogglingStoryActive(story.id)
    try {
      const res = await fetch(`/api/admin/stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !story.isActive })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success(story.isActive ? 'Story disabled' : 'Story enabled')
        fetchStories()
      }
    } catch (error) {
      console.error('Error toggling story:', error)
      toast.error('Failed to toggle story')
    } finally {
      setTogglingStoryActive(null)
    }
  }

  // Reel handlers
  const handleSaveReel = async () => {
    setSavingReel(true)
    try {
      const url = editingReel ? `/api/admin/reels/${editingReel.id}` : '/api/admin/reels'
      const method = editingReel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reelForm)
      })

      const data = await res.json() as any
      if (data.success) {
        toast.success(editingReel ? 'Reel updated' : 'Reel created')
        setReelDialogOpen(false)
        setEditingReel(null)
        setReelForm({ title: '', thumbnail: '', videoUrl: '', productIds: [] })
        fetchReels()
      } else {
        toast.error(data.error || 'Failed to save reel')
      }
    } catch (error) {
      console.error('Error saving reel:', error)
      toast.error('Failed to save reel')
    } finally {
      setSavingReel(false)
    }
  }

  const handleDeleteReel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return

    setDeletingReel(id)
    try {
      const res = await fetch(`/api/admin/reels/${id}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Reel deleted')
        fetchReels()
      } else {
        toast.error(data.error || 'Failed to delete reel')
      }
    } catch (error) {
      console.error('Error deleting reel:', error)
      toast.error('Failed to delete reel')
    } finally {
      setDeletingReel(null)
    }
  }

  const handleToggleReelActive = async (reel: Reel) => {
    setTogglingReelActive(reel.id)
    try {
      const res = await fetch(`/api/admin/reels/${reel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !reel.isActive })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success(reel.isActive ? 'Reel disabled' : 'Reel enabled')
        fetchReels()
      }
    } catch (error) {
      console.error('Error toggling reel:', error)
      toast.error('Failed to toggle reel')
    } finally {
      setTogglingReelActive(null)
    }
  }

  // Validation helper function
  const validatePromotionForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Title is required
    if (!promotionForm.title || promotionForm.title.trim().length === 0) {
      errors.title = 'Promotion title is required'
    } else if (promotionForm.title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters'
    }
    
    // Promo code validation (if provided)
    if (promotionForm.promoCode && promotionForm.promoCode.trim().length > 0) {
      const promoCode = promotionForm.promoCode.trim()
      if (!/^[A-Z0-9-]+$/.test(promoCode)) {
        errors.promoCode = 'Promo code can only contain letters, numbers, and hyphens'
      } else if (promoCode.length < 3) {
        errors.promoCode = 'Promo code must be at least 3 characters'
      } else if (promoCode.length > 50) {
        errors.promoCode = 'Promo code must be less than 50 characters'
      }
    }
    
    // Discount value validation (if provided)
    if (promotionForm.discountValue && promotionForm.discountValue.trim().length > 0) {
      const value = parseFloat(promotionForm.discountValue)
      if (isNaN(value) || value < 0) {
        errors.discountValue = 'Discount value must be a positive number'
      } else if (promotionForm.discountType === 'percentage' && value > 100) {
        errors.discountValue = 'Percentage discount cannot exceed 100%'
      }
    }
    
    // Min order amount validation
    if (promotionForm.minOrderAmount && promotionForm.minOrderAmount.trim().length > 0) {
      const value = parseFloat(promotionForm.minOrderAmount)
      if (isNaN(value) || value < 0) {
        errors.minOrderAmount = 'Minimum order amount must be a positive number'
      }
    }
    
    // Max discount amount validation
    if (promotionForm.maxDiscountAmount && promotionForm.maxDiscountAmount.trim().length > 0) {
      const value = parseFloat(promotionForm.maxDiscountAmount)
      if (isNaN(value) || value < 0) {
        errors.maxDiscountAmount = 'Maximum discount amount must be a positive number'
      }
    }
    
    // Usage limit validation
    if (promotionForm.usageLimit && promotionForm.usageLimit.trim().length > 0) {
      const value = parseInt(promotionForm.usageLimit, 10)
      if (isNaN(value) || value < 0) {
        errors.usageLimit = 'Usage limit must be a positive number'
      }
    }
    
    // User limit validation
    if (promotionForm.userLimit && promotionForm.userLimit.trim().length > 0) {
      const value = parseInt(promotionForm.userLimit, 10)
      if (isNaN(value) || value < 0) {
        errors.userLimit = 'User limit must be a positive number'
      }
    }
    
    // Date validation
    if (promotionForm.startDate && promotionForm.endDate) {
      const startDate = new Date(promotionForm.startDate)
      const endDate = new Date(promotionForm.endDate)
      if (startDate >= endDate) {
        errors.startDate = 'Start date must be before end date'
        errors.endDate = 'End date must be after start date'
      }
    }
    
    // CTA Link validation (if provided)
    if (promotionForm.ctaLink && promotionForm.ctaLink.trim().length > 0) {
      const link = promotionForm.ctaLink.trim()
      if (!link.startsWith('/') && !link.startsWith('http://') && !link.startsWith('https://')) {
        errors.ctaLink = 'Link must start with / for internal pages or http:// / https:// for external links'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Promotion handlers
  const handleSavePromotion = async () => {
    if (!validatePromotionForm()) {
      toast.error('Please fix the validation errors before saving')
      return
    }
    setSavingPromotion(true)
    try {
      console.log('[Promotions] Form data:', promotionForm)

      const url = editingPromotion ? `/api/admin/promotions/${editingPromotion.id}` : '/api/admin/promotions'
      const method = editingPromotion ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionForm)
      })

      const data = await res.json() as any
      console.log('[Promotions] Response:', data)

      if (data.success) {
        toast.success(editingPromotion ? 'Promotion updated' : 'Promotion created')
        setPromotionDialogOpen(false)
        setEditingPromotion(null)
        setPromotionForm({
          title: '',
          description: '',
          image: '',
          type: 'banner',
          promoCode: '',
          discountType: 'percentage',
          discountValue: '',
          minOrderAmount: '',
          maxDiscountAmount: '',
          startDate: '',
          endDate: '',
          ctaText: '',
          ctaLink: '',
          usageLimit: '',
          userLimit: '',
          conditions: ''
        })
        setValidationErrors({})
        fetchPromotions()
      } else {
        toast.error(data.error || 'Failed to save promotion')
        if (data.details) {
          console.error('Promotion error details:', data.details)
        }
      }
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Failed to save promotion')
    } finally {
      setSavingPromotion(false)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return

    setDeletingPromotion(id)
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Promotion deleted')
        fetchPromotions()
      } else {
        toast.error(data.error || 'Failed to delete promotion')
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Failed to delete promotion')
    } finally {
      setDeletingPromotion(null)
    }
  }

  const handleTogglePromotionActive = async (promotion: Promotion) => {
    setTogglingPromotionActive(promotion.id)
    try {
      const res = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promotion.isActive })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success(promotion.isActive ? 'Promotion disabled' : 'Promotion enabled')
        fetchPromotions()
      }
    } catch (error) {
      console.error('Error toggling promotion:', error)
      toast.error('Failed to toggle promotion')
    } finally {
      setTogglingPromotionActive(null)
    }
  }

  // Settings handlers
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/homepage/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: Object.values(settings) })
      })
      const data = await res.json() as any
      if (data.success) {
        toast.success('Settings saved successfully')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // Reorder handlers (simplified version)
  const handleMoveItem = async (type: 'banner' | 'story' | 'reel' | 'promotion', id: string, direction: 'up' | 'down') => {
    const items = type === 'banner' ? banners : type === 'story' ? stories : type === 'reel' ? reels : promotions
    const setItems = type === 'banner' ? setBanners : type === 'story' ? setStories : type === 'reel' ? setReels : setPromotions
    const setReordering = type === 'banner' ? setReorderingBanner : type === 'story' ? setReorderingStory : type === 'reel' ? setReorderingReel : setReorderingPromotion
    const apiPath = `/api/admin/${type}s/${id}/reorder`

    const index = items.findIndex(item => item.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    setReordering(id)

    const newItems = [...items]
    const temp = newItems[index].order
    newItems[index].order = newItems[newIndex].order
    newItems[newIndex].order = temp
    newItems.sort((a, b) => a.order - b.order)

    setItems(newItems as any)

    try {
      await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newItems[index].order })
      })
    } catch (error) {
      console.error('Error reordering:', error)
      toast.error('Failed to reorder item')
      fetchBanners()
      fetchStories()
      fetchReels()
      fetchPromotions()
    } finally {
      setReordering(null)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Homepage Management</h1>
        <p className="text-gray-600">Manage all homepage content including banners, stories, reels, and promotions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white border-b pb-2">
          <TabsList className="inline-flex w-full flex-wrap justify-start gap-1.5 bg-transparent h-auto p-0 border-0">
            {/* First row of tabs */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              <TabsTrigger value="section-manager" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Section Manager</TabsTrigger>
              <TabsTrigger value="marquee" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Marquee</TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Category Grid</TabsTrigger>
              <TabsTrigger value="category-carousel" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Category Carousel</TabsTrigger>
              <TabsTrigger value="featured-products" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Featured</TabsTrigger>
              <TabsTrigger value="mosaic-grid" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Mosaic</TabsTrigger>
            </div>
            {/* Second row of tabs */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto md:ml-1.5">
              <TabsTrigger value="brands" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Brands</TabsTrigger>
              <TabsTrigger value="fullscreen-video" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Video</TabsTrigger>
              <TabsTrigger value="banners" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Banners</TabsTrigger>
              <TabsTrigger value="stories" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Stories</TabsTrigger>
              <TabsTrigger value="reels" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Reels</TabsTrigger>
              <TabsTrigger value="promotions" className="whitespace-nowrap px-3 py-2 text-sm data-[state=active]:bg-pink-600 data-[state=active]:text-white">Promotions</TabsTrigger>
            </div>
          </TabsList>
        </div>

        {/* Marquee Tab */}
        <TabsContent value="marquee" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Section Marquee</h2>
            <Button onClick={handleSaveMarquee} disabled={savingMarquee}>
              {savingMarquee ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Marquee
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Marquee Settings</CardTitle>
              <CardDescription>Configure the scrolling text that appears below the banner carousel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="marquee-heading">Heading</Label>
                <Input
                  id="marquee-heading"
                  value={marqueeHeading}
                  onChange={(e) => setMarqueeHeading(e.target.value)}
                  placeholder="Special Offers"
                  className="mt-2"
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Section heading (max 200 characters)
                </p>
              </div>

              <div>
                <Label htmlFor="marquee-description">Description</Label>
                <Textarea
                  id="marquee-description"
                  value={marqueeDescription}
                  onChange={(e) => setMarqueeDescription(e.target.value)}
                  placeholder="Don't miss out on our amazing deals"
                  rows={2}
                  className="mt-2"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Section description (max 500 characters)
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="marquee-enabled">Enable Marquee</Label>
                <Switch
                  id="marquee-enabled"
                  checked={marqueeEnabled}
                  onCheckedChange={setMarqueeEnabled}
                />
              </div>

              <div>
                <Label htmlFor="marquee-text">Marquee Text</Label>
                <Textarea
                  id="marquee-text"
                  value={marqueeText}
                  onChange={(e) => setMarqueeText(e.target.value)}
                  placeholder="FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE"
                  rows={3}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use the | character to separate different messages
                </p>
              </div>

              <div>
                <Label htmlFor="animation-speed">Animation Speed ({marqueeAnimationSpeed} seconds)</Label>
                <Input
                  id="animation-speed"
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={marqueeAnimationSpeed}
                  onChange={(e) => setMarqueeAnimationSpeed(parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Lower values make the text scroll faster
                </p>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="text-sm text-pink-800 font-medium mb-2">Preview:</p>
                <div className="bg-pink-600 overflow-hidden py-2 rounded">
                  <div className="animate-marquee flex whitespace-nowrap" style={{ animation: `marquee ${marqueeAnimationSpeed}s linear infinite` }}>
                    {[...Array(6)].map((_, i) => (
                      <span key={i} className="text-white text-sm font-medium px-8">
                        {marqueeText || 'FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE'}
                      </span>
                    ))}
                  </div>
                  <style jsx>{`
                    @keyframes marquee {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                  `}</style>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Grid Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Category Grid Settings</h2>
            <Button onClick={handleSaveCategoryGrid} disabled={savingCategoryGrid}>
              {savingCategoryGrid ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Grid Section</CardTitle>
              <CardDescription>
                Select which categories to display on the homepage category grid. If no categories are selected, all active categories will be shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category-grid-enabled" className="flex items-center gap-2">
                    Enable Category Grid
                    <Switch
                      id="category-grid-enabled"
                      checked={categoryGridEnabled}
                      onCheckedChange={setCategoryGridEnabled}
                    />
                  </Label>
                </div>
                <div>
                  <Label htmlFor="category-grid-heading">Heading</Label>
                  <Input
                    id="category-grid-heading"
                    value={categoryGridHeading}
                    onChange={(e) => setCategoryGridHeading(e.target.value)}
                    placeholder="Shop by Category"
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section heading (max 200 characters)
                  </p>
                </div>
                <div>
                  <Label htmlFor="category-grid-description">Description</Label>
                  <Textarea
                    id="category-grid-description"
                    value={categoryGridDescription}
                    onChange={(e) => setCategoryGridDescription(e.target.value)}
                    placeholder="Explore our wide range of categories"
                    rows={3}
                    className="mt-2"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section description (max 500 characters)
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="category-grid-categories">Select Categories</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Choose which categories to display in the category grid section. Leave empty to show all active categories.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-[400px] overflow-y-auto border rounded-lg p-2">
                  {categories.length === 0 ? (
                    <div className="col-span-2 md:col-span-3 text-center py-8">
                      <Loader2 className="w-8 h-8 text-pink-600 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Loading categories...</p>
                    </div>
                  ) : (
                    categories.map((category: any) => (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-color cursor-pointer hover:bg-gray-50 ${
                          selectedCategoryGridIds.includes(category.id)
                            ? 'bg-pink-100 border-pink-600'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryGridIds.includes(category.id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            if (checked) {
                              setSelectedCategoryGridIds([...selectedCategoryGridIds, category.id])
                            } else {
                              setSelectedCategoryGridIds(selectedCategoryGridIds.filter(id => id !== category.id))
                            }
                          }}
                          className="sr-only"
                        />
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-12 h-16 object-cover rounded-md flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900 line-clamp-1">
                          {category.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Select categories you want to display in the homepage category grid</li>
                  <li>• Grid displays categories in a 4x2 layout</li>
                  <li>• Categories appear in their sort order</li>
                  <li>• Clicking a category navigates to its collection page</li>
                </ul>
              </div>

              <div>
                <Label className="text-base font-semibold">Section Management</Label>
                <p className="text-sm text-gray-600 mt-1">
                  To enable or disable this section, go to the <strong>Section Manager</strong> tab and toggle the "Categories" section.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  To manage categories (add, edit, delete, or reorder), go to <strong>Admin → Categories</strong>.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Difference from Category Carousel:</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Category Grid</strong> displays all categories at once in a static grid view, while
                  <strong> Category Carousel</strong> rotates through selected categories one at a time and
                  displays their products.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Carousel Tab */}
        <TabsContent value="category-carousel" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Category Carousel Settings</h2>
            <Button onClick={handleSaveCategoryCarousel} disabled={savingCategoryCarousel}>
              {savingCategoryCarousel ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Carousel
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>Customize the heading and description for this section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category-carousel-heading">Heading</Label>
                  <Input
                    id="category-carousel-heading"
                    value={categoryCarouselHeading}
                    onChange={(e) => setCategoryCarouselHeading(e.target.value)}
                    placeholder="Shop by Category"
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section heading (max 200 characters)
                  </p>
                </div>

                <div>
                  <Label htmlFor="category-carousel-description">Description</Label>
                  <Textarea
                    id="category-carousel-description"
                    value={categoryCarouselDescription}
                    onChange={(e) => setCategoryCarouselDescription(e.target.value)}
                    placeholder="Explore our wide range of categories"
                    rows={3}
                    className="mt-2"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section description (max 500 characters)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Label htmlFor="category-carousel-enabled">Enable Carousel</Label>
                  <Switch
                    id="category-carousel-enabled"
                    checked={categoryCarouselEnabled}
                    onCheckedChange={setCategoryCarouselEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="category-carousel-autoscroll">Auto-scroll</Label>
                  <Switch
                    id="category-carousel-autoscroll"
                    checked={categoryCarouselAutoScroll}
                    onCheckedChange={setCategoryCarouselAutoScroll}
                  />
                </div>

                <div>
                  <Label htmlFor="scroll-interval">Scroll Interval ({categoryCarouselScrollInterval / 1000}s)</Label>
                  <Input
                    id="scroll-interval"
                    type="range"
                    min="2000"
                    max="10000"
                    step="500"
                    value={categoryCarouselScrollInterval}
                    onChange={(e) => setCategoryCarouselScrollInterval(parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How often to auto-rotate to the next category
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Categories</CardTitle>
                <CardDescription>Choose which categories to feature in the carousel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No categories available</p>
                  ) : (
                    <div className="space-y-3">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedCategoryIds.includes(category.id)
                              ? 'bg-pink-50 border-pink-300'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategoryIds([...selectedCategoryIds, category.id])
                                } else {
                                  setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id))
                                }
                              }}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                            />
                            {category.image && (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-gray-500">{category.slug}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedCategoryIds.length} category{selectedCategoryIds.length !== 1 ? 'ies' : ''} selected
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Featured Products Tab */}
        <TabsContent value="featured-products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Featured Products</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="featured-enabled" className="text-sm">Enable</Label>
                <Switch
                  id="featured-enabled"
                  checked={featuredProductsEnabled}
                  onCheckedChange={setFeaturedProductsEnabled}
                />
              </div>
              <Button onClick={handleSaveFeaturedProducts} disabled={savingFeaturedProducts}>
                {savingFeaturedProducts ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Featured
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>Customize the heading and description for this section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="featured-heading">Heading</Label>
                  <Input
                    id="featured-heading"
                    value={featuredProductsHeading}
                    onChange={(e) => setFeaturedProductsHeading(e.target.value)}
                    placeholder="Featured Products"
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section heading (max 200 characters)
                  </p>
                </div>

                <div>
                  <Label htmlFor="featured-description">Description</Label>
                  <Textarea
                    id="featured-description"
                    value={featuredProductsDescription}
                    onChange={(e) => setFeaturedProductsDescription(e.target.value)}
                    placeholder="Discover our handpicked selection of top products"
                    rows={3}
                    className="mt-2"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section description (max 500 characters)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Featured Products</CardTitle>
                <CardDescription>Choose which products to highlight in the featured collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No products available</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <label
                          key={product.id}
                          className={`block p-3 border rounded cursor-pointer transition-colors ${
                            selectedFeaturedProductIds.includes(product.id)
                              ? 'bg-pink-50 border-pink-300'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedFeaturedProductIds.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFeaturedProductIds([...selectedFeaturedProductIds, product.id])
                                } else {
                                  setSelectedFeaturedProductIds(selectedFeaturedProductIds.filter(id => id !== product.id))
                                }
                              }}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                            />
                            {getProductImage(product) && (
                              <img
                                src={getProductImage(product)!}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-sm text-pink-600 font-semibold">৳{product.price}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedFeaturedProductIds.length} product{selectedFeaturedProductIds.length !== 1 ? 's' : ''} selected
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mosaic Grid Tab */}
        <TabsContent value="mosaic-grid" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mosaic Grid</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="mosaic-enabled" className="text-sm">Enable</Label>
                <Switch
                  id="mosaic-enabled"
                  checked={mosaicGridEnabled}
                  onCheckedChange={setMosaicGridEnabled}
                />
              </div>
              <Button onClick={handleSaveMosaicGrid} disabled={savingMosaicGrid}>
                {savingMosaicGrid ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Mosaic
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>Customize the heading and description for this section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mosaic-heading">Heading</Label>
                  <Input
                    id="mosaic-heading"
                    value={mosaicGridHeading}
                    onChange={(e) => setMosaicGridHeading(e.target.value)}
                    placeholder="Shop the Look"
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section heading (max 200 characters)
                  </p>
                </div>

                <div>
                  <Label htmlFor="mosaic-description">Description</Label>
                  <Textarea
                    id="mosaic-description"
                    value={mosaicGridDescription}
                    onChange={(e) => setMosaicGridDescription(e.target.value)}
                    placeholder="Explore our curated collection of trending styles"
                    rows={3}
                    className="mt-2"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section description (max 500 characters)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Mosaic Products</CardTitle>
                <CardDescription>Choose which products to display in the mosaic grid (max 6)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No products available</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <label
                          key={product.id}
                          className={`block p-3 border rounded cursor-pointer transition-colors ${
                            selectedMosaicProductIds.includes(product.id)
                              ? 'bg-pink-50 border-pink-300'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedMosaicProductIds.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedMosaicProductIds.length < 6) {
                                    setSelectedMosaicProductIds([...selectedMosaicProductIds, product.id])
                                  } else {
                                    toast.error('Maximum 6 products allowed')
                                  }
                                } else {
                                  setSelectedMosaicProductIds(selectedMosaicProductIds.filter(id => id !== product.id))
                                }
                              }}
                              disabled={!selectedMosaicProductIds.includes(product.id) && selectedMosaicProductIds.length >= 6}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                            />
                            {getProductImage(product) && (
                              <img
                                src={getProductImage(product)!}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-sm text-pink-600 font-semibold">৳{product.price}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedMosaicProductIds.length} / 6 products selected
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Brand Carousel</h2>
            <Button onClick={handleSaveBrands} disabled={savingBrands}>
              {savingBrands ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Brands
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>Customize the heading and description for this section</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brands-heading">Heading</Label>
                  <Input
                    id="brands-heading"
                    value={brandsHeading}
                    onChange={(e) => setBrandsHeading(e.target.value)}
                    placeholder="Featured Brands"
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section heading (max 200 characters)
                  </p>
                </div>

                <div>
                  <Label htmlFor="brands-description">Description</Label>
                  <Textarea
                    id="brands-description"
                    value={brandsDescription}
                    onChange={(e) => setBrandsDescription(e.target.value)}
                    placeholder="Discover top brands in our collection"
                    rows={3}
                    className="mt-2"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Section description (max 500 characters)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Label htmlFor="brands-enabled">Enable Carousel</Label>
                  <Switch
                    id="brands-enabled"
                    checked={brandsEnabled}
                    onCheckedChange={setBrandsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="brands-autoscroll">Auto-scroll</Label>
                  <Switch
                    id="brands-autoscroll"
                    checked={brandsAutoScroll}
                    onCheckedChange={setBrandsAutoScroll}
                  />
                </div>

                <div>
                  <Label htmlFor="brands-scroll-interval">Scroll Interval ({brandsScrollInterval / 1000}s)</Label>
                  <Input
                    id="brands-scroll-interval"
                    type="range"
                    min="2000"
                    max="10000"
                    step="500"
                    value={brandsScrollInterval}
                    onChange={(e) => setBrandsScrollInterval(parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    How often to auto-rotate to the next brand
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Select Brands</CardTitle>
                <CardDescription>Choose which brands to feature in the carousel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  {brands.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No brands available</p>
                  ) : (
                    <div className="space-y-3">
                      {brands.map((brand) => (
                        <label
                          key={brand.id}
                          className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedBrandIds.includes(brand.id)
                              ? 'bg-pink-50 border-pink-300'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedBrandIds.includes(brand.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBrandIds([...selectedBrandIds, brand.id])
                                } else {
                                  setSelectedBrandIds(selectedBrandIds.filter(id => id !== brand.id))
                                }
                              }}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                            />
                            {brand.logo && (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-10 h-10 object-contain rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{brand.name}</p>
                              <p className="text-sm text-gray-500">{brand.slug}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedBrandIds.length} brand{selectedBrandIds.length !== 1 ? 's' : ''} selected
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Banners</h2>
            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBanner(null)
                  setBannerForm({ title: '', description: '', image: '', mobileImage: '', buttonText: '', buttonLink: '' })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden" aria-describedby="banner-dialog-description">
                <DialogHeader>
                  <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
                  <DialogDescription id="banner-dialog-description">
                    {editingBanner ? 'Update banner information' : 'Add a new banner to the homepage'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Banner title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      placeholder="Banner description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Desktop Image</Label>
                    <ImageUpload
                      images={bannerForm.image ? [bannerForm.image] : []}
                      onImagesChange={(urls) => setBannerForm({ ...bannerForm, image: urls[0] || '' })}
                    />
                  </div>
                  <div>
                    <Label>Mobile Image (Optional)</Label>
                    <ImageUpload
                      images={bannerForm.mobileImage ? [bannerForm.mobileImage] : []}
                      onImagesChange={(urls) => setBannerForm({ ...bannerForm, mobileImage: urls[0] || '' })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={bannerForm.buttonText}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                        placeholder="Shop Now"
                      />
                    </div>
                    <div>
                      <Label>Button Link</Label>
                      <Input
                        value={bannerForm.buttonLink}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                        placeholder="/shop"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveBanner} disabled={!bannerForm.title || !bannerForm.image || savingBanner}>
                    {savingBanner ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {editingBanner ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>{editingBanner ? 'Update' : 'Create'} Banner</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <Card key={banner.id} className={banner.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('banner', banner.id, 'up')}
                        disabled={index === 0 || reorderingBanner === banner.id}
                      >
                        {reorderingBanner === banner.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('banner', banner.id, 'down')}
                        disabled={index === banners.length - 1 || reorderingBanner === banner.id}
                      >
                        {reorderingBanner === banner.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="w-24 h-16 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                      {banner.image && (
                        <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{banner.title}</h3>
                      {banner.description && (
                        <p className="text-sm text-gray-600 truncate">{banner.description}</p>
                      )}
                      {banner.buttonText && (
                        <p className="text-sm text-pink-600">{banner.buttonText} →</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.isActive}
                        onCheckedChange={() => handleToggleBannerActive(banner)}
                        disabled={togglingBannerActive === banner.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBanner(banner)
                          setBannerForm({
                            title: banner.title,
                            description: banner.description || '',
                            image: banner.image,
                            mobileImage: banner.mobileImage || '',
                            buttonText: banner.buttonText || '',
                            buttonLink: banner.buttonLink || ''
                          })
                          setBannerDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                        disabled={deletingBanner === banner.id}
                      >
                        {deletingBanner === banner.id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {banners.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No banners found. Click "Add Banner" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stories</h2>
            <Dialog open={storyDialogOpen} onOpenChange={setStoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingStory(null)
                  setStoryForm({ title: '', thumbnail: '', images: [] })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden" aria-describedby="story-dialog-description">
                <DialogHeader>
                  <DialogTitle>{editingStory ? 'Edit Story' : 'Add Story'}</DialogTitle>
                  <DialogDescription id="story-dialog-description">
                    {editingStory ? 'Update story information' : 'Add a new story to the homepage carousel'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={storyForm.title}
                      onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                      placeholder="Story title"
                    />
                  </div>
                  <div>
                    <Label>Thumbnail</Label>
                    <ImageUpload
                      images={storyForm.thumbnail ? [storyForm.thumbnail] : []}
                      onImagesChange={(urls) => setStoryForm({ ...storyForm, thumbnail: urls[0] || '' })}
                    />
                  </div>
                  <div>
                    <Label>Images (Multiple)</Label>
                    <ImageUpload
                      images={storyForm.images}
                      onImagesChange={(urls) => setStoryForm({ ...storyForm, images: urls })}
                    />
                    {storyForm.images.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {storyForm.images.map((img, idx) => (
                          <div key={idx} className="w-16 h-16 rounded bg-gray-200 overflow-hidden relative">
                            <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 w-6 h-6 p-0"
                              onClick={() => setStoryForm({
                                ...storyForm,
                                images: storyForm.images.filter((_, i) => i !== idx)
                              })}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveStory} disabled={!storyForm.title || !storyForm.thumbnail || storyForm.images.length === 0 || savingStory}>
                    {savingStory ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {editingStory ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>{editingStory ? 'Update' : 'Create'} Story</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stories.map((story, index) => (
              <Card key={story.id} className={story.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('story', story.id, 'up')}
                        disabled={index === 0 || reorderingStory === story.id}
                      >
                        {reorderingStory === story.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('story', story.id, 'down')}
                        disabled={index === stories.length - 1 || reorderingStory === story.id}
                      >
                        {reorderingStory === story.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="aspect-square rounded-full overflow-hidden bg-gray-200 border-2 border-pink-500">
                      {story.thumbnail && (
                        <img src={story.thumbnail} alt={story.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-center truncate">{story.title}</h3>
                    <div className="flex items-center justify-between gap-1">
                      <Switch
                        checked={story.isActive}
                        onCheckedChange={() => handleToggleStoryActive(story)}
                        disabled={togglingStoryActive === story.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingStory(story)
                          setStoryForm({
                            title: story.title,
                            thumbnail: story.thumbnail,
                            images: story.images
                          })
                          setStoryDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStory(story.id)}
                        disabled={deletingStory === story.id}
                      >
                        {deletingStory === story.id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {stories.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No stories found. Click "Add Story" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reels Tab */}
        <TabsContent value="reels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Video Reels</h2>
            <Dialog open={reelDialogOpen} onOpenChange={setReelDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingReel(null)
                  setReelForm({ title: '', thumbnail: '', videoUrl: '', productIds: [] })
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden" aria-describedby="reel-dialog-description">
                <DialogHeader>
                  <DialogTitle>{editingReel ? 'Edit Reel' : 'Add Reel'}</DialogTitle>
                  <DialogDescription id="reel-dialog-description">
                    {editingReel ? 'Update reel information' : 'Add a new reel video to the homepage'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={reelForm.title}
                      onChange={(e) => setReelForm({ ...reelForm, title: e.target.value })}
                      placeholder="Reel title"
                    />
                  </div>
                  <div>
                    <Label>Thumbnail (Optional)</Label>
                    <ImageUpload
                      images={reelForm.thumbnail ? [reelForm.thumbnail] : []}
                      onImagesChange={(urls) => setReelForm({ ...reelForm, thumbnail: urls[0] || '' })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      If not provided, we'll automatically use the YouTube video thumbnail.
                    </p>
                  </div>
                  <div>
                    <Label>Video URL</Label>
                    <Input
                      value={reelForm.videoUrl}
                      onChange={(e) => setReelForm({ ...reelForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://www.youtube.com/shorts/VIDEO_ID"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Paste any YouTube URL (watch, shorts, or embed). We'll automatically convert it to the correct format.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="reel-products">Associated Products</Label>
                    <div
                      id="reel-products"
                      role="listbox"
                      aria-multiselectable="true"
                      aria-label="Associated products for this reel"
                      className="border rounded-md p-2 min-h-[100px] max-h-[200px] overflow-y-auto space-y-2"
                    >
                      {products.map(product => (
                        <label
                          key={product.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer block"
                        >
                          <input
                            type="checkbox"
                            checked={reelForm.productIds.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setReelForm({ ...reelForm, productIds: [...reelForm.productIds, product.id] })
                              } else {
                                setReelForm({ ...reelForm, productIds: reelForm.productIds.filter(id => id !== product.id) })
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                          />
                          <span className="text-sm">
                            {product.name} - ৳{product.price}
                          </span>
                        </label>
                      ))}
                      {products.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No products available</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1" id="reel-products-help">
                      Select products to associate with this reel ({reelForm.productIds.length} selected)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveReel} disabled={!reelForm.title || !reelForm.videoUrl || savingReel}>
                    {savingReel ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {editingReel ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>{editingReel ? 'Update' : 'Create'} Reel</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Carousel Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Section Content</CardTitle>
              <CardDescription>Customize the heading and description for this section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reels-carousel-heading">Heading</Label>
                <Input
                  id="reels-carousel-heading"
                  value={reelsCarouselHeading}
                  onChange={(e) => setReelsCarouselHeading(e.target.value)}
                  placeholder="Trending Reels"
                  className="mt-2"
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Section heading (max 200 characters)
                </p>
              </div>

              <div>
                <Label htmlFor="reels-carousel-description">Description</Label>
                <Textarea
                  id="reels-carousel-description"
                  value={reelsCarouselDescription}
                  onChange={(e) => setReelsCarouselDescription(e.target.value)}
                  placeholder="Watch the latest video content"
                  rows={2}
                  className="mt-2"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Section description (max 500 characters)
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="reels-carousel-enabled">Enable Carousel</Label>
                <Switch
                  id="reels-carousel-enabled"
                  checked={reelsCarouselEnabled}
                  onCheckedChange={setReelsCarouselEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reels-carousel-autoscroll">Auto-scroll</Label>
                <Switch
                  id="reels-carousel-autoscroll"
                  checked={reelsCarouselAutoScroll}
                  onCheckedChange={setReelsCarouselAutoScroll}
                />
              </div>

              <div>
                <Label htmlFor="reels-autoplay-interval">Autoplay Interval ({reelsCarouselAutoPlay / 1000}s)</Label>
                <Input
                  id="reels-autoplay-interval"
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={reelsCarouselAutoPlay}
                  onChange={(e) => setReelsCarouselAutoPlay(parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How often to auto-rotate to the next video
                </p>
              </div>

              <Button onClick={handleSaveReelsCarousel} disabled={savingReelsCarousel} className="w-full">
                {savingReelsCarousel ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Carousel Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {reels.map((reel, index) => (
              <Card key={reel.id} className={reel.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('reel', reel.id, 'up')}
                        disabled={index === 0 || reorderingReel === reel.id}
                      >
                        {reorderingReel === reel.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem('reel', reel.id, 'down')}
                        disabled={index === reels.length - 1 || reorderingReel === reel.id}
                      >
                        {reorderingReel === reel.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-200 relative">
                      {reel.thumbnail && (
                        <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                          <Video className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-center truncate">{reel.title}</h3>
                    <div className="flex items-center justify-between gap-1">
                      <Switch
                        checked={reel.isActive}
                        onCheckedChange={() => handleToggleReelActive(reel)}
                        disabled={togglingReelActive === reel.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReel(reel)
                          setReelForm({
                            title: reel.title,
                            thumbnail: reel.thumbnail,
                            videoUrl: reel.videoUrl,
                            productIds: reel.productIds
                          })
                          setReelDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReel(reel.id)}
                        disabled={deletingReel === reel.id}
                      >
                        {deletingReel === reel.id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reels.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No reels found. Click "Add Reel" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Promotions</h2>
            <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPromotion(null)
                  setPromotionForm({
                    title: '',
                    description: '',
                    image: '',
                    type: 'banner',
                    promoCode: '',
                    discountType: 'percentage',
                    discountValue: '',
                    minOrderAmount: '',
                    maxDiscountAmount: '',
                    startDate: '',
                    endDate: '',
                    ctaText: '',
                    ctaLink: '',
                    usageLimit: '',
                    userLimit: '',
                    conditions: ''
                  })
                  setValidationErrors({})
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden" aria-describedby="promotion-dialog-description">
                <DialogHeader>
                  <DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Add Promotion'}</DialogTitle>
                  <DialogDescription id="promotion-dialog-description">
                    {editingPromotion ? 'Update promotion information' : 'Add a new promotional card to the homepage'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="promotion-title">Title <span className="text-red-500">*</span></Label>
                      <Input
                        id="promotion-title"
                        value={promotionForm.title}
                        onChange={(e) => {
                          setPromotionForm({ ...promotionForm, title: e.target.value })
                          if (validationErrors.title) {
                            setValidationErrors({ ...validationErrors, title: '' })
                          }
                        }}
                        placeholder="Promotion title"
                        className={validationErrors.title ? 'border-red-500' : ''}
                      />
                      {validationErrors.title && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="promotion-description">Description <span className="text-gray-400">(Optional)</span></Label>
                      <Textarea
                        id="promotion-description"
                        value={promotionForm.description}
                        onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                        placeholder="Promotion description"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="promotion-image">Image <span className="text-red-500">*</span></Label>
                      <ImageUpload
                        images={promotionForm.image ? [promotionForm.image] : []}
                        onImagesChange={(urls) => {
                          setPromotionForm({ ...promotionForm, image: urls[0] || '' })
                          if (validationErrors.image) {
                            setValidationErrors({ ...validationErrors, image: '' })
                          }
                        }}
                      />
                      {validationErrors.image && (
                        <p className="text-sm text-red-500 mt-1">{validationErrors.image}</p>
                      )}
                    </div>
                  </div>

                  {/* Discount Settings */}
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Discount Settings <span className="text-gray-400">(Optional)</span></h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="promotion-promocode">Promo Code</Label>
                        <Input
                          id="promotion-promocode"
                          value={promotionForm.promoCode}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase()
                            setPromotionForm({ ...promotionForm, promoCode: value })
                            if (validationErrors.promoCode) {
                              setValidationErrors({ ...validationErrors, promoCode: '' })
                            }
                          }}
                          placeholder="SUMMER2024"
                          className={validationErrors.promoCode ? 'border-red-500' : ''}
                        />
                        {validationErrors.promoCode && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.promoCode}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Enter a unique code for customers to use</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-discounttype">Discount Type</Label>
                        <select
                          id="promotion-discounttype"
                          value={promotionForm.discountType}
                          onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value as 'percentage' | 'fixed' })}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-discountvalue">
                          Discount Value {promotionForm.discountType === 'percentage' ? '(%)' : '(Amount)'}
                        </Label>
                        <Input
                          id="promotion-discountvalue"
                          type="number"
                          step="0.01"
                          min="0"
                          max={promotionForm.discountType === 'percentage' ? 100 : undefined}
                          value={promotionForm.discountValue}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, discountValue: e.target.value })
                            if (validationErrors.discountValue) {
                              setValidationErrors({ ...validationErrors, discountValue: '' })
                            }
                          }}
                          placeholder={promotionForm.discountType === 'percentage' ? '10' : '100'}
                          className={validationErrors.discountValue ? 'border-red-500' : ''}
                        />
                        {validationErrors.discountValue && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.discountValue}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-minorder">Min Order Amount</Label>
                        <Input
                          id="promotion-minorder"
                          type="number"
                          step="0.01"
                          min="0"
                          value={promotionForm.minOrderAmount}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, minOrderAmount: e.target.value })
                            if (validationErrors.minOrderAmount) {
                              setValidationErrors({ ...validationErrors, minOrderAmount: '' })
                            }
                          }}
                          placeholder="500"
                          className={validationErrors.minOrderAmount ? 'border-red-500' : ''}
                        />
                        {validationErrors.minOrderAmount && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.minOrderAmount}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-maxdiscount">Max Discount Amount</Label>
                        <Input
                          id="promotion-maxdiscount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={promotionForm.maxDiscountAmount}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, maxDiscountAmount: e.target.value })
                            if (validationErrors.maxDiscountAmount) {
                              setValidationErrors({ ...validationErrors, maxDiscountAmount: '' })
                            }
                          }}
                          placeholder="1000"
                          className={validationErrors.maxDiscountAmount ? 'border-red-500' : ''}
                        />
                        {validationErrors.maxDiscountAmount && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.maxDiscountAmount}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Usage Settings */}
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Date & Usage Limits <span className="text-gray-400">(Optional)</span></h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="promotion-startdate">Start Date</Label>
                        <Input
                          id="promotion-startdate"
                          type="datetime-local"
                          value={promotionForm.startDate}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, startDate: e.target.value })
                            if (validationErrors.startDate || validationErrors.endDate) {
                              setValidationErrors({ ...validationErrors, startDate: '', endDate: '' })
                            }
                          }}
                          className={validationErrors.startDate ? 'border-red-500' : ''}
                        />
                        {validationErrors.startDate && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.startDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-enddate">End Date</Label>
                        <Input
                          id="promotion-enddate"
                          type="datetime-local"
                          value={promotionForm.endDate}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, endDate: e.target.value })
                            if (validationErrors.startDate || validationErrors.endDate) {
                              setValidationErrors({ ...validationErrors, startDate: '', endDate: '' })
                            }
                          }}
                          className={validationErrors.endDate ? 'border-red-500' : ''}
                        />
                        {validationErrors.endDate && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.endDate}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-usagelimit">Usage Limit</Label>
                        <Input
                          id="promotion-usagelimit"
                          type="number"
                          min="0"
                          value={promotionForm.usageLimit}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, usageLimit: e.target.value })
                            if (validationErrors.usageLimit) {
                              setValidationErrors({ ...validationErrors, usageLimit: '' })
                            }
                          }}
                          placeholder="100"
                          className={validationErrors.usageLimit ? 'border-red-500' : ''}
                        />
                        {validationErrors.usageLimit && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.usageLimit}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Total times this promotion can be used</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="promotion-userlimit">User Limit</Label>
                        <Input
                          id="promotion-userlimit"
                          type="number"
                          min="0"
                          value={promotionForm.userLimit}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, userLimit: e.target.value })
                            if (validationErrors.userLimit) {
                              setValidationErrors({ ...validationErrors, userLimit: '' })
                            }
                          }}
                          placeholder="1"
                          className={validationErrors.userLimit ? 'border-red-500' : ''}
                        />
                        {validationErrors.userLimit && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.userLimit}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Times each user can use this promotion</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Settings */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Call to Action <span className="text-gray-400">(Optional)</span></h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="promotion-ctatext">CTA Button Text</Label>
                        <Input
                          id="promotion-ctatext"
                          value={promotionForm.ctaText}
                          onChange={(e) => setPromotionForm({ ...promotionForm, ctaText: e.target.value })}
                          placeholder="Shop Now"
                        />
                      </div>
                      <div>
                        <Label htmlFor="promotion-ctalink">CTA Link</Label>
                        <Input
                          id="promotion-ctalink"
                          value={promotionForm.ctaLink}
                          onChange={(e) => {
                            setPromotionForm({ ...promotionForm, ctaLink: e.target.value })
                            if (validationErrors.ctaLink) {
                              setValidationErrors({ ...validationErrors, ctaLink: '' })
                            }
                          }}
                          placeholder="/shop"
                          className={validationErrors.ctaLink ? 'border-red-500' : ''}
                        />
                        {validationErrors.ctaLink && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.ctaLink}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Start with / for internal pages</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="promotion-conditions">Special Conditions</Label>
                      <Textarea
                        id="promotion-conditions"
                        value={promotionForm.conditions}
                        onChange={(e) => setPromotionForm({ ...promotionForm, conditions: e.target.value })}
                        placeholder="e.g., Not valid on sale items, Free shipping on orders above ৳500"
                        rows={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">Any special conditions or restrictions</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSavePromotion} disabled={savingPromotion || (!promotionForm.title || !promotionForm.image)}>
                    {savingPromotion ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {editingPromotion ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>{editingPromotion ? 'Update' : 'Create'} Promotion</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((promotion, index) => (
              <Card key={promotion.id} className={promotion.isActive ? '' : 'opacity-50'}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem('promotion', promotion.id, 'up')}
                          disabled={index === 0 || reorderingPromotion === promotion.id}
                        >
                          {reorderingPromotion === promotion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem('promotion', promotion.id, 'down')}
                          disabled={index === promotions.length - 1 || reorderingPromotion === promotion.id}
                        >
                          {reorderingPromotion === promotion.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <Switch
                        checked={promotion.isActive}
                        onCheckedChange={() => handleTogglePromotionActive(promotion)}
                        disabled={togglingPromotionActive === promotion.id}
                      />
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                      {promotion.image && (
                        <img src={promotion.image} alt={promotion.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{promotion.title}</h3>
                      {promotion.description && (
                        <p className="text-sm text-gray-600">{promotion.description}</p>
                      )}
                      {promotion.ctaText && (
                        <p className="text-sm text-pink-600 font-medium">{promotion.ctaText} →</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPromotion(promotion)
                          setPromotionForm({
                            title: promotion.title,
                            description: promotion.description || '',
                            image: promotion.image,
                            type: promotion.type || 'banner',
                            promoCode: promotion.promoCode || '',
                            discountType: promotion.discountType || 'percentage',
                            discountValue: promotion.discountValue ? String(promotion.discountValue) : '',
                            minOrderAmount: promotion.minOrderAmount ? String(promotion.minOrderAmount) : '',
                            maxDiscountAmount: promotion.maxDiscountAmount ? String(promotion.maxDiscountAmount) : '',
                            startDate: promotion.startDate ? promotion.startDate.substring(0, 16) : '',
                            endDate: promotion.endDate ? promotion.endDate.substring(0, 16) : '',
                            ctaText: promotion.ctaText || '',
                            ctaLink: promotion.ctaLink || '',
                            usageLimit: promotion.usageLimit ? String(promotion.usageLimit) : '',
                            userLimit: promotion.userLimit ? String(promotion.userLimit) : '',
                            conditions: promotion.conditions || ''
                          })
                          setValidationErrors({})
                          setPromotionDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePromotion(promotion.id)}
                        disabled={deletingPromotion === promotion.id}
                      >
                        {deletingPromotion === promotion.id ? (
                          <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {promotions.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No promotions found. Click "Add Promotion" to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Section Manager Tab */}
        <TabsContent value="section-manager" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Section Manager</h2>
              <p className="text-sm text-gray-600">Drag to reorder sections, toggle to enable/disable</p>
            </div>
            <Button onClick={handleSaveSectionManager} disabled={savingSections}>
              {savingSections ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Order
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                {sections.map((section: any, index: number) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                        <span className="text-sm font-medium text-gray-600 w-8">
                          {section.order}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.name}</h3>
                        <p className="text-xs text-gray-500">{section.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSections = [...sections]
                          const temp = newSections[index]
                          newSections[index] = newSections[index - 1]
                          newSections[index - 1] = temp
                          newSections.forEach((s, i) => s.order = i + 1)
                          setSections(newSections)
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSections = [...sections]
                          const temp = newSections[index]
                          newSections[index] = newSections[index + 1]
                          newSections[index + 1] = temp
                          newSections.forEach((s, i) => s.order = i + 1)
                          setSections(newSections)
                        }}
                        disabled={index === sections.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Switch
                        checked={section.enabled}
                        onCheckedChange={(checked) => {
                          const newSections = sections.map((s: any) =>
                            s.id === section.id ? { ...s, enabled: checked } : s
                          )
                          setSections(newSections)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fullscreen Video Tab */}
        <TabsContent value="fullscreen-video" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Fullscreen Video</h2>
            <Button onClick={handleSaveFullscreenVideo} disabled={savingVideo}>
              {savingVideo ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Video
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
              <CardDescription>Configure the fullscreen video section on the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video-heading">Heading</Label>
                <Input
                  id="video-heading"
                  value={videoHeading}
                  onChange={(e) => setVideoHeading(e.target.value)}
                  placeholder="Featured Video"
                  className="mt-2"
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Section heading (max 200 characters)
                </p>
              </div>

              <div>
                <Label htmlFor="video-description">Description</Label>
                <Textarea
                  id="video-description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Experience our exclusive video content"
                  rows={2}
                  className="mt-2"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Section description (max 500 characters)
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="video-enabled">Enable Video Section</Label>
                <Switch
                  id="video-enabled"
                  checked={videoEnabled}
                  onCheckedChange={setVideoEnabled}
                />
              </div>

              <div>
                <Label htmlFor="video-url">YouTube Embed URL</Label>
                <Input
                  id="video-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube-nocookie.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=VIDEO_ID&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the YouTube embed URL. Recommended format includes autoplay, mute, and loop parameters.
                </p>
              </div>

              {videoUrl && (
                <div className="border rounded-lg overflow-hidden" style={{ maxWidth: '640px', aspectRatio: '16/9' }}>
                  <iframe
                    src={videoUrl}
                    title="Video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Old Settings Tab (now merged into individual sections) */}
      </Tabs>
    </div>
  )
}
