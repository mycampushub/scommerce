import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '@/app/api/products/route'

describe('Products API', () => {
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = global.fetch as any
  })

  it('should return products list', async () => {
    const request = new Request('http://localhost:3000/api/products?limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success')
  })

  it('should handle pagination with limit and offset', async () => {
    const request = new Request('http://localhost:3000/api/products?limit=5&offset=0')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
  })

  it('should filter by category', async () => {
    const request = new Request('http://localhost:3000/api/products?categoryId=test-id')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })
})
