/**
 * Comprehensive API Testing Script
 * Tests all endpoints for enterprise-grade reliability
 */

interface TestResult {
  endpoint: string;
  method: string;
  passed: boolean;
  issues: string[];
  responseTime: number;
}

interface TestReport {
  category: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
let sessionToken: string | null = null;
let adminSessionToken: string | null = null;
let csrfToken: string | null = null;

// Store test results
const allResults: TestReport[] = [];

// Helper function to measure response time
async function measureResponseTime(fn: () => Promise<Response>): Promise<{ response: Response; time: number }> {
  const start = Date.now();
  const response = await fn();
  const time = Date.now() - start;
  return { response, time };
}

// Helper to create test result
function createTestResult(
  endpoint: string,
  method: string,
  passed: boolean,
  issues: string[],
  responseTime: number
): TestResult {
  return { endpoint, method, passed, issues, responseTime };
}

// Helper to parse JSON response
async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ============================================================================
// AUTHENTICATION ENDPOINTS TESTS
// ============================================================================

async function testAuthEndpoints(): Promise<TestReport> {
  console.log('\n🔐 Testing Authentication Endpoints...\n');
  const tests: TestResult[] = [];

  // Test 1: Login with invalid credentials
  {
    console.log('  Testing login with invalid credentials...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid@test.com', password: 'wrongpassword' }),
      })
    );

    const issues: string[] = [];
    if (response.status !== 401) {
      issues.push(`Expected 401, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (data.success === true) {
      issues.push('Login should fail with invalid credentials');
    }

    tests.push(createTestResult('/api/auth/login', 'POST', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 2: Login with valid credentials (admin)
  {
    console.log('  Testing login with valid admin credentials...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@scommerce.com', password: 'admin123' }),
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (!data.success) {
      issues.push('Login should succeed with valid credentials');
    }

    if (data.success && !data.data?.token) {
      issues.push('Response should include token');
    }

    if (data.success && !data.data?.user) {
      issues.push('Response should include user data');
    }

    if (data.success && data.data?.user?.role !== 'admin') {
      issues.push('User role should be admin');
    }

    // Extract session cookie for subsequent tests
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const sessionMatch = setCookie.match(/session=([^;]+)/);
      if (sessionMatch) {
        adminSessionToken = sessionMatch[1];
        sessionToken = sessionMatch[1]; // Also set regular session token
      }
    }

    if (!sessionToken) {
      issues.push('Session cookie not set');
    }

    tests.push(createTestResult('/api/auth/login', 'POST (admin)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 3: Register new user (should fail with duplicate email)
  {
    console.log('  Testing registration with duplicate email...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@scommerce.com',
          name: 'Test User',
          phone: '01712345678',
          password: 'password123',
          confirmPassword: 'password123',
        }),
      })
    );

    const issues: string[] = [];
    if (response.status !== 400 && response.status !== 409) {
      issues.push(`Expected 400 or 409, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (data.success === true) {
      issues.push('Registration should fail with duplicate email');
    }

    tests.push(createTestResult('/api/auth/register', 'POST (duplicate)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 4: Register with invalid data
  {
    console.log('  Testing registration with invalid data...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'T',
          phone: '123',
          password: 'short',
          confirmPassword: 'short',
        }),
      })
    );

    const issues: string[] = [];
    if (response.status !== 400) {
      issues.push(`Expected 400, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (data.success === true) {
      issues.push('Registration should fail with invalid data');
    }

    tests.push(createTestResult('/api/auth/register', 'POST (invalid)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 5: Get session (authenticated)
  if (sessionToken) {
    console.log('  Testing session endpoint (authenticated)...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/session`, {
        headers: { Cookie: `session=${sessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (!data.success || !data.user) {
      issues.push('Should return user session data');
    }

    tests.push(createTestResult('/api/auth/session', 'GET (auth)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 6: Get session (unauthenticated)
  {
    console.log('  Testing session endpoint (unauthenticated)...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/session`)
    );

    const issues: string[] = [];
    if (response.status !== 401) {
      issues.push(`Expected 401, got ${response.status}`);
    }

    tests.push(createTestResult('/api/auth/session', 'GET (unauth)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 7: Logout
  if (sessionToken) {
    console.log('  Testing logout endpoint...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `session=${sessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/auth/logout', 'POST', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Re-login for subsequent tests
  if (!sessionToken) {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@scommerce.com', password: 'admin123' }),
    });

    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      const sessionMatch = setCookie.match(/session=([^;]+)/);
      if (sessionMatch) {
        sessionToken = sessionMatch[1];
        adminSessionToken = sessionMatch[1];
      }
    }
  }

  return {
    category: 'Authentication',
    tests,
    totalTests: tests.length,
    passedTests: tests.filter((t) => t.passed).length,
    failedTests: tests.filter((t) => !t.passed).length,
  };
}

// ============================================================================
// CSRF PROTECTION TESTS
// ============================================================================

async function testCSRFProtection(): Promise<TestReport> {
  console.log('\n🛡️  Testing CSRF Protection...\n');
  const tests: TestResult[] = [];

  // Test 1: Try POST without CSRF token
  {
    console.log('  Testing POST without CSRF token...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionToken ? `session=${sessionToken}` : '',
        },
        body: JSON.stringify({
          name: 'Test Product',
          slug: 'test-product-csrf',
          description: 'Test description',
          price: 100,
          categoryId: 'default',
          images: ['http://test.com/image.jpg'],
          stock: 10,
        }),
      })
    );

    const issues: string[] = [];
    // Note: CSRF might be skipped in development without KV
    const data = await parseResponse(response);

    // In production, this should fail with 403
    // In development, it might work due to missing KV
    if (process.env.NODE_ENV === 'production' && response.status !== 403) {
      issues.push(`Expected 403 for missing CSRF in production, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/products', 'POST (no CSRF)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '⚠️  INFO'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  return {
    category: 'CSRF Protection',
    tests,
    totalTests: tests.length,
    passedTests: tests.filter((t) => t.passed).length,
    failedTests: tests.filter((t) => !t.passed).length,
  };
}

// ============================================================================
// SQL INJECTION TESTS
// ============================================================================

async function testSQLInjection(): Promise<TestReport> {
  console.log('\n💉 Testing SQL Injection Protection...\n');
  const tests: TestResult[] = [];

  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT * FROM users --",
    "1' AND 1=1 --",
  ];

  // Test 1: SQL injection in search
  for (const payload of sqlInjectionPayloads) {
    console.log(`  Testing SQL injection in search: "${payload}"...`);
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/products?search=${encodeURIComponent(payload)}`)
    );

    const issues: string[] = [];
    const data = await parseResponse(response);

    if (response.status === 500) {
      issues.push(`Server error (possible SQL injection): ${response.status}`);
    }

    if (data.error && data.error.toLowerCase().includes('sql')) {
      issues.push('SQL error exposed in response');
    }

    tests.push(createTestResult('/api/products', `GET (SQLi: ${payload.substring(0, 20)}...)`, issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  return {
    category: 'SQL Injection',
    tests,
    totalTests: tests.length,
    passedTests: tests.filter((t) => t.passed).length,
    failedTests: tests.filter((t) => !t.passed).length,
  };
}

// ============================================================================
// PUBLIC ENDPOINTS TESTS
// ============================================================================

async function testPublicEndpoints(): Promise<TestReport> {
  console.log('\n🌐 Testing Public Endpoints...\n');
  const tests: TestResult[] = [];

  const publicEndpoints = [
    { path: '/api/products', method: 'GET', desc: 'Products list' },
    { path: '/api/products?page=1&limit=10', method: 'GET', desc: 'Products with pagination' },
    { path: '/api/products?search=saree', method: 'GET', desc: 'Products search' },
    { path: '/api/categories', method: 'GET', desc: 'Categories list' },
    { path: '/api/stories', method: 'GET', desc: 'Stories list' },
    { path: '/api/reels', method: 'GET', desc: 'Reels list' },
    { path: '/api/banners', method: 'GET', desc: 'Banners list' },
    { path: '/api/promotions', method: 'GET', desc: 'Promotions list' },
    { path: '/api/settings', method: 'GET', desc: 'Settings' },
    { path: '/api/search/autocomplete?query=saree', method: 'GET', desc: 'Search autocomplete' },
  ];

  for (const endpoint of publicEndpoints) {
    console.log(`  Testing ${endpoint.desc}...`);
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}${endpoint.path}`, { method: endpoint.method })
    );

    const issues: string[] = [];

    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    const data = await parseResponse(response);

    // Check response structure
    if (response.ok) {
      if (!data && endpoint.path.includes('products')) {
        issues.push('Products endpoint should return data');
      }
      if (endpoint.path.includes('categories') && !data.categories && !Array.isArray(data)) {
        issues.push('Categories endpoint should return array');
      }
    }

    tests.push(createTestResult(endpoint.path, endpoint.method, issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  return {
    category: 'Public Endpoints',
    tests,
    totalTests: tests.length,
    passedTests: tests.filter((t) => t.passed).length,
    failedTests: tests.filter((t) => !t.passed).length,
  };
}

// ============================================================================
// ADMIN ENDPOINTS TESTS
// ============================================================================

async function testAdminEndpoints(): Promise<TestReport> {
  console.log('\n🔒 Testing Admin Endpoints...\n');
  const tests: TestResult[] = [];

  // Test 1: Admin products GET (unauthenticated)
  {
    console.log('  Testing admin products GET (unauthenticated)...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/products`)
    );

    const issues: string[] = [];
    if (response.status !== 401) {
      issues.push(`Expected 401, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/products', 'GET (unauth)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 2: Admin products GET (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin products GET (authenticated admin)...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/products`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (!data.success) {
      issues.push('Should return success=true');
    }

    tests.push(createTestResult('/api/admin/products', 'GET (admin)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 3: Admin stats (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin stats GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/stats`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    const data = await parseResponse(response);
    if (!data.success) {
      issues.push('Should return success=true');
    }

    tests.push(createTestResult('/api/admin/stats', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 4: Admin orders (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin orders GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/orders`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/orders', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 5: Admin categories (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin categories GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/categories`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/categories', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 6: Admin banners (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin banners GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/banners`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/banners', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 7: Admin stories (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin stories GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/stories`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/stories', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 8: Admin reels (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin reels GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/reels`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/reels', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 9: Admin promotions (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin promotions GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/promotions`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/promotions', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 10: Admin homepage settings (authenticated admin)
  if (adminSessionToken) {
    console.log('  Testing admin homepage settings GET...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/admin/homepage/settings`, {
        headers: { Cookie: `session=${adminSessionToken}` },
      })
    );

    const issues: string[] = [];
    if (response.status !== 200) {
      issues.push(`Expected 200, got ${response.status}`);
    }

    tests.push(createTestResult('/api/admin/homepage/settings', 'GET', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  return {
    category: 'Admin Endpoints',
    tests,
    totalTests: tests.length,
    passedTests: tests.filter((t) => t.passed).length,
    failedTests: tests.filter((t) => !t.passed).length,
  };
}

// ============================================================================
// EDGE CASES AND ERROR HANDLING TESTS
// ============================================================================

async function testEdgeCases(): Promise<TestReport> {
  console.log('\n🎯 Testing Edge Cases...\n');
  const tests: TestResult[] = [];

  // Test 1: Missing required fields
  {
    console.log('  Testing POST with missing required fields...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }), // Missing password
      })
    );

    const issues: string[] = [];
    if (response.status !== 400) {
      issues.push(`Expected 400 for missing fields, got ${response.status}`);
    }

    tests.push(createTestResult('/api/auth/login', 'POST (missing fields)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 2: Invalid data types
  {
    console.log('  Testing POST with invalid data types...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/products?page=invalid&limit=abc`)
    );

    const issues: string[] = [];
    // Should handle gracefully, return 400 or use defaults
    if (response.status === 500) {
      issues.push('Should not return 500 for invalid query params');
    }

    tests.push(createTestResult('/api/products', 'GET (invalid params)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 3: Very large numbers
  {
    console.log('  Testing with very large page number...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/products?page=999999&limit=100`)
    );

    const issues: string[] = [];
    if (response.status === 500) {
      issues.push('Should not return 500 for large page number');
    }

    const data = await parseResponse(response);
    if (response.ok && data.products && data.products.length !== 0) {
      issues.push('Should return empty array for out-of-range page');
    }

    tests.push(createTestResult('/api/products', 'GET (large page)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 4: XSS attempt
  {
    console.log('  Testing XSS attempt in search...');
    const xssPayload = '<script>alert("xss")</script>';
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/products?search=${encodeURIComponent(xssPayload)}`)
    );

    const issues: string[] = [];
    const data = await parseResponse(response);

    if (response.status === 500) {
      issues.push('Should not return 500 for XSS payload');
    }

    // Check if XSS is reflected in response
    const responseText = JSON.stringify(data);
    if (responseText.includes('<script>')) {
      issues.push('XSS payload reflected in response');
    }

    tests.push(createTestResult('/api/products', 'GET (XSS attempt)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 5: Empty string parameters
  {
    console.log('  Testing with empty string parameters...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/products?search=&category=&page=&limit=`)
    );

    const issues: string[] = [];
    if (response.status === 500) {
      issues.push('Should not return 500 for empty params');
    }

    tests.push(createTestResult('/api/products', 'GET (empty params)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  // Test 6: Negative numbers
  {
    console.log('  Testing with negative numbers...');
    const { response, time } = await measureResponseTime(() =>
      fetch(`${BASE_URL}/api/products?page=-1&limit=-10`)
    );

    const issues: string[] = [];
    if (response.status === 500) {
      issues.push('Should not return 500 for negative numbers');
    }

    tests.push(createTestResult('/api/products', 'GET (negative numbers)', issues.length === 0, issues, time));
    console.log(`    Status: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'} (${time}ms)`);
    if (issues.length > 0) console.log('    Issues:', issues);
  }

  return {
    category: 'Edge Cases',
    tests,
    totalTests: tests.length,
    passedTests: tests.filter((t) => t.passed).length,
    failedTests: tests.filter((t) => !t.passed).length,
  };
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE API ENDPOINT TESTING SUITE            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // Check if server is running
    console.log('\n🔍 Checking if server is running...');
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (healthCheck.ok) {
      console.log('✅ Server is running and healthy\n');
    } else {
      console.warn('⚠️  Server health check failed, continuing with tests...\n');
    }

    // Run all test suites
    const authResults = await testAuthEndpoints();
    allResults.push(authResults);

    const csrfResults = await testCSRFProtection();
    allResults.push(csrfResults);

    const sqliResults = await testSQLInjection();
    allResults.push(sqliResults);

    const publicResults = await testPublicEndpoints();
    allResults.push(publicResults);

    const adminResults = await testAdminEndpoints();
    allResults.push(adminResults);

    const edgeCaseResults = await testEdgeCases();
    allResults.push(edgeCaseResults);

    // Generate summary report
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const result of allResults) {
      console.log(`\n📊 ${result.category}:`);
      console.log(`   Total Tests: ${result.totalTests}`);
      console.log(`   ✅ Passed: ${result.passedTests}`);
      console.log(`   ❌ Failed: ${result.failedTests}`);

      if (result.failedTests > 0) {
        console.log(`\n   Failed Tests:`);
        for (const test of result.tests.filter((t) => !t.passed)) {
          console.log(`     - ${test.method} ${test.endpoint}`);
          for (const issue of test.issues) {
            console.log(`       • ${issue}`);
          }
        }
      }

      totalTests += result.totalTests;
      totalPassed += result.passedTests;
      totalFailed += result.failedTests;
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                 OVERALL RESULTS                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`Pass Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);

    // Generate JSON report for CI/CD
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      environment: process.env.NODE_ENV || 'development',
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        passRate: ((totalPassed / totalTests) * 100).toFixed(2) + '%',
      },
      results: allResults,
    };

    // Save report to file
    const reportPath = '/home/z/my-project/api-test-report.json';
    await Bun.write(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with error code if tests failed
    if (totalFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
main();
