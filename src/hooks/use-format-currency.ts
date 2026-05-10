'use client'

import { useSettings } from '@/contexts/SettingsContext'

/**
 * Hook to format currency using settings
 * Returns a function that formats monetary values with the current currency symbol
 */
export function useFormatCurrency() {
  const { settings } = useSettings()

  /**
   * Format a numeric value as currency
   * @param value - The numeric value to format
   * @param showDecimals - Whether to show decimal places (default: true)
   * @returns Formatted currency string (e.g., "৳1,234.56")
   */
  const formatCurrency = (value: number, showDecimals: boolean = true): string => {
    const currencySymbol = settings?.currencySymbol || '৳'
    const absoluteValue = Math.abs(value)

    const formattedAmount = absoluteValue.toLocaleString('en-BD', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })

    return value < 0
      ? `-${currencySymbol}${formattedAmount}`
      : `${currencySymbol}${formattedAmount}`
  }

  return { formatCurrency, settings }
}
