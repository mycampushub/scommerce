'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Music,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

interface ShortVideo {
  id: string
  videoUrl: string
  thumbnail: string
  title: string
  description: string
  product: {
    id: string
    name: string
    price: number
    image: string
  }
  user: {
    id: string
    name: string
    username: string
    avatar: string
  }
  audio: string
  likes: number
  comments: number
  shares: number
  isLiked: boolean
}

interface ReelApiResponse {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  productIds: string | null
  isActive: number
  order: number
  createdAt: string
  updatedAt: string
}

// Function to extract YouTube video ID from URL
function getYoutubeId(url: string): string {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:embed\/|v=)([a-zA-Z0-9_-]+)/,           // youtube.com/embed/ID or youtube.com/watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]+)/,            // youtu.be/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/ // youtube.com/shorts/ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

// Function to get proper YouTube embed URL
function getYoutubeEmbedUrl(videoUrl: string): string {
  const videoId = getYoutubeId(videoUrl);
  if (!videoId) return videoUrl;
  return `https://www.youtube.com/embed/${videoId}`;
}

// Function to detect video type
function getVideoType(url: string): 'youtube' | 'vimeo' | 'direct' | 'unknown' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return 'direct';
  }
  return 'unknown';
}

// Function to get Vimeo embed URL
function getVimeoEmbedUrl(videoUrl: string): string {
  const match = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1&mute=1&playsinline=1`;
  }
  return videoUrl;
}

// Function to transform API reel data to ShortVideo format
function transformReelToShortVideo(reel: ReelApiResponse): ShortVideo {
  const youtubeId = getYoutubeId(reel.videoUrl);

  return {
    id: reel.id,
    videoUrl: reel.videoUrl,
    thumbnail: reel.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : ''),
    title: reel.title,
    description: `Check out our amazing ${reel.title}! Shop the collection now.`,
    product: {
      id: reel.id, // Use reel ID as product ID for now
      name: 'Featured Product',
      price: 99.99,
      image: reel.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : '')
    },
    user: {
      id: 'default',
      name: 'SCommerce',
      username: '@scommerce',
      avatar: 'https://via.placeholder.com/100'
    },
    audio: 'Original Sound - SCommerce',
    likes: Math.floor(Math.random() * 50000) + 10000,
    comments: Math.floor(Math.random() * 1000) + 100,
    shares: Math.floor(Math.random() * 500) + 50,
    isLiked: false
  };
}

function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function ShortsPage() {
  const router = useRouter()
  const [shortsData, setShortsData] = useState<ShortVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [showProduct, setShowProduct] = useState(false)
  const [showBottomMenu, setShowBottomMenu] = useState(true)
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; timestamp: number } | null>(null)

  // Fetch reels data from API
  useEffect(() => {
    async function fetchReels() {
      try {
        const response = await fetch('/api/reels')
        const result = await response.json()

        if (result.success && result.data && result.data.length > 0) {
          const transformedData = result.data.map(transformReelToShortVideo)
          setShortsData(transformedData)
        } else {
          // No data available
          setShortsData([])
        }
      } catch (err) {
        console.error('Error fetching reels:', err)
        setError('Failed to load shorts. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchReels()
  }, [])

  const currentVideo = shortsData[currentIndex]

  // Handle like toggle
  const handleLike = useCallback(() => {
    if (!currentVideo) return
    setLikedVideos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(currentVideo.id)) {
        newSet.delete(currentVideo.id)
      } else {
        newSet.add(currentVideo.id)
      }
      return newSet
    })
  }, [currentVideo?.id])

  // Handle share
  const handleShare = useCallback(async () => {
    if (!currentVideo) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentVideo.title,
          text: currentVideo.description,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share canceled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }, [currentVideo])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentIndex((prev) => Math.max(0, prev - 1))
        setShowBottomMenu(true) // Show menu when going up (to previous video)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentIndex((prev) => Math.min(shortsData.length - 1, prev + 1))
        setShowBottomMenu(false) // Hide menu when going down (to next video)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortsData.length])

  // Handle video change and auto-advance
  useEffect(() => {
    // Clear any existing timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
    }

    // Set a timer to auto-advance to next video after 30 seconds
    // This is a workaround since YouTube iframes don't easily expose end events
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev < shortsData.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 30000) // 30 seconds in milliseconds

    return () => {
      setAutoAdvanceTimer(timer)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [currentIndex, shortsData.length])

  // Handle touch/swipe navigation for mobile
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY
      const minSwipeDistance = 50

      // Determine if it's a horizontal or vertical swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            // Swipe right - previous
            setCurrentIndex((prev) => Math.max(0, prev - 1))
            setShowBottomMenu(true)
          } else {
            // Swipe left - next
            setCurrentIndex((prev) => Math.min(shortsData.length - 1, prev + 1))
            setShowBottomMenu(false)
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            // Swipe down - previous
            setCurrentIndex((prev) => Math.max(0, prev - 1))
            setShowBottomMenu(true)
          } else {
            // Swipe up - next
            setCurrentIndex((prev) => Math.min(shortsData.length - 1, prev + 1))
            setShowBottomMenu(false)
          }
        }
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [shortsData.length])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Loading shorts...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-center max-w-md px-4">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold mb-2">Oops!</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                // Retry fetch by reloading the effect
                window.location.reload()
              }}
              className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && shortsData.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-center max-w-md px-4">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold mb-2">No Shorts Available</h2>
            <p className="text-white/70 mb-6">
              There are currently no shorts to show. Check back later for new content!
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading and has data */}
      {!loading && !error && shortsData.length > 0 && (
        <>
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-center">
            <div className="flex items-center gap-4 bg-black/50 backdrop-blur-md rounded-full px-6 py-2">
              <span className="text-white font-bold text-lg">Shorts</span>
              <div className="h-4 w-px bg-white/30" />
              <button className="text-white/70 hover:text-white transition-colors text-sm">Following</button>
              <button className="text-white font-semibold text-sm">For You</button>
            </div>
          </div>

          {/* Exit Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 right-4 z-50 text-white bg-black/50 backdrop-blur-md rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <ChevronDown className="h-6 w-6" />
          </button>

          {/* Video Container */}
          <div
            ref={containerRef}
            className="h-full w-full relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="absolute inset-0"
              >
                {/* Video Element */}
                <div className="relative w-full h-full">
                  {currentVideo && (() => {
                    const videoType = getVideoType(currentVideo.videoUrl);

                    if (videoType === 'youtube') {
                      const youtubeId = getYoutubeId(currentVideo.videoUrl);
                      return (
                        <iframe
                          key={currentIndex}
                          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&controls=0&loop=1&playlist=${youtubeId}&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                          title={currentVideo.title}
                          className="w-full h-full object-cover"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={{ border: 'none' }}
                        />
                      );
                    } else if (videoType === 'vimeo') {
                      const vimeoUrl = getVimeoEmbedUrl(currentVideo.videoUrl);
                      return (
                        <iframe
                          key={currentIndex}
                          src={vimeoUrl}
                          title={currentVideo.title}
                          className="w-full h-full object-cover"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          style={{ border: 'none' }}
                        />
                      );
                    } else if (videoType === 'direct') {
                      return (
                        <video
                          key={currentIndex}
                          src={currentVideo.videoUrl}
                          title={currentVideo.title}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls={false}
                          style={{ border: 'none' }}
                        />
                      );
                    } else {
                      // Fallback: Try to load in iframe for other URL types
                      return (
                        <iframe
                          key={currentIndex}
                          src={currentVideo.videoUrl}
                          title={currentVideo.title}
                          className="w-full h-full object-cover"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          style={{ border: 'none' }}
                        />
                      );
                    }
                  })()}
                </div>

                {/* Video Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

                {currentVideo && (
                  <>
                    {/* Left Side - Video Info */}
                    <div className="absolute left-4 bottom-24 right-20 space-y-3 pointer-events-none">
                      {/* User Info */}
                      <div className="pointer-events-auto flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white">
                          <AvatarImage src={currentVideo.user.avatar} alt={currentVideo.user.name} />
                          <AvatarFallback>{currentVideo.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-semibold text-sm flex items-center gap-2">
                            {currentVideo.user.username}
                            <button className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-0.5 rounded-full transition-colors">
                              Follow
                            </button>
                          </p>
                          <p className="text-white/70 text-xs">{currentVideo.user.name}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="pointer-events-auto">
                        <p className="text-white text-sm leading-relaxed">
                          {currentVideo.description}
                        </p>
                      </div>

                      {/* Audio/Music */}
                      <div className="pointer-events-auto flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Music className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <motion.div
                            animate={{
                              x: ['0%', '100%']
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                            className="whitespace-nowrap text-white text-sm"
                          >
                            {currentVideo.audio}
                          </motion.div>
                        </div>
                      </div>

                      {/* Product Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`pointer-events-auto bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden ${showProduct ? 'p-3' : 'p-2'}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={currentVideo.product.image}
                            alt={currentVideo.product.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {currentVideo.product.name}
                            </p>
                            <p className="text-violet-600 font-bold text-lg">
                              ${typeof currentVideo.product.price === 'number' ? currentVideo.product.price.toFixed(2) : '0.00'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowProduct((prev) => !prev)}
                            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                          >
                            {showProduct ? 'View' : 'Shop Now'}
                          </button>
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Side - Actions */}
                    <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
                      {/* Like */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          likedVideos.has(currentVideo.id) ? 'bg-red-500' : 'bg-black/50 backdrop-blur-sm'
                        }`}>
                          <Heart
                            className={`h-7 w-7 transition-all ${likedVideos.has(currentVideo.id) ? 'text-white fill-white' : 'text-white'}`}
                          />
                        </div>
                        <span className="text-white text-xs font-semibold">
                          {formatNumber(currentVideo.likes + (likedVideos.has(currentVideo.id) ? 1 : 0))}
                        </span>
                      </motion.button>

                      {/* Comments */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <MessageCircle className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-white text-xs font-semibold">
                          {formatNumber(currentVideo.comments)}
                        </span>
                      </motion.button>

                      {/* Share */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <Share2 className="h-7 w-7 text-white" />
                        </div>
                        <span className="text-white text-xs font-semibold">
                          {formatNumber(currentVideo.shares)}
                        </span>
                      </motion.button>

                      {/* More */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <MoreVertical className="h-7 w-7 text-white" />
                        </div>
                      </motion.button>

                      {/* Audio Disc */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                        className="w-12 h-12 bg-gradient-to-r from-violet-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white/30"
                      >
                        <Music className="h-5 w-5 text-white" />
                      </motion.div>
                    </div>
                  </>
                )}

                {/* Bottom Controls */}
                <AnimatePresence mode="wait">
                  {showBottomMenu && (
                    <motion.div
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="absolute bottom-0 left-0 right-0 p-4"
                    >
                      {/* Video Counter and Navigation */}
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentIndex((prev) => Math.max(0, prev - 1))
                          }}
                          disabled={currentIndex === 0}
                          className={`flex items-center gap-2 text-white/70 text-sm px-4 py-2 rounded-full transition-all ${
                            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-black/70 backdrop-blur-md hover:bg-black/90'
                          }`}
                        >
                          <ChevronUp className="w-4 h-4" />
                          <span>Previous</span>
                        </button>
                        <div className="flex items-center gap-2 text-white/70 text-sm bg-black/70 backdrop-blur-md px-4 py-2 rounded-full">
                          <span>{currentIndex + 1}</span>
                          <span>/</span>
                          <span>{shortsData.length}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentIndex((prev) => Math.min(shortsData.length - 1, prev + 1))
                          }}
                          disabled={currentIndex === shortsData.length - 1}
                          className={`flex items-center gap-2 text-white/70 text-sm px-4 py-2 rounded-full transition-all ${
                            currentIndex === shortsData.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-black/70 backdrop-blur-md hover:bg-black/90'
                          }`}
                        >
                          <span>Next</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Side Navigation Buttons (Desktop) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                  }}
                  disabled={currentIndex === 0}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full transition-all hidden md:flex items-center justify-center ${
                    currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-black/70 backdrop-blur-md hover:bg-black/90 text-white'
                  }`}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex((prev) => Math.min(shortsData.length - 1, prev + 1))
                  }}
                  disabled={currentIndex === shortsData.length - 1}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full transition-all hidden md:flex items-center justify-center ${
                    currentIndex === shortsData.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-black/70 backdrop-blur-md hover:bg-black/90 text-white'
                  }`}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}
