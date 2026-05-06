import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a human-readable order number with prefix and sequence
 * Format: ORD-YYYY-NNNNNN (e.g., ORD-2025-000123)
 *
 * @param lastSequenceNumber - The last sequence number used (for continuation)
 * @returns Formatted order number
 */
export function generateOrderNumber(lastSequenceNumber?: number): string {
  const year = new Date().getFullYear()
  const sequence = (lastSequenceNumber || 0) + 1
  const paddedSequence = sequence.toString().padStart(6, '0')
  return `ORD-${year}-${paddedSequence}`
}

/**
 * Extract year and sequence from an order number
 * Useful for database queries and order lookup
 *
 * @param orderNumber - The order number to parse
 * @returns Object with year and sequence number, or null if invalid format
 */
export function parseOrderNumber(orderNumber: string): { year: number; sequence: number } | null {
  const match = orderNumber.match(/^ORD-(\d{4})-(\d{6})$/)
  if (!match) return null

  return {
    year: parseInt(match[1]),
    sequence: parseInt(match[2])
  }
}
