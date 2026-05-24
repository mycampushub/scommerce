'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string
  blurDataURL?: string
  showLoader?: boolean
  loaderColor?: string
}

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading
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
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && showLoader && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${loaderColor} animate-pulse`}
        >
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <img
        ref={imgRef}
        src={typeof imageSrc === 'string' ? imageSrc : undefined}
        alt={alt || 'Image'}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {blurDataURL && isLoading && (
        <div
          className="absolute inset-0 blur-2xl opacity-50"
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
