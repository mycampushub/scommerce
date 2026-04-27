'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Share2, ShoppingCart, Star, Play, Search, User, Menu, Phone, Mail, Instagram, Facebook, Twitter, Youtube, Linkedin, ShoppingBag, Home as HomeIcon } from 'lucide-react'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useCartStore } from '@/lib/store/cart-store'
import { QuickViewModal } from '@/components/quick-view-modal'

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
  image: string
  href: string
}

interface VideoReel {
  id: string
  thumbnail: string
  videoUrl: string
  title: string
  product: {
    name: string
    price: number
    image: string
  }
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  badge?: string
  category?: string
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

// 0. Navbar Component
function Navbar({ cartCount = 3 }: { cartCount?: number }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isHeaderVisible = useScrollDirection()

  return (
    <header className={`bg-white shadow-sm z-40 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="modern ecommerce"
              className="h-10 md:h-12 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="/collections/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</a>
            <a href="/collections/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</a>
            <a href="/collections/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</a>
            <a href="/collections/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</a>
            <a href="/collections/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</a>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <a href="/search" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors">
              <Search className="w-5 h-5" />
            </a>
            <a href="/cart" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>
            </a>
            <a href="/admin" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors">
              <User className="w-5 h-5" />
            </a>
            <button 
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-4">
              <a href="/collections/saree" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Sarees</a>
              <a href="/collections/salwar" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Salwar Suits</a>
              <a href="/collections/lehengas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Lehengas</a>
              <a href="/collections/kurtas" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Kurtas</a>
              <a href="/collections/menswear" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">Menswear</a>
            </nav>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              <a href="/search" className="flex items-center gap-2 text-gray-700">
                <Search className="w-5 h-5" />
              </a>
              <a href="/cart" className="flex items-center gap-2 text-gray-700 relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>
              </a>
              <a href="/admin" className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// 1. Hero Carousel Component
function HeroCarousel({ banners, autoPlay = 5000 }: { banners: Banner[], autoPlay?: number | null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => (prev + 1) % banners.length)
      setTimeout(() => setIsTransitioning(false), 500)
    }
  }, [isTransitioning, banners.length])

  const prevSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true)
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
      setTimeout(() => setIsTransitioning(false), 500)
    }
  }, [isTransitioning, banners.length])

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
              className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50'}`}
              aria-label={`Page dot ${index + 1}`}
              aria-current={index === currentIndex ? 'step' : undefined}
            />
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
function SectionMarquee() {
  const marqueeText = "FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE"
  
  return (
    <section className="bg-pink-600 overflow-hidden py-3">
      <div className="animate-marquee flex whitespace-nowrap" style={{ animation: 'marquee 20s linear infinite' }}>
        {[...Array(6)].map((_, i) => (
          <span key={i} className="text-white text-sm md:text-base font-medium px-8">
            {marqueeText}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
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
    if (selectedStory && currentImageIndex < selectedStory.images.length - 1) {
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
        const videoId = selectedStory.videoUrl.split('/embed/')[1]
        
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
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={nextStory}
            disabled={!stories || currentStoryIndex === stories.length - 1}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all ${
              !stories || currentStoryIndex === stories.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white'
            }`}
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
              selectedStory.images.map((_, index) => (
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
                <img src={selectedStory.images[currentImageIndex]} alt={selectedStory.title} className="w-full h-full object-contain md:object-cover" loading="eager" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pointer-events-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={selectedStory.thumbnail} alt="" className="w-full h-full object-cover" width="40" height="40" />
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

// 4. Category Menu Component
function Categories({ categories }: { categories: Category[] }) {
  return (
    <section className="w-full py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Shop by Category
        </h2>
        <div className="px-3 py-3 md:px-12 md:py-6" data-testid="category-menu">
          {/* Mobile View - Horizontal Scroll */}
          <div
            role="list"
            data-testid="category-menu-scroll"
            className="flex gap-2 overflow-x-auto pb-2 md:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((category, index) => (
              <a
                key={category.id}
                data-testid={`category-menu-item-${index}`}
                href={category.href}
                className="flex-shrink-0"
              >
                <div className="w-[78px] flex flex-col items-center group">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ width: '78px', height: '104px' }}
                      data-testid={`category-menu-item-${index}-image`}
                      width="78"
                      height="104"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className="text-center font-medium text-[10px] mt-2 leading-tight block w-[78px] transition-colors group-hover:text-pink-600"
                    data-testid={`category-menu-item-${index}-text`}
                    style={{
                      color: '#8c8b8b',
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
                      color: '#8c8b8b',
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

// 5. Video Carousel Component
function VideoReels({ reels }: { reels: VideoReel[] }) {
  const [selectedReel, setSelectedReel] = useState<VideoReel | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reels.length) % reels.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reels.length)
  }

  return (
    <>
      <section className="homevideocarousel clr container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-900">
            <span className="text-pink-600">⚡</span>
            Video Shorts
          </h3>
          <a
            href="/shorts"
            className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 px-1" style={{ scrollbarWidth: 'none' }}>
          {reels && reels.map((reel, index) => (
            <div
              key={reel.id}
              className="flex-shrink-0 cursor-pointer group transition-all duration-300"
              style={{ width: '160px', minWidth: '160px' }}
              onClick={() => setSelectedReel(reel)}
            >
              <div className="relative aspect-[9/16] overflow-hidden bg-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                <img 
                  src={reel.thumbnail} 
                  alt={reel.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  loading="lazy"
                  width="160"
                  height="284"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:from-black/50 group-hover:to-black/10 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-5 h-5 fill-pink-500 text-pink-500 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-medium truncate leading-tight">{reel.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {selectedReel && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button onClick={() => setSelectedReel(null)} className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-2 transition-colors" aria-label="Close video">
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-md h-full md:h-[85vh] flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black">
              <div className="relative aspect-[9/16] h-full w-full">
                {selectedReel.videoUrl ? (
                  <iframe
                    src={`${selectedReel.videoUrl}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                    title={selectedReel.title}
                    className="w-full h-full object-cover"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img src={selectedReel.thumbnail} alt={selectedReel.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                          <div className={`h-full bg-white ${i === 1 ? 'w-1/2' : ''}`} />
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-20 h-20 text-white/80" />
                    </div>
                  </>
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 hidden md:flex">
                  <button onClick={handlePrev} className="text-white/50 hover:text-white p-2 transition-colors">
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button onClick={handleNext} className="text-white/50 hover:text-white p-2 transition-colors">
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex w-64 bg-white flex-col">
              <div className="p-4 border-b">
                <div className="relative aspect-square mb-4 rounded-lg overflow-hidden">
                  <img src={selectedReel.product.image} alt={selectedReel.product.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-lg">{selectedReel.product.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl font-bold text-pink-600">৳{selectedReel.product.price}</span>
                  <button className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-full transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                  <button className="w-full justify-start gap-2 flex items-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    <Heart className="w-4 h-4" /> Wishlist
                  </button>
                  <button className="w-full justify-start gap-2 flex items-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button className="w-full justify-start gap-2 flex items-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Comment
                  </button>
                </div>
              </div>
            </div>
            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={selectedReel.product.image} alt={selectedReel.product.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{selectedReel.product.name}</p>
                  <p className="text-pink-600 font-bold">৳{selectedReel.product.price}</p>
                </div>
                <button className="bg-pink-600 hover:bg-pink-700 text-white p-2 rounded-full transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-around border-t pt-3">
                <button className="flex flex-col gap-1 items-center text-gray-600">
                  <Heart className="w-5 h-5" />
                  <span className="text-xs">Like</span>
                </button>
                <button className="flex flex-col gap-1 items-center text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs">Comment</span>
                </button>
                <button className="flex flex-col gap-1 items-center text-gray-600">
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 6. Fullscreen Video Component
function FullscreenVideo() {
  return (
    <section className="relative w-full overflow-hidden bg-black py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative w-full mx-auto" style={{ maxWidth: '1080px', aspectRatio: '16/9' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube-nocookie.com/embed/Gk-s0icT2CI?autoplay=1&mute=1&loop=1&playlist=Gk-s0icT2CI&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1"
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
function FeaturedCollection({ products, onQuickView, onAddToCart }: { products: Product[]; onQuickView: (product: Product) => void; onAddToCart: (product: Product) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 4
  const { addItem, getItemCount } = useCartStore()
  const cartCount = getItemCount()

  const productsArray = Array.isArray(products) ? products : []

  if (productsArray.length === 0) {
    return null
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(Math.ceil(productsArray.length / itemsPerPage) - 1, prev + 1))
  }

  return (
    <section className="featured-collection container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Collection</h2>
        <div className="flex gap-2">
          <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50" disabled={currentIndex === 0}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={handleNext} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50" disabled={currentIndex >= Math.ceil(productsArray.length / itemsPerPage) - 1}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {Array.from({ length: Math.ceil(productsArray.length / itemsPerPage) }).map((_, pageIndex) => (
            <div key={pageIndex} className="flex-shrink-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
              {productsArray.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((product) => (
                <div key={product.id} className="product-grid-item group">
                  <div className="product__media relative aspect-[3/4] overflow-hidden rounded-xl mb-4 bg-gray-100">
                    {product.badge && (
                      <span className="absolute top-3 left-3 z-10 bg-pink-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {product.badge}
                      </span>
                    )}
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onQuickView(product)}
                        className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="product-grid-item__title font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">({product.reviews})</span>
                      </div>
                      <div className="product-grid-item__price flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddToCart(product)}
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
function MosaicGrid({ products, onQuickView, onAddToCart }: { products: Product[]; onQuickView: (product: Product) => void; onAddToCart: (product: Product) => void }) {
  const productsArray = Array.isArray(products) ? products : []

  if (productsArray.length === 0) {
    return null
  }

  return (
    <section className="mosaic bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Shop the Look</h2>
        <div className="mosaic__grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsArray.map((product, index) => (
            <div
              key={product.id}
              className={`product-card group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${index >= 4 ? 'hidden lg:block' : ''}`}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                  <button
                    onClick={() => onQuickView(product)}
                    className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                  >
                    Quick View
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <a href={`/product/${product.id}`} className="block">
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
                      <span className="text-lg font-bold text-gray-900">৳{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onAddToCart(product)}
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
    setCurrentIndex((prev) => (prev + 1) % carouselSlides.length)
    setProgress(0)
  }
  
  const prevSlide = () => {
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

// 11. Floating Category Carousel - Full width, always visible, overlaps content while scrolling
function FloatingCategoryCarousel({ onQuickView, onAddToCart }: { onQuickView: (product: Product) => void; onAddToCart: (product: Product) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const categories = [
    { id: 'new', name: 'NEW', href: '/shop?filter=new', products: newCategoryProducts },
    { id: 'tops', name: 'Tops', href: '/collections/tops', products: topsCategoryProducts },
    { id: 'dresses', name: 'Dresses', href: '/collections/gowns', products: dressesCategoryProducts },
    { id: 'preloved', name: 'PRE-LOVED', href: '/search?filter=vintage', products: preLovedCategoryProducts }
  ]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + categories.length) % categories.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % categories.length)
  }

  const currentCategory = categories[currentIndex]

  return (
    <section className="relative z-50 w-full bg-gradient-to-b from-white to-gray-50 shadow-xl">
      <div className="container mx-auto px-4 py-8">
        {/* Category Navigation - Full Width */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handlePrev} 
            className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-pink-600 hover:border-pink-600 hover:text-white transition-colors"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex gap-4 md:gap-8">
            {categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => setCurrentIndex(index)}
                className={`text-sm md:text-base font-semibold transition-colors ${
                  index === currentIndex 
                    ? 'text-pink-600 underline decoration-2 underline-offset-4' 
                    : 'text-gray-500 hover:text-pink-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleNext} 
            className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center hover:bg-pink-600 hover:border-pink-600 hover:text-white transition-colors"
            aria-label="Next category"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Category Products - Display One by One */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {categories.map((category) => (
              <div key={category.id} className="flex-shrink-0 w-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h2>
                  <a 
                    href={category.href}
                    className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center gap-2"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
                
                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {category.products.map((product) => (
                    <div key={product.id} className="group">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-3 bg-gray-100">
                        {product.badge && (
                          <span className="absolute top-2 left-2 z-10 bg-pink-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            {product.badge}
                          </span>
                        )}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => onQuickView(product)}
                            className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-600 hover:text-white"
                          >
                            Quick View
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <a href={`/product/${product.id}`} className="block">
                            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm md:text-base group-hover:text-pink-600 transition-colors">
                              {product.name}
                            </h3>
                          </a>
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 md:w-4 md:h-4 ${
                                    i < Math.floor(product.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs md:text-sm text-gray-500">({product.reviews})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm md:text-lg font-bold text-gray-900">৳{product.price}</span>
                            {product.originalPrice && (
                              <span className="text-xs md:text-sm text-gray-400 line-through">৳{product.originalPrice}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onAddToCart(product)}
                          className="flex-shrink-0 bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors"
                          aria-label="Add to cart"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// 12. Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Shop */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Shop</h3>
            <ul className="space-y-2">
              <li><a href="/collections/saree" className="text-gray-300 hover:text-white transition-colors">Sarees</a></li>
              <li><a href="/collections/salwar" className="text-gray-300 hover:text-white transition-colors">Salwar Suits</a></li>
              <li><a href="/collections/lehengas" className="text-gray-300 hover:text-white transition-colors">Lehengas</a></li>
              <li><a href="/collections/gowns" className="text-gray-300 hover:text-white transition-colors">Gowns</a></li>
              <li><a href="/collections/kurtas" className="text-gray-300 hover:text-white transition-colors">Kurtas</a></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Categories</h3>
            <ul className="space-y-2">
              <li><a href="/shop?filter=sale" className="text-gray-300 hover:text-white transition-colors">Sale</a></li>
              <li><a href="/shop?filter=new" className="text-gray-300 hover:text-white transition-colors">New Arrivals</a></li>
              <li><a href="/shop?filter=best-sellers" className="text-gray-300 hover:text-white transition-colors">Best Sellers</a></li>
              <li><a href="/collections/wedding" className="text-gray-300 hover:text-white transition-colors">Wedding</a></li>
              <li><a href="/collections/festive" className="text-gray-300 hover:text-white transition-colors">Festive</a></li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-pink-500">Customer Service</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/shipping" className="text-gray-300 hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="/returns" className="text-gray-300 hover:text-white transition-colors">Returns & Exchanges</a></li>
              <li><a href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          {/* Connect */}
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
        
        {/* Social Media Links */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4 text-white">Follow Us</h3>
            <div className="flex justify-center gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 modern ecommerce. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm">
            <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// 13. Mobile Bottom Navigation Component (App-style fixed bottom nav)
function MobileBottomNav() {
  const pathname = usePathname()
  const isVisible = useScrollDirection()

  return (
    <>
      {isVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300">
          {/* Safe area padding for mobile devices */}
          <div className="pb-safe pt-3 pb-6 px-4">
            <div className="max-w-md mx-auto">
              {/* Curved/rounded pill-shaped container */}
              <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-4 py-2 flex items-center justify-between gap-2">

            {/* Home Button */}
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

            {/* Shop Button */}
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

            {/* Search Button */}
            <a
              href="/search"
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-colors active:scale-95 ${
                pathname === '/search'
                  ? 'bg-pink-600 text-white hover:bg-pink-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Open search"
            >
              <Search className="w-6 h-6" strokeWidth={2.5} />
            </a>

            {/* Cart Button */}
            <a
              href="/cart"
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-colors active:scale-95 relative ${
                pathname === '/cart'
                  ? 'bg-pink-600 text-white hover:bg-pink-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="Open cart"
            >
              <ShoppingCart className="w-6 h-6" strokeWidth={2} />
              {/* Cart Badge */}
              <span className="absolute top-2 right-2 w-5 h-5 bg-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </a>
          </div>
        </div>
      </div>
    </nav>
      )}
    </>
  )
}

// Types for dynamic homepage data
interface HomepageSettings {
  banners?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
  stories?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
  reels?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
  promotions?: { sectionName: string; isEnabled: boolean; autoPlay: number | null; displayLimit: number | null }
}

// Main Component
export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [cartCount, setCartCount] = useState(3)

  // Dynamic data states
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [reels, setReels] = useState<VideoReel[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addItem, getItemCount } = useCartStore()

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data in parallel
        const [
          featuredRes, saleRes, newRes, trendingRes, categoriesRes,
          bannersRes, storiesRes, reelsRes, promotionsRes, settingsRes
        ] = await Promise.all([
          fetch('/api/products?type=featured'),
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
          featuredData, saleData, newData, trendingData, categoriesData,
          bannersData, storiesData, reelsData, promotionsData, settingsData
        ] = await Promise.all([
          featuredRes.json(),
          saleRes.json(),
          newRes.json(),
          trendingRes.json(),
          categoriesRes.json(),
          bannersRes.json(),
          storiesRes.json(),
          reelsRes.json(),
          promotionsRes.json(),
          settingsRes.json()
        ])

        // Set products and categories
        setFeaturedProducts(featuredData.products || featuredData.data || [])
        setSaleProducts(saleData.products || saleData.data || [])
        setNewProducts(newData.products || newData.data || [])
        setTrendingProducts(trendingData.products || trendingData.data || [])

        // Transform categories to include href
        const categoriesWithHref = (categoriesData.data || categoriesData || []).map((cat: any) => ({
          ...cat,
          href: `/collections/${cat.slug}`
        }))
        setCategories(categoriesWithHref)

        // Set homepage content
        const bannerList = bannersData.data || []
        setBanners(bannerList.map((b: any) => ({
          id: b.id,
          title: b.title,
          mobileImage: b.mobileImage || b.image,
          desktopImage: b.image,
          ctaButtons: b.buttonText && b.buttonLink 
            ? [{ label: b.buttonText, href: b.buttonLink, variant: 'primary' as const }]
            : []
        })))

        const storyList = storiesData.data || []
        setStories(storyList.map((s: any) => ({
          id: s.id,
          title: s.title,
          thumbnail: s.thumbnail,
          images: Array.isArray(s.images) ? s.images : [],
          videoUrl: undefined
        })))

        const reelList = reelsData.data || []
        setReels(reelList.map((r: any) => ({
          id: r.id,
          thumbnail: r.thumbnail,
          videoUrl: r.videoUrl,
          title: r.title,
          product: { name: 'Featured Product', price: 99.99, image: r.thumbnail }
        })))

        const promotionList = promotionsData.data || []
        setPromotions(promotionList.map((p: any) => ({
          id: p.id,
          title: p.title,
          subtitle: p.description || '',
          image: p.image,
          href: p.ctaLink || '#'
        })))

        // Set homepage settings
        setHomepageSettings(settingsData.data || {})
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product)
    setQuickViewOpen(true)
  }

  const addToCart = (product: Product) => {
    addItem({
      id: product.id,
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
      <Navbar cartCount={cartCount} />
      <main className="w-full flex-grow pb-24 md:pb-0">
        {loading ? (
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Banners - only show if enabled and has data */}
            {homepageSettings.banners?.isEnabled !== false && banners.length > 0 && (
              <HeroCarousel banners={banners} autoPlay={homepageSettings.banners?.autoPlay} />
            )}
            <SectionMarquee />
            {/* Stories - only show if enabled and has data */}
            {homepageSettings.stories?.isEnabled !== false && stories.length > 0 && (
              <Stories stories={stories} autoPlay={homepageSettings.stories?.autoPlay} />
            )}
            {/* Floating Category Carousel - Temporarily disabled due to undefined product variables */}
            {/* <FloatingCategoryCarousel onQuickView={openQuickView} onAddToCart={addToCart} /> */}
            <FullscreenVideo />
            <Categories categories={categories} />
            {/* Reels - only show if enabled and has data */}
            {homepageSettings.reels?.isEnabled !== false && reels.length > 0 && (
              <VideoReels reels={reels} />
            )}
            <FeaturedCollection products={featuredProducts} onQuickView={openQuickView} onAddToCart={addToCart} />
            <MosaicGrid products={newProducts} onQuickView={openQuickView} onAddToCart={addToCart} />
            {/* Promotions - only show if enabled and has data */}
            {homepageSettings.promotions?.isEnabled !== false && promotions.length > 0 && (
              <PromotionRow promotions={promotions} />
            )}
            <StickyImageCards />
          </>
        )}
      </main>
      <Footer />
      <MobileBottomNav />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
