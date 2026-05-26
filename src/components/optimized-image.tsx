'use client'

import React, { useState } from 'react'
import Image, { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string
  blurDataURL?: string
  showLoader?: boolean
  loaderColor?: string
  unoptimized?: boolean
}

/**
 * Optimized Image Component using Next.js Image
 * Features:
 * - Next.js Image optimization (WebP/AVIF)
 * - Lazy loading
 * - Responsive images
 * - Progressive loading with blur
 * - Fallback support
 * - Loading indicator
 * - Error handling
 */
export function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder-image.jpg',
  blurDataURL,
  showLoader = true,
  loaderColor = 'bg-pink-600',
  className = '',
  unoptimized = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  // Update image source when src prop changes
  React.useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    setImageSrc(src)
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    if (!hasError && imageSrc !== fallback) {
      setImageSrc(fallback)
      setHasError(true)
      setIsLoading(false)
    }
  }

  const imageComponent = (
    <Image
      src={typeof imageSrc === 'string' ? imageSrc : ''}
      alt={alt || 'Image'}
      className={`transition-opacity duration-300 ${
        isLoading ? 'opacity-0' : 'opacity-100'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      blurDataURL={blurDataURL}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      unoptimized={unoptimized}
      {...props}
    />
  )

  return (
    <div className="relative overflow-hidden">
      {isLoading && showLoader && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${loaderColor} animate-pulse z-10`}
        >
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {imageComponent}

      {blurDataURL && isLoading && (
        <div
          className="absolute inset-0 blur-2xl opacity-50 z-0"
          style={{ backgroundImage: `url(${blurDataURL})` }}
        />
      )}
    </div>
  )
}

/**
 * Simple placeholder image component
 */
export function ImagePlaceholder({
  className = '',
  text = 'No Image'
}: {
  className?: string
  text?: string
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}
    >
      <span className="text-sm">{text}</span>
    </div>
  )
}
