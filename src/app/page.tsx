'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Share2, ShoppingCart, Star, Play, Search, User, Menu, Phone, Mail, Instagram, Facebook, Twitter, Youtube, Linkedin, ShoppingBag, Home as HomeIcon, LogOut, ChevronDown, Eye } from 'lucide-react'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuth } from '@/hooks/use-auth'
import { QuickViewModal } from '@/components/quick-view-modal'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { PriceDisplay } from '@/components/price-display'
import { shareContent } from '@/lib/share'

// Utility function to convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return ''

  // Handle YouTube Shorts URLs
  // https://www.youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/)
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}`
  }

  // Handle regular YouTube watch URLs
  // https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}`
  }

  // Handle YouTube embed URLs
  // https://www.youtube.com/embed/VIDEO_ID or https://www.youtube-nocookie.com/embed/VIDEO_ID
  const embedMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube-nocookie\.com|youtube\.com)\/embed\/([a-zA-Z0-9_-]+)/)
  if (embedMatch && embedMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}`
  }

  // Handle shortened YouTube URLs
  // https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}`
  }

  // If it's already in the correct format, return as is
  if (url.includes('youtube-nocookie.com/embed/') || url.includes('youtube.com/embed/')) {
    return url
  }

  // Return original URL if we can't parse it
  return url
}

// Utility function to extract YouTube video ID and generate thumbnail URL
const getYouTubeThumbnailUrl = (videoUrl: string): string => {
  if (!videoUrl) return ''

  // Try to extract video ID from various YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?(?:www\.)?(?:youtube-nocookie\.com|youtube\.com)\/embed\/([a-zA-Z0-9_-]+)/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = videoUrl.match(pattern)
    if (match && match[1]) {
      // Use high quality (hqdefault) thumbnail
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
    }
  }

  return ''
}



// Types
interface Banner {
  id: string
  title: string
  mobileImage: string
  desktopImage: string
  ctaButtons: Array<{ label: string; href: string; variant: 'primary' | 'secondary' }>
}

interface Story {
  id: string
  title: string
  thumbnail: string
  images: string[]
  videoUrl?: string
}

interface Category {
  id: string
  name: string
  slug: string
  image: string
  href: string
}

interface VideoReel {
  id: string
  thumbnail: string
  videoUrl: string
  title: string
  category?: string
  product: {
    id?: string
    slug?: string
    name: string
    price: number
    originalPrice?: number
    image: string
  }
  duration?: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  badge?: string
  category?: string
  categoryId?: string
  description?: string
  sizes?: string[]
  colors?: string[]
}

interface Promotion {
  id: string
  title: string
  subtitle: string
  image: string
  href: string
}

interface StickyCard {
  id: string
  title: string
  description: string
  image: string
  cta: string
  href: string
  reversed: boolean
}

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  description: string | null
  website: string | null
}

// 1. Hero Carousel Component
function HeroCarousel({ banners, autoPlay = 5000 }: { banners: Banner[], autoPlay?: number | null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextSlide = useCallback(() => {
    if (!isTransitioning && banners && banners.length > 0) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => (prev + 1) % banners.length)
      setTimeout(() => setIsTransitioning(false), 500)
    }
  }, [isTransitioning, banners?.length])

  const prevSlide = useCallback(() => {
    if (!isTransitioning && banners && banners.length > 0) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
      setTimeout(() => setIsTransitioning(false), 500)
    }
  }, [isTransitioning, banners?.length])

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      nextSlide()
    }, autoPlay)
    return () => clearInterval(timer)
  }, [nextSlide, autoPlay])

  return (
    <section className="relative w-full" style={{ minHeight: '378px' }}>
      <div className="relative w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners && banners.length > 0 && banners.map((banner, index) => (
            <div key={banner.id} className="flex-shrink-0 w-full relative">
              <picture className="block w-full h-full">
                <source media="(max-width: 767px)" srcSet={banner.mobileImage} width="580" height="700" />
                <source media="(min-width: 768px)" srcSet={banner.desktopImage} width="1400" height="450" />
                <img
                  src={banner.desktopImage}
                  alt={banner.title}
                  className="w-full h-auto object-cover"
                  width="1400"
                  height="450"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </picture>
              <div className="banner-cta-container absolute bottom-4 left-4 md:bottom-8 md:left-8 flex gap-2 md:gap-3">
                {banner.ctaButtons.map((cta, i) => (
                  <a
                    key={i}
                    href={cta.href}
                    className={`inline-block px-3 py-1.5 md:px-5 md:py-2 text-sm md:text-base font-medium rounded-full transition-colors ${
                      cta.variant === 'primary' 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-transparent text-white border border-white hover:bg-white/10'
                    }`}
                  >
                    {cta.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-lg transition-all z-10" aria-label="Previous">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
        </button>
        <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-lg transition-all z-10" aria-label="Next">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners && banners.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true)
                  setCurrentIndex(index)
                  setTimeout(() => setIsTransitioning(false), 500)
                }
              }}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 transition-all`}
              aria-label={`Page dot ${index + 1}`}
              aria-current={index === currentIndex ? 'step' : undefined}
            >
              <span className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="text-center py-2">
        <img
          src="https://medias.utsavfashion.com/media/wysiwyg/home/2020/0602/terms-conditions-white.png"
          alt="Terms & Conditions"
          className="inline-block cursor-pointer"
          width="129"
          height="19"
        />
      </div>
    </section>
  )
}

// 2. Section Marquee Component
function SectionMarquee({ sectionEnabled = true }: { sectionEnabled?: boolean }) {
  const [marqueeText, setMarqueeText] = useState("FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE")
  const [isEnabled, setIsEnabled] = useState(true)
  const [animationSpeed, setAnimationSpeed] = useState(20)
  const [heading, setHeading] = useState('Special Offers')
  const [description, setDescription] = useState('Don\'t miss out on our amazing deals')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMarquee = async () => {
      try {
        const res = await fetch('/api/homepage/marquee')
        const data = await res.json() as any
        if (data.success) {
          setMarqueeText(data.data.text || "FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE")
          setIsEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
          setAnimationSpeed(data.data.animationSpeed || 20)
          setHeading(data.data.heading || 'Special Offers')
          setDescription(data.data.description || 'Don\'t miss out on our amazing deals')
        }
      } catch (error) {
        console.error('Error fetching marquee settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarquee()
  }, [])

  // Don't render if disabled or loading
  if (loading || !isEnabled || !sectionEnabled) {
    return null
  }

  return (
    <section className="bg-pink-600 overflow-hidden py-3">
      <div className="animate-marquee flex whitespace-nowrap" style={{ animation: `marquee ${animationSpeed}s linear infinite` }}>
        {[...Array(6)].map((_, i) => (
          <span key={i} className="text-white text-sm md:text-base font-medium px-8">
            {marqueeText}
          </span>
        ))}
      </div>
    </section>
  )
}

// 3. Stories Component (Whatmore widget - SEPARATE)
function Stories({ stories, autoPlay = 4000 }: { stories: Story[], autoPlay?: number | null }) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<any>(null)
  const videoEndedRef = useRef(false)

  const openStory = (story: Story, index: number) => {
    setSelectedStory(story)
    setCurrentStoryIndex(index)
    setCurrentImageIndex(0)
    setProgress(0)
    videoEndedRef.current = false
  }

  const closeStory = () => {
    setSelectedStory(null)
    setCurrentImageIndex(0)
    setProgress(0)
    setCurrentStoryIndex(0)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }
  }

  const nextStory = () => {
    if (!stories || currentStoryIndex < stories.length - 1) {
      const nextIndex = currentStoryIndex + 1
      setCurrentStoryIndex(nextIndex)
      if (stories && stories[nextIndex]) {
        setSelectedStory(stories[nextIndex])
      }
      setCurrentImageIndex(0)
      setProgress(0)
      videoEndedRef.current = false
    } else {
      closeStory()
    }
  }

  const prevStory = () => {
    if (!stories || currentStoryIndex > 0) {
      const prevIndex = currentStoryIndex - 1
      setCurrentStoryIndex(prevIndex)
      if (stories && stories[prevIndex]) {
        setSelectedStory(stories[prevIndex])
      }
      setCurrentImageIndex(0)
      setProgress(0)
      videoEndedRef.current = false
    }
  }

  const nextImage = () => {
    if (selectedStory && Array.isArray(selectedStory.images) && currentImageIndex < selectedStory.images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1)
      setProgress(0)
    } else {
      nextStory()
    }
  }

  // Load YouTube IFrame Player API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  useEffect(() => {
    if (selectedStory) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [selectedStory])

  useEffect(() => {
    if (selectedStory) {
      // Clear any existing timers
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
      videoEndedRef.current = false

      // For YouTube videos, set up player with onStateChange listener
      if (selectedStory.videoUrl) {
        const urlParts = selectedStory.videoUrl.split('/embed/');
        const videoId = urlParts.length > 1 ? urlParts[1] : urlParts[0];

        const onPlayerReady = (event: any) => {
          event.target.playVideo()
        }

        const onPlayerStateChange = (event: any) => {
          const YT = (window as any).YT
          if (event.data === YT.PlayerState.PLAYING) {
            // Video started playing
            setProgress(0)
            
            // Start progress simulation
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 100) {
                  return 100
                }
                return prev + 1
              })
            }, 300) // Update every 300ms
          } else if (event.data === YT.PlayerState.ENDED) {
            // Video ended - auto-advance
            videoEndedRef.current = true
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
            setProgress(100)
            setTimeout(() => {
              nextStory()
            }, 500)
          } else if (event.data === YT.PlayerState.PAUSED) {
            // Video paused - stop progress
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
          }
        }

        // Create player
        if ((window as any).YT && (window as any).YT.Player) {
          if (playerRef.current) {
            playerRef.current.destroy()
          }
          
          playerRef.current = new (window as any).YT.Player(`youtube-player-${selectedStory.id}`, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange
            }
          })
        }
      } else {
        // For image stories, use progress bar
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              nextImage()
              return 0
            }
            return prev + 2.5
          })
        }, 100)
      }

      return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
      }
    }
  }, [selectedStory, currentImageIndex, currentStoryIndex])

  return (
    <>
      <section className="w-full py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Trending Stories
        </h2>
        <div id="wmstories" className="wmstories" style={{ marginTop: '0px', marginBottom: '0px' }}>
          <div className="whatmore-base" style={{ minHeight: '0px' }}>
            <div className="whatmore-widget-container" style={{ minHeight: '0px', marginTop: '0px', marginBottom: '0px' }}>
              <div style={{ height: '100%' }}>
                <div className="whatmore-story-container" style={{ position: 'relative', width: '100%', height: 'fit-content' }}>
                  <div className="whatmore-story-horizontal-flex flex justify-start md:justify-center" style={{ flexFlow: 'row', height: 'fit-content', width: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {stories && stories.map((story, index) => (
                    <div
                      key={story.id}
                      onClick={() => openStory(story, index)}
                      className="whatmore-scale-on-tap flex flex-col justify-center items-center flex-shrink-0 cursor-pointer"
                      style={{ display: 'flex', flexFlow: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0, height: 'fit-content', width: '105.4px', margin: '10px' }}
                    >
                    <div style={{ display: 'flex', boxSizing: 'border-box', flexFlow: 'column', justifyContent: 'center', flexShrink: 0, height: 'fit-content', width: 'fit-content', borderRadius: '50%', boxShadow: 'rgba(253, 96, 54, 0.314) 0px 2px 1px 0px, rgba(253, 96, 54, 0.314) 0px -2px 1px 0px, rgba(253, 96, 54, 0.314) 2px 0px 1px 0px, rgba(253, 96, 54, 0.5) -2px 0px 1px 0px, rgba(253, 96, 54, 0.5) 2px -2px 1px 0px, rgba(253, 96, 54, 0.855) -2px 2px 1px 0px, rgba(253, 96, 54, 0.855) 2px 2px 1px 0px, rgba(253, 96, 54, 0.855) -2px -2px 1px 0px' }}>
                      <div className="whatmore-story-thumbnail-wrapper" style={{ flexShrink: 0, objectFit: 'cover', height: '105.4px', width: '105.4px', borderRadius: '50%', border: '3px solid white', backgroundColor: 'rgb(255, 25, 160)', overflow: 'hidden' }}>
                        <img
                          className="whatmore-story-thumbnail"
                          src={story.thumbnail}
                          alt={story.title}
                          loading="lazy"
                          style={{ objectFit: 'cover', width: '100%', height: '100%', backgroundColor: 'white' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexFlow: 'column', justifyContent: 'center', flexShrink: 0, height: 'fit-content', width: '100%', marginTop: '10px' }}>
                      <p className="wht-story-title wst-portrait text-center" style={{ color: '#000', fontFamily: '"Source Sans Pro", sans-serif', fontWeight: 'normal', lineHeight: '110%', margin: '0', padding: '0', overflow: 'hidden', textOverflow: 'ellipsis', width: 'auto', fontSize: '12.648px' }}>
                        {story.title}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
      {selectedStory && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button onClick={closeStory} className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 rounded-full p-2 transition-colors" aria-label="Close story">
            <X className="w-6 h-6" />
          </button>
          
          {/* Story Navigation Buttons */}
          <button
            onClick={prevStory}
            disabled={currentStoryIndex === 0}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all ${
              currentStoryIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white'
            }`}
            aria-label="Previous story"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={nextStory}
            disabled={!stories || currentStoryIndex === stories.length - 1}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all ${
              !stories || currentStoryIndex === stories.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white'
            }`}
            aria-label="Next story"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Progress Bar */}
          <div className="absolute top-4 left-4 right-20 flex gap-1 z-20">
            {selectedStory.videoUrl ? (
              <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
              </div>
            ) : (
              Array.isArray(selectedStory.images) && selectedStory.images.map((_, index) => (
                <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all" style={{ width: index < currentImageIndex ? '100%' : index === currentImageIndex ? `${progress}%` : '0%' }} />
                </div>
              ))
            )}
          </div>
          
          {/* Story Counter */}
          <div className="absolute top-4 right-4 z-20 text-white/70 text-xs bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
            {stories ? `${currentStoryIndex + 1} / ${stories.length}` : '1 / 1'}
          </div>
          
          <div className="relative w-full h-full md:h-[90vh] md:max-w-md bg-black">
            {selectedStory.videoUrl ? (
              <div id={`youtube-player-${selectedStory.id}`} className="w-full h-full" />
            ) : (
              <div className="relative w-full h-full md:h-[90vh] md:max-w-md bg-black flex items-center justify-center" onClick={nextImage}>
                <img 
                  src={selectedStory.images && selectedStory.images[currentImageIndex] ? selectedStory.images[currentImageIndex] : selectedStory.thumbnail} 
                  alt={selectedStory.title} 
                  className="w-full h-full object-contain md:object-cover" 
                  loading="eager" 
                />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pointer-events-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={selectedStory.thumbnail} alt="" role="presentation" className="w-full h-full object-cover" width="40" height="40" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selectedStory.title}</p>
                  <p className="text-white/70 text-xs">2h ago</p>
                </div>
              </div>
              <p className="text-white/90 text-sm">Check out our latest collection! ✨</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 4b. Category Carousel with Products Component
function CategoryCarousel({ allCategories, products, sectionEnabled = true }: { allCategories: Category[]; products: Product[]; sectionEnabled?: boolean }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [scrollInterval, setScrollInterval] = useState(4000)
  const [heading, setHeading] = useState('Shop by Category')
  const [description, setDescription] = useState('Explore our wide range of categories')
  const [loading, setLoading] = useState(true)
  const [isEnabled, setIsEnabled] = useState(true)

  // Fetch category carousel settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/homepage/category-carousel')
        const data = await res.json() as any
        if (data.success) {
          const selectedIds = data.data.categoryIds || []
          setIsEnabled(data.data.isEnabled !== false)
          setAutoScroll(data.data.autoScroll !== undefined ? data.data.autoScroll : true)
          setScrollInterval(data.data.scrollInterval || 4000)
          setHeading(data.data.heading || 'Shop by Category')
          setDescription(data.data.description || 'Explore our wide range of categories')

          // Filter categories based on selected IDs
          if (selectedIds.length > 0 && allCategories) {
            const filtered = allCategories.filter(cat => selectedIds.includes(cat.id))
            setCategories(filtered)
          } else {
            // If no categories selected, show all as fallback
            setCategories(allCategories || [])
          }
        }
      } catch (error) {
        console.error('Error fetching category carousel settings:', error)
        // On error, show all categories as fallback
        setCategories(allCategories || [])
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [allCategories])

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || isPaused || loading || !categories || categories.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % categories.length)
    }, scrollInterval)

    return () => clearInterval(interval)
  }, [isPaused, categories?.length || 0, autoScroll, scrollInterval, loading])

  const nextSlide = () => {
    if (!categories || categories.length === 0) return
    setCurrentIndex(prev => (prev + 1) % categories.length)
  }

  const prevSlide = () => {
    if (!categories || categories.length === 0) return
    setCurrentIndex(prev => (prev - 1 + categories.length) % categories.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Don't render if disabled, loading, or no categories
  if (loading || !isEnabled || !sectionEnabled || !categories || categories.length === 0) return null

  const currentCategory = categories && categories[currentIndex]
  const categoryProducts = (products || [])
    .filter(p => currentCategory && p.categoryId === currentCategory.id)
    .filter((p, index, self) =>
      // Remove duplicates based on product ID
      index === self.findIndex((t) => t.id === p.id)
    )
    .slice(0, 4)

  const href = currentCategory?.href || `/collections/${currentCategory?.slug}`

  return (
    <section className="w-full py-6 md:py-8 bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Heading and Description */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            {heading}
          </h2>
          {description && (
            <p className="text-sm md:text-base text-gray-600">
              {description}
            </p>
          )}
        </div>

        {/* Category Name Carousel with Left/Right Controls */}
        <div
          className="relative bg-white rounded-2xl shadow-sm p-3 md:p-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Button */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors border border-gray-200"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Category Name Display */}
          <div className="text-center py-4 md:py-6">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
              {currentCategory?.name}
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-2">
              Swipe or use arrows to explore
            </p>
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors border border-gray-200"
            aria-label="Next category"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Category Dots Indicator */}
          <div className="flex justify-center gap-2 mt-2">
            {categories.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 transition-all"
                aria-label={`Go to category ${index + 1}`}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <span className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-pink-600 w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Active Category Products - Shown Below Carousel */}
        {categoryProducts.length > 0 && (
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categoryProducts.map(product => (
                <a
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm md:text-base font-medium text-gray-900 line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <PriceDisplay value={product.price} className="text-base md:text-lg font-bold text-pink-600" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        <div className="mt-6 text-center">
          <a
            href={href}
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-base md:text-lg font-medium hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2} />
            View All {currentCategory?.name}
          </a>
        </div>
      </div>
    </section>
  )
}

// 4. Category Menu Component
function Categories({ categories }: { categories: Category[] }) {
  return (
    <section className="w-full py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Shop by Category
        </h2>
        <div className="py-3 md:py-6" data-testid="category-menu">
          {/* Mobile View - Horizontal Scroll */}
          <div
            role="list"
            data-testid="category-menu-scroll"
            className="flex gap-3 overflow-x-auto pb-2 md:hidden -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((category, index) => (
              <a
                key={category.id}
                data-testid={`category-menu-item-${index}`}
                href={category.href}
                className="flex-shrink-0"
              >
                <div className="w-[90px] flex flex-col items-center group">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ width: '90px', height: '120px' }}
                      data-testid={`category-menu-item-${index}-image`}
                      width="90"
                      height="120"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className="text-center font-medium text-[11px] mt-2 leading-tight block w-[90px] transition-colors group-hover:text-pink-600"
                    data-testid={`category-menu-item-${index}-text`}
                    style={{
                      color: '#4b5563',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {category.name}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Desktop View - Grid with 4x2 layout */}
          <div
            role="list"
            data-testid="category-menu-desktop"
            className="hidden md:grid grid-cols-4 gap-4 md:gap-6"
          >
            {categories.map((category, index) => (
              <a
                key={category.id}
                data-testid={`category-menu-item-${index}`}
                href={category.href}
              >
                <div className="flex flex-col w-full group">
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      data-testid={`category-menu-item-${index}-image-desktop`}
                      style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <span
                    className="text-center font-medium text-[13px] mt-2 leading-tight block transition-colors group-hover:text-pink-600"
                    data-testid={`category-menu-item-${index}-text-desktop`}
                    style={{
                      color: '#4b5563',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {category.name}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// 4c. Brand Carousel Component
function BrandCarousel({ sectionEnabled = true }: { sectionEnabled?: boolean }) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [scrollInterval, setScrollInterval] = useState(4000)
  const [loading, setLoading] = useState(true)
  const [isEnabled, setIsEnabled] = useState(true)
  const [heading, setHeading] = useState('Featured Brands')
  const [description, setDescription] = useState('Discover top brands in our collection')

  // Fetch brand carousel settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, brandsRes] = await Promise.all([
          fetch('/api/homepage/brands'),
          fetch('/api/brands?featured=true')
        ])

        const settingsData = await settingsRes.json() as any
        const brandsData = await brandsRes.json() as any

        // Always update settings if successful
        if (settingsData.success) {
          setIsEnabled(settingsData.data.isEnabled !== undefined ? settingsData.data.isEnabled : true)
          setAutoScroll(settingsData.data.autoScroll !== undefined ? settingsData.data.autoScroll : true)
          setScrollInterval(settingsData.data.scrollInterval || 4000)
          setHeading(settingsData.data.heading || 'Featured Brands')
          setDescription(settingsData.data.description || 'Discover top brands in our collection')

          // If specific brand IDs are selected, filter brands
          if (settingsData.data.brandIds && settingsData.data.brandIds.length > 0 && brandsData.success) {
            const filtered = brandsData.data.filter((brand: Brand) =>
              settingsData.data.brandIds.includes(brand.id)
            )
            setBrands(filtered)
          } else if (brandsData.success) {
            // Otherwise, show all featured brands
            setBrands(brandsData.data || [])
          }
        } else {
          // If settings fail, use defaults and try to show featured brands
          setIsEnabled(true)
          setAutoScroll(true)
          setScrollInterval(4000)
          setHeading('Featured Brands')
          setDescription('Discover top brands in our collection')

          if (brandsData.success) {
            setBrands(brandsData.data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching brand carousel settings:', error)
        // On error, show all featured brands if available
        try {
          const brandsRes = await fetch('/api/brands?featured=true')
          const brandsData = await brandsRes.json() as any
          if (brandsData.success) {
            setBrands(brandsData.data || [])
          }
        } catch (e) {
          console.error('Error fetching featured brands:', e)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || isPaused || loading || !brands || brands.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % brands.length)
    }, scrollInterval)

    return () => clearInterval(interval)
  }, [isPaused, brands?.length || 0, autoScroll, scrollInterval, loading])

  const nextSlide = () => {
    if (!brands || brands.length === 0) return
    setCurrentIndex(prev => (prev + 1) % brands.length)
  }

  const prevSlide = () => {
    if (!brands || brands.length === 0) return
    setCurrentIndex(prev => (prev - 1 + brands.length) % brands.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Don't render if disabled, loading, or no brands
  if (loading || !isEnabled || !sectionEnabled || !brands || brands.length === 0) return null

  const currentBrand = brands[currentIndex]

  return (
    <section className="w-full py-8 md:py-12 bg-gradient-to-b from-pink-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Heading and Description */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            {heading}
          </h2>
          {description && (
            <p className="text-sm md:text-base text-gray-600">
              {description}
            </p>
          )}
        </div>

        <div
          className="relative bg-white rounded-2xl shadow-sm p-6 md:p-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Navigation Button */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors border border-gray-200"
            aria-label="Previous brand"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Brand Display */}
          <div className="text-center py-8 md:py-12 px-4">
            {currentBrand.logo && (
              <div className="mb-6 flex justify-center">
                <img
                  src={currentBrand.logo}
                  alt={currentBrand.name}
                  className="h-20 md:h-32 object-contain mx-auto"
                />
              </div>
            )}
            <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              {currentBrand.name}
            </h3>
            {currentBrand.description && (
              <p className="text-sm md:text-base text-gray-600 mb-4 max-w-2xl mx-auto">
                {currentBrand.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                {currentIndex + 1} of {brands.length}
              </span>
            </div>
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors border border-gray-200"
            aria-label="Next brand"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" strokeWidth={2.5} />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {brands.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 transition-all"
                aria-label={`Go to brand ${index + 1}`}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <span className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-pink-600 w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* View All Brands Button */}
        <div className="mt-6 text-center">
          <a
            href="/brands"
            className="inline-flex items-center gap-2 bg-white text-pink-600 border-2 border-pink-600 px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-base md:text-lg font-medium hover:bg-pink-50 transition-colors shadow-md hover:shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2} />
            View All Brands
          </a>
        </div>
      </div>
    </section>
  )
}

// 5. Modern 3D Shorts Carousel Component with Auto-scroll
function VideoReels({ reels, sectionEnabled = true }: { reels: VideoReel[]; sectionEnabled?: boolean }) {
  const [selectedReel, setSelectedReel] = useState<VideoReel | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [touchStartX, setTouchStartX] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Save and restore scroll position when modal opens/closes
  useEffect(() => {
    if (selectedReel) {
      // Save scroll position when modal opens
      setScrollPosition(window.pageYOffset)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore scroll position when modal closes
      document.body.style.overflow = ''
      window.scrollTo(0, scrollPosition)
    }
  }, [selectedReel, scrollPosition])

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    
    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext() // Swipe left - next
      } else {
        handlePrev() // Swipe right - previous
      }
    }
  }

  // Carousel settings state
  const [carouselSettings, setCarouselSettings] = useState({
    isEnabled: true,
    autoScroll: true,
    autoPlay: 3000,
    heading: 'Trending Reels',
    description: 'Watch the latest video content'
  })

  // Fetch carousel settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/homepage/reels-carousel')
        const data = await res.json() as any
        if (data.success) {
          const autoPlayValue = typeof data.data.autoPlay === 'number'
            ? Math.max(1000, data.data.autoPlay)
            : 3000

          setCarouselSettings({
            isEnabled: data.data.isEnabled !== undefined ? data.data.isEnabled : true,
            autoScroll: data.data.autoScroll !== undefined ? data.data.autoScroll : true,
            autoPlay: autoPlayValue,
            heading: data.data.heading || 'Trending Reels',
            description: data.data.description || 'Watch the latest video content'
          })
        }
      } catch (error) {
        console.error('Error fetching reels carousel settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const { addItem } = useCartStore()
  const router = useRouter()

  const handleAddToCart = (reel: VideoReel) => {
    addItem({
      id: reel.product.id || reel.id,
      slug: reel.product.slug || '',
      name: reel.product.name,
      price: reel.product.price,
      originalPrice: reel.product.originalPrice,
      image: reel.product.image,
      quantity: 1
    })
    toast.success('Added to cart!')
  }

  const handleViewDetails = (reel: VideoReel) => {
    if (reel.product.slug) {
      router.push(`/product/${reel.product.slug}`)
    }
  }

  const handleShareReel = async (reel: VideoReel) => {
    try {
      const result = await shareContent({
        title: reel.title,
        text: `Check out ${reel.product.name} - $${reel.product.price.toFixed(2)}`,
        url: reel.product.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${reel.product.slug}` : undefined
      })

      if (result === 'clipboard') {
        toast.success('Product link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing reel:', error)
      toast.error('Failed to share')
    }
  }

  const handlePrev = useCallback(() => {
    if (isTransitioning || !reels || reels.length === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + reels.length) % reels.length)
    setTimeout(() => setIsTransitioning(false), 400)
  }, [isTransitioning, reels?.length])

  const handleNext = useCallback(() => {
    if (isTransitioning || !reels || reels.length === 0) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % reels.length)
    setTimeout(() => setIsTransitioning(false), 400)
  }, [isTransitioning, reels?.length])

  // Auto-scroll effect
  useEffect(() => {
    if (!carouselSettings.autoScroll || isPaused || isTransitioning || !reels || reels.length === 0) return

    const interval = setInterval(() => {
      handleNext()
    }, carouselSettings.autoPlay)

    return () => clearInterval(interval)
  }, [isPaused, isTransitioning, carouselSettings.autoScroll, carouselSettings.autoPlay, reels?.length, handleNext])

  const handleCardClick = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 400)
  }

  if (!reels || reels.length === 0 || !carouselSettings.isEnabled || !sectionEnabled) return null

  const totalCards = reels.length

  // Calculate visible cards and positions
  const getVisibleCards = () => {
    const visibleCount = isMobile ? 3 : 8
    const result: Array<{ reel: VideoReel; actualIndex: number; visibleIndex: number }> = []

    // Show cards around the current index with wrap-around
    const halfVisible = Math.floor(visibleCount / 2)

    for (let i = -halfVisible; i <= halfVisible; i++) {
      const actualIndex = (currentIndex + i + totalCards) % totalCards
      const visibleIndex = i + halfVisible
      result.push({ reel: reels[actualIndex], actualIndex, visibleIndex })
    }

    return result
  }

  // Limit visible cards for mobile - ensure only 3 are shown
  const visibleCardsList = getVisibleCards().slice(0, isMobile ? 3 : undefined)

  const centerIndexInView = Math.floor(visibleCardsList.length / 2)

  const getCardStyle = (visibleIndex: number) => {
    const centerIndex = Math.floor(visibleCardsList.length / 2)
    const distanceFromCenter = Math.abs(visibleIndex - centerIndex)
    const maxDistance = Math.floor(visibleCardsList.length / 2)

    // Calculate scale - reduced scaling for mobile to keep all cards more visible
    // Mobile: Center 1.0, sides 0.85 (less reduction)
    // Desktop: Center 1.0, gradual decrease
    const scaleReduction = isMobile ? 0.15 : 0.35
    const scale = 1 - (distanceFromCenter / maxDistance) * scaleReduction

    // Calculate opacity - also gradual for ALL cards
    const opacity = 1 - (distanceFromCenter / maxDistance) * 0.4

    // Calculate translate X - adjusted spacing for mobile to fit 3 cards properly
    const spacing = isMobile ? 120 : 140
    const translateX = (visibleIndex - centerIndex) * spacing

    // Calculate card size - optimized for mobile
    const baseWidth = isMobile ? 170 : 280
    const baseHeight = isMobile ? 255 : 480
    const width = baseWidth * scale
    const height = baseHeight * scale

    // Z-index for proper layering - higher for center
    const zIndex = 30 - distanceFromCenter * 2

    return {
      transform: `translateX(${translateX}px) scale(${scale})`,
      opacity,
      zIndex,
      width: `${width}px`,
      height: `${height}px`,
    }
  }

  return (
    <>
      <section className="w-full py-12 md:py-20 bg-gradient-to-b from-[#F8F9FA] via-white to-[#F8F9FA] relative overflow-visible">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold text-[#1C1E21] mb-2">
                Video Shorts
              </h2>
              <p className="text-[#5F6368] text-sm md:text-base">
                Discover trending products in short videos
              </p>
            </div>
          </div>

          {/* 3D Carousel Container */}
          <div
            ref={carouselRef}
            className="relative w-full h-[300px] md:h-[600px] flex items-center justify-center overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left Navigation Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={handlePrev}
                disabled={isTransitioning}
                className="absolute left-2 md:left-6 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/95 hover:bg-white shadow-xl rounded-full flex items-center justify-center transition-all border border-gray-200 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed group"
                aria-label="Previous video"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-[#5F6368] group-hover:text-pink-600 transition-colors" strokeWidth={2.5} />
              </button>
            )}

            {/* Right Navigation Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={handleNext}
                disabled={isTransitioning}
                className="absolute right-2 md:right-6 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/95 hover:bg-white shadow-xl rounded-full flex items-center justify-center transition-all border border-gray-200 hover:border-pink-300 disabled:opacity-30 disabled:cursor-not-allowed group"
                aria-label="Next video"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#5F6368] group-hover:text-pink-600 transition-colors" strokeWidth={2.5} />
              </button>
            )}

            {/* Cards Container */}
            <div
              className="relative flex items-center justify-center w-full h-full"
              style={{
                perspective: '2000px',
              }}
            >
              {visibleCardsList.map(({ reel, actualIndex, visibleIndex }) => {
                const style = getCardStyle(visibleIndex)
                const isCenter = visibleIndex === centerIndexInView

                return (
                  <div
                    key={`${reel.id}-${visibleIndex}`}
                    onClick={() => handleCardClick(actualIndex)}
                    className="absolute bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all duration-400 ease-out hover:shadow-2xl"
                    style={style}
                  >
                    {/* Image/Video Area - Full height, no footer */}
                    <div
                      className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {/* Thumbnail - Use automatic YouTube thumbnail if not provided */}
                      <img
                        src={reel.thumbnail || getYouTubeThumbnailUrl(reel.videoUrl)}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Duration Badge */}
                      {reel.duration && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-lg backdrop-blur-sm">
                          {reel.duration}
                        </div>
                      )}

                      {/* Center Card - Enhanced Play Button */}
                      {isCenter && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedReel(reel)
                              }}
                              className="w-12 h-12 md:w-16 md:h-16 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
                              aria-label={`Play ${reel.title}`}
                            >
                              <Play
                                className="w-5 h-5 md:w-8 md:h-8 text-[#1C1E21] ml-1"
                                fill="currentColor"
                                strokeWidth={2}
                              />
                            </button>
                          </div>

                          {/* Title Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                            <h3 className="text-white font-semibold text-[11px] md:text-sm line-clamp-2 drop-shadow-lg">
                              {reel.title}
                            </h3>
                            {reel.category && (
                              <p className="text-white/80 text-[10px] md:text-xs mt-0.5 drop-shadow-md">
                                {reel.category}
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Non-center Cards - Play Icon on hover */}
                      {!isCenter && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                          <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Play
                              className="w-4 h-4 text-white ml-1"
                              fill="currentColor"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dots Indicator - Moved outside carousel container to be visible */}
          <div className="relative mt-8 flex justify-center gap-2 max-w-full overflow-x-auto px-4 scrollbar-hide" style={{ zIndex: 40 }}>
            {reels.map((_, index) => {
              const isActive = index === currentIndex
              return (
                <button
                  key={index}
                  onClick={() => !isTransitioning && handleCardClick(index)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 transition-all duration-300 flex-shrink-0"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className={`h-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                    isActive ? 'w-8 bg-pink-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`} />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Fullscreen Video Modal */}
      {selectedReel && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-2 sm:p-4 md:p-6">
          <button
            onClick={() => setSelectedReel(null)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 text-white hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all hover:scale-110"
            aria-label="Close video"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="relative w-full max-w-7xl h-full max-h-[95vh] md:max-h-[90vh] flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {/* Video Player Area */}
            <div className="w-full md:w-2/3 h-[60vh] md:h-full flex items-center justify-center">
              <div className="relative w-full h-full max-w-md md:max-w-none aspect-[9/16] md:aspect-auto bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
                {selectedReel.videoUrl ? (
                  <iframe
                    src={`${getYouTubeEmbedUrl(selectedReel.videoUrl)}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title={selectedReel.title}
                    className="w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <img
                      src={selectedReel.product.image}
                      alt={selectedReel.product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-10 text-center">
                      <Play className="w-16 h-16 sm:w-20 sm:h-20 text-white/90 mx-auto mb-3 sm:mb-4" fill="currentColor" />
                      <p className="text-white text-base sm:text-lg font-medium px-2">{selectedReel.product.name}</p>
                    </div>
                  </div>
                )}

                {/* Video Overlay Info - Mobile Only */}
                <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">{selectedReel.title}</h3>
                  <p className="text-white/90 text-sm font-semibold mb-2">{selectedReel.product.name}</p>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <PriceDisplay value={selectedReel.product.price} className="text-xl font-bold text-pink-400" />
                    {selectedReel.product.originalPrice && selectedReel.product.originalPrice > selectedReel.product.price && (
                      <PriceDisplay
                        value={selectedReel.product.originalPrice}
                        className="text-xs text-gray-400 line-through"
                      />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToCart(selectedReel)
                      }}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(selectedReel)
                      }}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm border border-white/20"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info Sidebar (Desktop Only) */}
            <div className="hidden md:flex w-1/3 h-full flex-col justify-center pl-0 md:pl-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 w-full max-w-sm mx-auto overflow-hidden flex flex-col">
                <div className="relative aspect-square mb-4 sm:mb-6 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                  <img
                    src={selectedReel.product.image}
                    alt={selectedReel.product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-white font-bold text-lg sm:text-xl mb-2 sm:mb-3 line-clamp-2">{selectedReel.product.name}</h4>
                <p className="text-white/60 text-sm mb-4 sm:mb-6 line-clamp-3 flex-shrink-0">
                  Beautiful and elegant design perfect for any occasion. Quality craftsmanship with attention to detail.
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-4 flex-shrink-0">
                  <PriceDisplay value={selectedReel.product.price} className="text-2xl sm:text-3xl font-bold text-pink-400" />
                  {selectedReel.product.originalPrice && selectedReel.product.originalPrice > selectedReel.product.price && (
                    <PriceDisplay
                      value={selectedReel.product.originalPrice}
                      className="text-sm text-gray-400 line-through"
                    />
                  )}
                </div>

                <div className="space-y-3 flex-shrink-0">
                  <button
                    onClick={() => handleAddToCart(selectedReel)}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 sm:px-6 py-3 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-pink-600/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={() => handleViewDetails(selectedReel)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 border border-white/20 text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>View Full Details</span>
                  </button>
                </div>

                <div className="flex justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20 flex-shrink-0">
                  <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleShareReel(selectedReel)}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 6. Fullscreen Video Component
function FullscreenVideo({ sectionEnabled = true }: { sectionEnabled?: boolean }) {
  const [videoUrl, setVideoUrl] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideoSettings = async () => {
      try {
        const res = await fetch('/api/homepage/fullscreen-video')
        const data = await res.json() as any
        if (data.success) {
          setVideoUrl(data.data.videoUrl || 'https://www.youtube-nocookie.com/embed/Gk-s0icT2CI?autoplay=1&mute=1&loop=1&playlist=Gk-s0icT2CI&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1')
          setIsEnabled(data.data.isEnabled !== undefined ? data.data.isEnabled : true)
        }
      } catch (error) {
        console.error('Error fetching fullscreen video settings:', error)
        // Use default video on error
        setVideoUrl('https://www.youtube-nocookie.com/embed/Gk-s0icT2CI?autoplay=1&mute=1&loop=1&playlist=Gk-s0icT2CI&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1')
        setIsEnabled(true)
      } finally {
        setLoading(false)
      }
    }

    fetchVideoSettings()
  }, [])

  if (loading || !isEnabled || !sectionEnabled || !videoUrl) {
    return null
  }

  return (
    <section className="relative w-full overflow-hidden bg-black py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative w-full mx-auto" style={{ maxWidth: '1080px', aspectRatio: '16/9' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={videoUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}

// 7. Featured Collection Carousel Component
function FeaturedCollection({ products, onQuickView, onAddToCart, heading, description }: { products: Product[]; onQuickView: (product: Product) => void; onAddToCart: (product: Product) => void; heading?: string; description?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsPerPage = 4
  const { addItem, getItemCount } = useCartStore()
  const cartCount = getItemCount()

  const productsArray = Array.isArray(products) ? products : []

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (productsArray.length === 0) {
    return null
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(Math.ceil(productsArray.length / itemsPerPage) - 1, prev + 1))
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    
    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext() // Swipe left - next
      } else {
        handlePrev() // Swipe right - previous
      }
    }
  }

  return (
    <section className="featured-collection container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{heading || 'Featured Products'}</h2>
        {description && <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>}
      </div>
      <div className="flex items-center justify-between mb-8">
        {!isMobile && (
          <div className="flex gap-2 ml-auto">
            <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50" disabled={currentIndex === 0}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNext} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50" disabled={currentIndex >= Math.ceil(productsArray.length / itemsPerPage) - 1}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {Array.from({ length: Math.ceil(productsArray.length / itemsPerPage) }).map((_, pageIndex) => (
            <div key={pageIndex} className="flex-shrink-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
              {productsArray.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((product) => (
                <div key={product.id} className="product-grid-item group">
                  <a href={`/product/${product.slug}`} className="block">
                    <div className="product__media relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                      {product.badge && (
                        <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          {product.badge}
                        </span>
                      )}
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    </div>
                  </a>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <a href={`/product/${product.slug}`} className="block">
                        <h3 className="product-grid-item__title font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {product.name}
                        </h3>
                      </a>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">({product.reviews})</span>
                      </div>
                      <div className="product-grid-item__price flex items-center gap-2">
                        <PriceDisplay value={product.price} originalPrice={product.originalPrice} className="flex items-center gap-2" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        onAddToCart(product)
                      }}
                      className="flex-shrink-0 bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors"
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 8. Mosaic Product Grid Component
function MosaicGrid({ products, onQuickView, onAddToCart, heading, description }: { products: Product[]; onQuickView: (product: Product) => void; onAddToCart: (product: Product) => void; heading?: string; description?: string }) {
  const productsArray = Array.isArray(products) ? products : []

  if (productsArray.length === 0) {
    return null
  }

  return (
    <section className="mosaic bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{heading || 'Shop the Look'}</h2>
          {description && <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>}
        </div>
        <div className="mosaic__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsArray.map((product, index) => (
            <div
              key={product.id}
              className={`product-card group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${index >= 4 ? 'hidden lg:block' : ''}`}
            >
              <a href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        onQuickView(product)
                      }}
                      className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                    >
                      Quick View
                    </button>
                  </div>
                </div>
              </a>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <a href={`/product/${product.slug}`} className="block">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </h3>
                    </a>
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriceDisplay value={product.price} originalPrice={product.originalPrice} />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      onAddToCart(product)
                    }}
                    className="flex-shrink-0 bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// 9. Promotion Row Component
function PromotionRow({ promotions }: { promotions: Promotion[] }) {
  // Fallback to showroom image if no promotions
  if (!promotions || promotions.length === 0) {
    return (
      <section className="w-full bg-white">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center tracking-wide">Showroom View</h2>
        </div>
        <img
          src="/upload/30mP-punit-8.jpg"
          alt="Showroom Collection"
          className="w-full h-auto"
        />
      </section>
    )
  }

  return (
    <section className="w-full bg-white">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center tracking-wide">Special Offers</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-8">
        {promotions.map((promotion) => (
          <a key={promotion.id} href={promotion.href} className="group relative overflow-hidden rounded-lg block">
            <img
              src={promotion.image}
              alt={promotion.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white text-2xl font-bold mb-2">{promotion.title}</h3>
              <p className="text-white/90 text-sm mb-4">{promotion.subtitle}</p>
              <span className="inline-block px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-full hover:bg-pink-700 transition-colors self-start">
                Shop Now
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

// 10. Unified Carousel Component (Single carousel with Wedding Collection & Summer Essentials)
interface CarouselSlide {
  id: string
  leftImage: string
  rightImage: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaHref: string
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 'wedding-1',
    leftImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rightImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849',
    title: 'Wedding Collection',
    subtitle: 'ROYAL BRIDAL WEAR',
    description: 'Discover our exclusive range of bridal wear and wedding accessories. Make your special day unforgettable with our timeless designs.',
    ctaText: 'SHOP WEDDING',
    ctaHref: '/wedding'
  },
  {
    id: 'wedding-2',
    leftImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849',
    rightImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849',
    title: 'Heritage Collection',
    subtitle: 'TRADITIONAL GRACE',
    description: 'Celebrating traditions with modern sophistication. Exquisite craftsmanship meets timeless elegance for your special moments.',
    ctaText: 'EXPLORE NOW',
    ctaHref: '/wedding'
  },
  {
    id: 'summer-1',
    leftImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849',
    rightImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849',
    title: 'Summer Essentials',
    subtitle: 'LIGHT & BREEZY',
    description: 'Beat the heat in style with our summer collection. From lightweight fabrics to vibrant colors, find your perfect summer wardrobe.',
    ctaText: 'SHOP SUMMER',
    ctaHref: '/collections/summer'
  },
  {
    id: 'summer-2',
    leftImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849',
    rightImage: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849',
    title: 'Fresh Summer Looks',
    subtitle: 'VIBRANT STYLES',
    description: 'Perfect pieces for your summer wardrobe. Stay cool and stylish all season long with our latest collection.',
    ctaText: 'DISCOVER NOW',
    ctaHref: '/collections/summer'
  }
]

// Unified Carousel Component with 3-column layout (Image - Text - Image)
function UnifiedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  
  const nextSlide = () => {
    if (carouselSlides.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % carouselSlides.length)
    setProgress(0)
  }

  const prevSlide = () => {
    if (carouselSlides.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)
    setProgress(0)
  }
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setProgress(0)
  }
  
  // Auto-play functionality
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide()
          return 0
        }
        return prev + 1
      })
    }, 50)
    
    return () => clearInterval(progressInterval)
  }, [currentIndex])
  
  const currentSlide = carouselSlides[currentIndex]
  
  return (
    <div className="w-full py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Featured Collections</h2>
          <p className="text-gray-600 text-sm md:text-base">Discover our exclusive wedding and summer collections</p>
        </div>
        
        {/* 3-Column Carousel: Image - Text - Image */}
        <div className="relative w-full">
          {/* Desktop View - 3 Column Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-6 mb-6">
            {/* Left Image */}
            <div className="relative overflow-hidden rounded-xl">
              <img 
                src={currentSlide.leftImage} 
                alt={`${currentSlide.title} left`} 
                className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            
            {/* Center Text Content */}
            <div className="flex flex-col justify-center items-center text-center px-4 md:px-8">
              <span className="text-pink-600 text-xs md:text-sm font-semibold tracking-widest mb-3">{currentSlide.subtitle}</span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{currentSlide.title}</h3>
              <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">{currentSlide.description}</p>
              <a 
                href={currentSlide.ctaHref} 
                className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 md:px-10 md:py-4 rounded-full font-semibold text-sm md:text-base transition-colors"
              >
                {currentSlide.ctaText}
              </a>
            </div>
            
            {/* Right Image */}
            <div className="relative overflow-hidden rounded-xl">
              <img 
                src={currentSlide.rightImage} 
                alt={`${currentSlide.title} right`} 
                className="w-full h-[400px] md:h-[500px] object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
          
          {/* Mobile View - Portrait Slider */}
          <div className="md:hidden relative">
            <div className="relative overflow-hidden rounded-xl aspect-[3/4]">
              <img 
                src={currentSlide.leftImage} 
                alt={`${currentSlide.title} mobile`} 
                className="w-full h-full object-cover"
              />
              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                <span className="text-pink-300 text-xs font-semibold tracking-widest mb-2">{currentSlide.subtitle}</span>
                <h3 className="text-white text-xl font-bold mb-2">{currentSlide.title}</h3>
                <p className="text-white/90 text-sm mb-3 line-clamp-2">{currentSlide.description}</p>
                <a 
                  href={currentSlide.ctaHref} 
                  className="inline-block bg-white text-gray-900 hover:bg-pink-600 hover:text-white px-6 py-2 rounded-full font-semibold text-sm transition-colors text-center"
                >
                  {currentSlide.ctaText}
                </a>
              </div>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {/* Prev Button */}
            <button 
              onClick={prevSlide}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-300 hover:border-pink-600 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Dots with Progress */}
            <div className="flex gap-3">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="relative w-12 md:w-16 h-1 md:h-1.5 bg-gray-300 rounded-full overflow-hidden"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div 
                    className="absolute inset-0 bg-pink-600 transition-all duration-100"
                    style={{ 
                      width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%' 
                    }}
                  />
                </button>
              ))}
            </div>
            
            {/* Next Button */}
            <button 
              onClick={nextSlide}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-300 hover:border-pink-600 hover:bg-pink-600 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 11. Sticky Image Cards Component (replaced with Unified Carousel)
function StickyImageCards() {
  return (
    <section className="py-12 bg-gray-50">
      <UnifiedCarousel />
    </section>
  )
}

// Types for dynamic homepage data
interface HomepageSettings {
  banners?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
  stories?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
  reels?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
  promotions?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
}

interface SectionManagerSection {
  id: string
  name: string
  order: number
  enabled: boolean
}

interface SectionManagerData {
  sectionName: string
  sections: SectionManagerSection[]
}

// Main Component
export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [cartCount, setCartCount] = useState(3)

  // Dynamic data states
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [featuredProductsSettings, setFeaturedProductsSettings] = useState<{ heading: string; description: string; enabled: boolean }>({
    heading: 'Featured Products',
    description: 'Discover our handpicked selection of top products',
    enabled: true
  })
  const [mosaicProducts, setMosaicProducts] = useState<Product[]>([])
  const [mosaicGridSettings, setMosaicGridSettings] = useState<{ heading: string; description: string; enabled: boolean }>({
    heading: 'Shop the Look',
    description: 'Explore our curated collection of trending styles',
    enabled: true
  })
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [reels, setReels] = useState<VideoReel[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>({})
  const [sectionManager, setSectionManager] = useState<SectionManagerData | null>(null)

  const { addItem, getItemCount } = useCartStore()

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch section-manager settings
        const sectionManagerRes = await fetch('/api/homepage/section-manager')
        const sectionManagerData = await sectionManagerRes.json() as any
        if (sectionManagerData.success) {
          setSectionManager(sectionManagerData.data)
        }

        // Fetch featured products settings first
        const [featuredSettingsRes, mosaicSettingsRes] = await Promise.all([
          fetch('/api/homepage/featured-products'),
          fetch('/api/homepage/mosaic-grid')
        ])
        const [featuredSettingsData, mosaicSettingsData] = await Promise.all([
          featuredSettingsRes.json() as any,
          mosaicSettingsRes.json() as any
        ])

        // Fetch all other data in parallel
        const [
          saleRes, newRes, trendingRes, categoriesRes,
          bannersRes, storiesRes, reelsRes, promotionsRes, settingsRes
        ] = await Promise.all([
          fetch('/api/products?type=sale'),
          fetch('/api/products?type=new'),
          fetch('/api/products?type=trending'),
          fetch('/api/categories'),
          fetch('/api/banners'),
          fetch('/api/stories'),
          fetch('/api/reels'),
          fetch('/api/promotions'),
          fetch('/api/homepage/settings')
        ])

        const [
          saleData, newData, trendingData, categoriesData,
          bannersData, storiesData, reelsData, promotionsData, settingsData
        ] = await Promise.all([
          saleRes.json() as any,
          newRes.json() as any,
          trendingRes.json() as any,
          categoriesRes.json() as any,
          bannersRes.json() as any,
          storiesRes.json() as any,
          reelsRes.json() as any,
          promotionsRes.json() as any,
          settingsRes.json() as any
        ])

        // Set featured products based on admin selection
        if (featuredSettingsData.success && featuredSettingsData.data.isEnabled !== false) {
          const featuredIds = featuredSettingsData.data.productIds || []
          setFeaturedProductsSettings({
            heading: featuredSettingsData.data.heading || 'Featured Products',
            description: featuredSettingsData.data.description || 'Discover our handpicked selection of top products',
            enabled: featuredSettingsData.data.isEnabled !== false
          })
          if (featuredIds.length > 0) {
            // Fetch specific featured products by IDs
            const featuredRes = await fetch(`/api/products?ids=${featuredIds.join(',')}`)
            const featuredData = await featuredRes.json() as any
            setFeaturedProducts(Array.isArray(featuredData.data?.products) ? featuredData.data.products : [])
          } else {
            // Fallback to old behavior if no products selected
            const featuredRes = await fetch('/api/products?type=featured')
            const featuredData = await featuredRes.json() as any
            setFeaturedProducts(Array.isArray(featuredData.data?.products) ? featuredData.data.products : [])
          }
        } else {
          // Featured products disabled, set empty
          setFeaturedProducts([])
          setFeaturedProductsSettings(prev => ({ ...prev, enabled: false }))
        }

        // Set mosaic grid based on admin selection
        if (mosaicSettingsData.success && mosaicSettingsData.data.isEnabled !== false) {
          const mosaicIds = mosaicSettingsData.data.productIds || []
          setMosaicGridSettings({
            heading: mosaicSettingsData.data.heading || 'Shop the Look',
            description: mosaicSettingsData.data.description || 'Explore our curated collection of trending styles',
            enabled: mosaicSettingsData.data.isEnabled !== false
          })
          if (mosaicIds.length > 0) {
            // Fetch specific mosaic products by IDs
            const mosaicRes = await fetch(`/api/products?ids=${mosaicIds.join(',')}`)
            const mosaicData = await mosaicRes.json() as any
            setMosaicProducts(Array.isArray(mosaicData.data?.products) ? mosaicData.data.products : [])
          } else {
            // Fallback to new products if no products selected
            setMosaicProducts(newProducts.slice(0, 6))
          }
        } else {
          // Mosaic grid disabled, set empty
          setMosaicGridSettings(prev => ({ ...prev, enabled: false }))
          setMosaicProducts([])
        }

        // Set other products and categories with defensive checks
        setSaleProducts(Array.isArray(saleData.data?.products) ? saleData.data.products : [])
        setNewProducts(Array.isArray(newData.data?.products) ? newData.data.products : [])
        setTrendingProducts(Array.isArray(trendingData.data?.products) ? trendingData.data.products : [])

        // Transform categories to include href with defensive checks
        const categoriesRaw = Array.isArray(categoriesData.data) ? categoriesData.data : []
        const categoriesWithHref = categoriesRaw.map((cat: any) => ({
          ...cat,
          href: `/collections/${cat.slug}`
        }))
        setCategories(categoriesWithHref)

        // Set homepage content with defensive checks
        const bannerList = Array.isArray(bannersData.data) ? bannersData.data : []
        setBanners(bannerList.map((b: any) => ({
          id: b.id,
          title: b.title,
          mobileImage: b.mobileImage || b.image,
          desktopImage: b.image,
          ctaButtons: b.buttonText && b.buttonLink
            ? [{ label: b.buttonText, href: b.buttonLink, variant: 'primary' as const }]
            : []
        })))

        const storyList = Array.isArray(storiesData.data) ? storiesData.data : []
        setStories(storyList.map((s: any) => {
          // Parse images from JSON string or use as-is if already an array
          let images: string[] = []
          try {
            if (typeof s.images === 'string') {
              images = JSON.parse(s.images)
            } else if (Array.isArray(s.images)) {
              images = s.images
            }
          } catch (e) {
            console.warn('Failed to parse story images:', e)
            images = []
          }

          return {
            id: s.id,
            title: s.title,
            thumbnail: s.thumbnail,
            images: images,
            videoUrl: s.videoUrl || undefined
          }
        }))

        const reelList = Array.isArray(reelsData.data) ? reelsData.data : []

        // Fetch all products for reels that have productIds
        const allProductIds = reelList
          .map((r: any) => r.productIds)
          .filter(Boolean)
          .flat()

        let productsMap: Record<string, any> = {}
        if (allProductIds.length > 0) {
          try {
            const productsRes = await fetch(`/api/products?ids=${allProductIds.join(',')}`)
            const productsData = await productsRes.json() as any
            if (productsData.success && Array.isArray(productsData.data?.products)) {
              productsData.data.products.forEach((p: any) => {
                productsMap[p.id] = p
              })
            }
          } catch (error) {
            console.error('Error fetching reel products:', error)
          }
        }

        // Map reels with actual product data
        setReels(reelList.map((r: any) => {
          const productId = Array.isArray(r.productIds) && r.productIds.length > 0 ? r.productIds[0] : null
          const product = productId ? productsMap[productId] : null

          return {
            id: r.id,
            thumbnail: r.thumbnail,
            videoUrl: r.videoUrl,
            title: r.title,
            category: product?.category?.name || undefined,
            product: product ? {
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              originalPrice: product.originalPrice,
              image: product.images?.[0] || product.image || r.thumbnail
            } : {
              name: 'Featured Product',
              price: 99.99,
              image: r.thumbnail
            }
          }
        }))

        const promotionList = Array.isArray(promotionsData.data) ? promotionsData.data : []
        setPromotions(promotionList.map((p: any) => ({
          id: p.id,
          title: p.title,
          subtitle: p.description || '',
          image: p.image,
          href: p.ctaLink || '#'
        })))

        // Set homepage settings with defensive checks
        setHomepageSettings(settingsData.data || {})
      } catch (err) {
        console.error('Error fetching data:', err)
        // Set all to empty arrays on error to prevent crashes
        setFeaturedProducts([])
        setSaleProducts([])
        setNewProducts([])
        setTrendingProducts([])
        setCategories([])
        setBanners([])
        setStories([])
        setReels([])
        setPromotions([])
        setHomepageSettings({})
        setSectionManager(null)
      }
    }

    fetchData()
  }, [])

  // Helper function to check if a section is enabled in section-manager
  const isSectionEnabled = (sectionId: string): boolean => {
    if (!sectionManager || !sectionManager.sections) return true // Default to enabled if not loaded
    const section = sectionManager.sections.find(s => s.id === sectionId)
    return section ? section.enabled : true // Default to enabled if not found
  }

  // Get sections in the correct order based on section-manager
  const getOrderedSections = () => {
    // Define all available sections with their render functions
    const sectionDefinitions = [
      {
        id: 'fullscreen-video',
        render: () => <FullscreenVideo sectionEnabled={isSectionEnabled('fullscreen-video')} />,
        shouldRender: () => isSectionEnabled('fullscreen-video')
      },
      {
        id: 'hero-slider',
        render: () => <HeroCarousel banners={banners} autoPlay={homepageSettings.banners?.autoPlay} />,
        shouldRender: () => isSectionEnabled('hero-slider') && homepageSettings.banners?.isEnabled !== false && banners.length > 0
      },
      {
        id: 'marquee',
        render: () => <SectionMarquee sectionEnabled={isSectionEnabled('marquee')} />,
        shouldRender: () => isSectionEnabled('marquee')
      },
      {
        id: 'stories',
        render: () => <Stories stories={stories} autoPlay={homepageSettings.stories?.autoPlay} />,
        shouldRender: () => isSectionEnabled('stories') && homepageSettings.stories?.isEnabled !== false && stories.length > 0
      },
      {
        id: 'category-carousel',
        render: () => <CategoryCarousel allCategories={categories} products={[...featuredProducts, ...saleProducts, ...newProducts, ...trendingProducts]} />,
        shouldRender: () => isSectionEnabled('category-carousel') && categories.length > 0 && featuredProducts.length > 0
      },
      {
        id: 'categories',
        render: () => <Categories categories={categories} />,
        shouldRender: () => isSectionEnabled('categories') && categories.length > 0
      },
      {
        id: 'brands',
        render: () => <BrandCarousel sectionEnabled={isSectionEnabled('brands')} />,
        shouldRender: () => isSectionEnabled('brands')
      },
      {
        id: 'video-reels',
        render: () => <VideoReels reels={reels} />,
        shouldRender: () => isSectionEnabled('video-reels') && homepageSettings.reels?.isEnabled !== false && reels.length > 0
      },
      {
        id: 'featured-products',
        render: () => <FeaturedCollection products={featuredProducts} onQuickView={openQuickView} onAddToCart={addToCart} heading={featuredProductsSettings.heading} description={featuredProductsSettings.description} />,
        shouldRender: () => isSectionEnabled('featured-products') && featuredProductsSettings.enabled && featuredProducts.length > 0
      },
      {
        id: 'mosaic-grid',
        render: () => <MosaicGrid products={mosaicProducts} onQuickView={openQuickView} onAddToCart={addToCart} heading={mosaicGridSettings.heading} description={mosaicGridSettings.description} />,
        shouldRender: () => isSectionEnabled('mosaic-grid') && mosaicGridSettings.enabled && mosaicProducts.length > 0
      },
      {
        id: 'promotions',
        render: () => <PromotionRow promotions={promotions} />,
        shouldRender: () => isSectionEnabled('promotions') && homepageSettings.promotions?.isEnabled !== false && promotions.length > 0
      },
    ]

    // If section manager is not loaded, use default order
    if (!sectionManager || !sectionManager.sections) {
      return sectionDefinitions.filter(s => s.shouldRender())
    }

    // Sort sections based on their order in section-manager
    return sectionDefinitions
      .map(sectionDef => {
        const sectionConfig = sectionManager.sections.find(s => s.id === sectionDef.id)
        return {
          ...sectionDef,
          order: sectionConfig?.order || 999
        }
      })
      .sort((a, b) => a.order - b.order)
      .filter(s => s.shouldRender())
  }

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product)
    setQuickViewOpen(true)
  }

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      quantity: 1
    })
    setCartCount(getItemCount())
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="w-full flex-grow pb-24 md:pb-0">
        {/* Render sections in the configured order */}
        {getOrderedSections().map(section => (
          <React.Fragment key={section.id}>
            {section.render()}
          </React.Fragment>
        ))}
        {/* StickyImageCards is always shown at the end */}
        <StickyImageCards />
      </main>
      <Footer />
      <MobileBottomNav />
      <PWAInstallPrompt />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  )
}
