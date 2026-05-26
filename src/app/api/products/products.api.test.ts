import { describe, it, expect, beforeAll } from 'bun:test';
import { GET } from './route';

// Helper function to create a mock request
function createMockRequest(url: string, headers?: Record<string, string>): Request {
  return new Request(url, {
    headers: new Headers(headers)
  });
}

describe('GET /api/products', () => {
  it('should return products successfully', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?page=1&limit=12');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.products).toBeInstanceOf(Array);
    expect(data.data.pagination).toBeDefined();
  });

  it('should handle pagination parameters', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?page=1&limit=5');

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(5);
  });

  it('should handle search parameter', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?search=test');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.products).toBeInstanceOf(Array);
  });

  it('should handle category filter', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?category=clothing');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.products).toBeInstanceOf(Array);
  });

  it('should handle type filter (featured)', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?type=featured');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.products).toBeInstanceOf(Array);
  });

  it('should handle type filter (sale)', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?type=sale');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.products).toBeInstanceOf(Array);
  });

  it('should include cache headers', async () => {
    const request = createMockRequest('http://localhost:3000/api/products');

    const response = await GET(request);

    expect(response.headers.get('cache-control')).toBeTruthy();
  });

  it('should handle invalid pagination gracefully', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?page=1&limit=999999');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    // The API should validate limit to prevent excessive queries
    // Note: exact validation behavior depends on the API implementation
    expect(data.data.products).toBeInstanceOf(Array);
  });

  it('should handle price range filters', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?minPrice=100&maxPrice=1000');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.products).toBeInstanceOf(Array);
  });

  it('should return pagination metadata', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?page=1&limit=10');

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalCount: expect.any(Number),
      totalPages: expect.any(Number),
      hasNextPage: expect.any(Boolean),
      hasPrevPage: expect.any(Boolean)
    });
  });

  it('should include product images', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?limit=1');

    const response = await GET(request);
    const data = await response.json();

    if (data.data.products.length > 0) {
      const product = data.data.products[0];
      expect(product).toHaveProperty('image');
      expect(product).toHaveProperty('images');
    }
  });

  it('should include rating data', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?limit=1');

    const response = await GET(request);
    const data = await response.json();

    if (data.data.products.length > 0) {
      const product = data.data.products[0];
      expect(product).toHaveProperty('rating');
      expect(product).toHaveProperty('reviews');
    }
  });

  it('should handle sorting', async () => {
    const request = createMockRequest('http://localhost:3000/api/products?sortBy=price&sortOrder=asc');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.products).toBeInstanceOf(Array);
  });
});
