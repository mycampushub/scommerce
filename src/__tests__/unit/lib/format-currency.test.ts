import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/lib/format-currency'

describe('formatCurrency', () => {
  it('should format BDT currency correctly', () => {
    expect(formatCurrency(1000)).toBe('৳1,000')
    expect(formatCurrency(0)).toBe('৳0')
    expect(formatCurrency(1234.56)).toBe('৳1,235')
  })

  it('should handle negative values', () => {
    expect(formatCurrency(-100)).toBe('-৳100')
    expect(formatCurrency(-1234)).toBe('-৳1,234')
  })

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('৳1,000,000')
    expect(formatCurrency(999999999)).toBe('৳999,999,999')
  })
})
