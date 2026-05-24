/**
 * Responsive Design Utilities
 * Helper functions and hooks for responsive design
 */

import { useEffect, useState } from 'react'

// Breakpoint definitions (in pixels)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

/**
 * Hook to get current window size
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowSize()
  return getCurrentBreakpoint(width)
}

/**
 * Hook to check if current breakpoint is mobile
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'xs' || breakpoint === 'sm'
}

/**
 * Hook to check if current breakpoint is tablet
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'md'
}

/**
 * Hook to check if current breakpoint is desktop
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl'
}

/**
 * Get responsive value based on breakpoint
 */
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint,
  defaultValue: T
): T {
  // Check from largest to smallest breakpoint
  const breakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']

  for (const bp of breakpoints) {
    if (BREAKPOINTS[bp] <= BREAKPOINTS[currentBreakpoint] && values[bp] !== undefined) {
      return values[bp]!
    }
  }

  return defaultValue
}

/**
 * Hook to get responsive value
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint()
  return getResponsiveValue(values, breakpoint, defaultValue)
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - deprecated but still useful
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Get safe area insets for mobile devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const computedStyle = getComputedStyle(document.documentElement)
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
  }
}
