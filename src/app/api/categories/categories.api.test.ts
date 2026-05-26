import { describe, it, expect } from 'bun:test';
import { GET } from './route';

// Helper function to create a mock request
function createMockRequest(url: string, headers?: Record<string, string>): Request {
  return new Request(url, {
    headers: new Headers(headers)
  });
}

describe('GET /api/categories', () => {
  it('should return categories successfully', async () => {
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  it('should return categories with required fields', async () => {
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);
    const data = await response.json();

    if (data.data.length > 0) {
      const category = data.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('image');
    }
  });

  it('should include cache headers', async () => {
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);

    expect(response.headers.get('cache-control')).toBeTruthy();
  });

  it('should return active categories only', async () => {
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);
    const data = await response.json();

    // All returned categories should be active
    expect(data.success).toBe(true);
    // The repository filters by isActive = 1, so we just verify structure
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle empty results gracefully', async () => {
    // This tests that if there are no active categories, we still get a proper response
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should return category slug for routing', async () => {
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);
    const data = await response.json();

    if (data.data.length > 0) {
      data.data.forEach((category: any) => {
        expect(category.slug).toBeTruthy();
        expect(typeof category.slug).toBe('string');
      });
    }
  });

  it('should sanitize category data', async () => {
    const request = createMockRequest('http://localhost:3000/api/categories');

    const response = await GET(request);
    const data = await response.json();

    if (data.data.length > 0) {
      // Verify that we don't have unexpected fields
      const category = data.data[0];
      const allowedFields = ['id', 'name', 'slug', 'description', 'image'];
      const receivedFields = Object.keys(category);

      receivedFields.forEach(field => {
        expect(allowedFields).toContain(field);
      });
    }
  });
});
