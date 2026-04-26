'use client'

import { useState, useEffect, useRef } from 'react'

export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    // Initialize with current scroll position
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Use requestAnimationFrame for smooth, consistent updates
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const scrollDelta = currentScrollY - lastScrollY.current
          const direction = scrollDelta > 0 ? 'down' : 'up'

          // Always show when at the top
          if (currentScrollY < 10) {
            setIsVisible(true)
          } else {
            // Show when scrolling UP, hide when scrolling DOWN
            // Only update if scrolled more than 5 pixels to prevent jitter
            if (Math.abs(scrollDelta) > 5) {
              if (direction === 'up') {
                // Scrolling UP - show the nav
                setIsVisible(true)
              } else {
                // Scrolling DOWN - hide the nav
                setIsVisible(false)
              }
              lastScrollY.current = currentScrollY
            }
          }

          ticking.current = false
        })
        ticking.current = true
      }
    }

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return isVisible
}
