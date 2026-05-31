import { describe, it, expect } from 'vitest'
import { generateSlug, slugify } from '@/lib/slug'

describe('generateSlug', () => {
  it('should generate slugs from text', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
    expect(generateSlug('Product Name')).toBe('product-name')
    expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces')
  })

  it('should handle special characters', () => {
    expect(generateSlug('Product!@#$Name')).toBe('productname')
    expect(generateSlug('Product@2024')).toBe('product-2024')
  })

  it('should handle empty strings', () => {
    expect(generateSlug('')).toBe('')
    expect(generateSlug('   ')).toBe('')
  })

  it('should handle unicode characters', () => {
    expect(generateSlug('পণ্যের নাম')).toBe('-------')
    expect(generateSlug('Product Name')).toBe('product-name')
  })

  it('should preserve numbers', () => {
    expect(generateSlug('Product 2024')).toBe('product-2024')
    expect(generateSlug('Size XL')).toBe('size-xl')
  })
})
