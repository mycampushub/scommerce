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

const shortsData: ShortVideo[] = [
  {
    id: '1',
    videoUrl: 'https://www.youtube.com/embed/cmpjAr1lfKc?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/cmpjAr1lfKc/maxresdefault.jpg',
    title: 'Fashion Collection 🌸',
    description: 'Check out our amazing summer collection! Perfect for the season ☀️',
    product: {
      id: 'p1',
      name: 'Floral Summer Dress',
      price: 89.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849'
    },
    user: {
      id: 'u1',
      name: 'Fashion Studio',
      username: '@fashionstudio',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849'
    },
    audio: 'Summer Vibes - Original Sound',
    likes: 12450,
    comments: 342,
    shares: 189,
    isLiked: false
  },
  {
    id: '2',
    videoUrl: 'https://www.youtube.com/embed/3sRG8eXoFek?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/3sRG8eXoFek/maxresdefault.jpg',
    title: 'Style Trends 💃',
    description: '3 ways to style your outfits for any occasion! #fashion #style',
    product: {
      id: 'p2',
      name: 'Designer Lehenga',
      price: 299.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849'
    },
    user: {
      id: 'u2',
      name: 'Style Guru',
      username: '@styleguru',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849'
    },
    audio: 'Bollywood Beats - Mix',
    likes: 8732,
    comments: 215,
    shares: 94,
    isLiked: true
  },
  {
    id: '3',
    videoUrl: 'https://www.youtube.com/embed/WNL4wZ4rdh4?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/WNL4wZ4rdh4/maxresdefault.jpg',
    title: 'Designer Looks 🎨',
    description: 'Transform your look with these amazing pieces! Shop the collection',
    product: {
      id: 'p3',
      name: 'Cotton Salwar Suit',
      price: 79.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849'
    },
    user: {
      id: 'u3',
      name: 'Desi Fashion',
      username: '@desifashion',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849'
    },
    audio: 'Fusion Mix - DJ Beats',
    likes: 15678,
    comments: 523,
    shares: 312,
    isLiked: false
  },
  {
    id: '4',
    videoUrl: 'https://www.youtube.com/embed/76weitaUxn0?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/76weitaUxn0/maxresdefault.jpg',
    title: 'Trending Styles 💍',
    description: 'Get ready for your big day! Exclusive bridal collection available now',
    product: {
      id: 'p4',
      name: 'Wedding Saree',
      price: 499.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849'
    },
    user: {
      id: 'u4',
      name: 'Bridal Dreams',
      username: '@bridaldreams',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849'
    },
    audio: 'Wedding Melodies - Classic',
    likes: 21345,
    comments: 789,
    shares: 567,
    isLiked: false
  },
  {
    id: '5',
    videoUrl: 'https://www.youtube.com/embed/3d94-t1ufS0?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/3d94-t1ufS0/maxresdefault.jpg',
    title: 'Summer Collection 👔',
    description: '5 essential tips for styling your Kurta perfectly! #mensfashion',
    product: {
      id: 'p5',
      name: 'Traditional Kurta',
      price: 129.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849'
    },
    user: {
      id: 'u5',
      name: 'Men\'s Style Guide',
      username: '@mensstyle',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849'
    },
    audio: 'Traditional Beats - Remix',
    likes: 9876,
    comments: 234,
    shares: 156,
    isLiked: false
  },
  {
    id: '6',
    videoUrl: 'https://www.youtube.com/embed/Wo9L8V1hmrk?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/Wo9L8V1hmrk/maxresdefault.jpg',
    title: 'New Arrivals ✨',
    description: 'Check out the latest additions to our collection!',
    product: {
      id: 'p6',
      name: 'Cotton Salwar Suit',
      price: 79.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849'
    },
    user: {
      id: 'u6',
      name: 'Fashion Forward',
      username: '@fashionforward',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849'
    },
    audio: 'New Wave - Trending',
    likes: 15432,
    comments: 432,
    shares: 287,
    isLiked: false
  },
  {
    id: '7',
    videoUrl: 'https://www.youtube.com/embed/jn7olXSBq4c?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/jn7olXSBq4c/maxresdefault.jpg',
    title: 'Fashion Week 💫',
    description: 'Exclusive footage from our latest fashion show!',
    product: {
      id: 'p7',
      name: 'Anarkali Dress',
      price: 159.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849'
    },
    user: {
      id: 'u7',
      name: 'Runway Ready',
      username: '@runwayready',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849'
    },
    audio: 'Fashion Beats - Exclusive',
    likes: 28901,
    comments: 876,
    shares: 654,
    isLiked: true
  },
  {
    id: '8',
    videoUrl: 'https://www.youtube.com/embed/hLXeDrt2CYE?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/hLXeDrt2CYE/maxresdefault.jpg',
    title: 'Style Guide 📖',
    description: 'Your complete guide to this season\'s fashion trends!',
    product: {
      id: 'p8',
      name: 'Banarasi Saree',
      price: 349.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849'
    },
    user: {
      id: 'u8',
      name: 'Style Expert',
      username: '@styleexpert',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849'
    },
    audio: 'Guide Melody - Educational',
    likes: 32156,
    comments: 982,
    shares: 743,
    isLiked: false
  },
  {
    id: '9',
    videoUrl: 'https://www.youtube.com/embed/iUoZXtCW8Ak?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/iUoZXtCW8Ak/maxresdefault.jpg',
    title: 'Latest Trends 🔥',
    description: 'Discover what\'s trending in fashion right now!',
    product: {
      id: 'p9',
      name: 'Palazzo Suit Set',
      price: 119.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849'
    },
    user: {
      id: 'u9',
      name: 'Trend Watcher',
      username: '@trendwatcher',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849'
    },
    audio: 'Trending Vibes - Hot',
    likes: 18765,
    comments: 567,
    shares: 432,
    isLiked: false
  },
  {
    id: '10',
    videoUrl: 'https://www.youtube.com/embed/W-FMjHya68U?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/W-FMjHya68U/maxresdefault.jpg',
    title: 'Premium Collection 👑',
    description: 'Exclusive pieces from our premium collection!',
    product: {
      id: 'p10',
      name: 'Designer Lehenga Choli',
      price: 299.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849'
    },
    user: {
      id: 'u10',
      name: 'Luxury Fashion',
      username: '@luxuryfashion',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849'
    },
    audio: 'Premium Sound - Exclusive',
    likes: 25432,
    comments: 765,
    shares: 598,
    isLiked: false
  },
  {
    id: '11',
    videoUrl: 'https://www.youtube.com/embed/DbsIdbsnYDQ?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/DbsIdbsnYDQ/maxresdefault.jpg',
    title: 'Festive Special 🎉',
    description: 'Perfect outfits for all your festive occasions!',
    product: {
      id: 'p11',
      name: 'Wedding Saree',
      price: 499.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849'
    },
    user: {
      id: 'u11',
      name: 'Festive Fashion',
      username: '@festivefashion',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849'
    },
    audio: 'Festive Beats - Celebratory',
    likes: 29876,
    comments: 892,
    shares: 721,
    isLiked: false
  },
  {
    id: '12',
    videoUrl: 'https://www.youtube.com/embed/ebZMaRMNXt0?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/ebZMaRMNXt0/maxresdefault.jpg',
    title: 'Traditional Wear 🏛️',
    description: 'Embrace the beauty of traditional fashion!',
    product: {
      id: 'p12',
      name: 'Traditional Kurta',
      price: 129.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849'
    },
    user: {
      id: 'u12',
      name: 'Heritage Style',
      username: '@heritagestyle',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849'
    },
    audio: 'Traditional Melodies - Classic',
    likes: 21098,
    comments: 654,
    shares: 487,
    isLiked: false
  },
  {
    id: '13',
    videoUrl: 'https://www.youtube.com/embed/mOtBUiORJP4?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/mOtBUiORJP4/maxresdefault.jpg',
    title: 'Modern Elegance 💎',
    description: 'Elegant designs for the modern woman!',
    product: {
      id: 'p13',
      name: 'Sequin Party Gown',
      price: 299.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/06.jpg?v=1775455849'
    },
    user: {
      id: 'u13',
      name: 'Elegant Fashion',
      username: '@elegantfashion',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/02_5.jpg?v=1775455849'
    },
    audio: 'Elegant Sounds - Modern',
    likes: 27654,
    comments: 789,
    shares: 632,
    isLiked: false
  },
  {
    id: '14',
    videoUrl: 'https://www.youtube.com/embed/AN8G6usBdRI?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/AN8G6usBdRI/maxresdefault.jpg',
    title: 'Casual Comfort ☁️',
    description: 'Comfortable yet stylish casual wear!',
    product: {
      id: 'p14',
      name: 'Cotton Kurta Set',
      price: 149.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/03_5.jpg?v=1775455849'
    },
    user: {
      id: 'u14',
      name: 'Casual Chic',
      username: '@casualchic',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/05_5.jpg?v=1775455849'
    },
    audio: 'Casual Vibes - Relaxed',
    likes: 19287,
    comments: 543,
    shares: 398,
    isLiked: false
  },
  {
    id: '15',
    videoUrl: 'https://www.youtube.com/embed/KZ0ioUEgUJI?autoplay=1&mute=0&rel=0&modestbranding=1',
    thumbnail: 'https://img.youtube.com/vi/KZ0ioUEgUJI/maxresdefault.jpg',
    title: 'Exclusive Designs 🎨',
    description: 'Discover our exclusive designer collection!',
    product: {
      id: 'p15',
      name: 'Silk Palazzo Suit',
      price: 189.99,
      image: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/04_5.jpg?v=1775455849'
    },
    user: {
      id: 'u15',
      name: 'Designer Studio',
      username: '@designerstudio',
      avatar: 'https://cdn.shopify.com/s/files/1/0049/3649/9315/files/01_5.jpg?v=1775455849'
    },
    audio: 'Exclusive Sounds - Designer',
    likes: 32456,
    comments: 921,
    shares: 756,
    isLiked: false
  }
]

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function ShortsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [showProduct, setShowProduct] = useState(false)
  const [showBottomMenu, setShowBottomMenu] = useState(true)
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; timestamp: number } | null>(null)

  const currentVideo = shortsData[currentIndex]

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
  }, [])

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
    }, 30000) // 30 seconds per video

    return () => {
      setAutoAdvanceTimer(timer)
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [currentIndex])

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
  }, [])

  // Handle like toggle
  const handleLike = useCallback(() => {
    setLikedVideos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(currentVideo.id)) {
        newSet.delete(currentVideo.id)
      } else {
        newSet.add(currentVideo.id)
      }
      return newSet
    })
  }, [currentVideo.id])

  // Handle share
  const handleShare = useCallback(async () => {
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

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
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
        onClick={() => window.history.back()}
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
              <iframe
                key={currentIndex}
                src={currentVideo.videoUrl}
                title={currentVideo.title}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
              />
            </div>

            {/* Video Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

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
                      ${currentVideo.product.price.toFixed(2)}
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
    </div>
  )
}
