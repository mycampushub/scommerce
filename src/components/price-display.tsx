'use client'

import { useFormatCurrency } from '@/hooks/use-format-currency'

interface PriceDisplayProps {
  value: number
  showDecimals?: boolean
  className?: string
  originalPrice?: number
}

/**
 * Reusable component for displaying prices with currency formatting
 * Uses settings from SettingsContext for dynamic currency symbol
 */
export function PriceDisplay({ value, showDecimals = true, className = '', originalPrice }: PriceDisplayProps) {
  const { formatCurrency } = useFormatCurrency()

  if (originalPrice && originalPrice > value) {
    // Show original price with strikethrough and discount price
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-bold text-pink-600">
          {formatCurrency(value, showDecimals)}
        </span>
        <span className="text-sm text-gray-400 line-through">
          {formatCurrency(originalPrice, showDecimals)}
        </span>
      </div>
    )
  }

  return (
    <span className={className}>
      {formatCurrency(value, showDecimals)}
    </span>
  )
}
