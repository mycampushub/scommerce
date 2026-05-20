/**
 * Comprehensive API Test Script for Live/Production Server
 * 
 * Usage:
 * 1. In Browser Console:
 *    - Paste this script directly
 *    - Update API_BASE to your live server URL
 *    - Run testAllAPIs()
 * 
 * 2. With Node.js:
 *    - node test-apis-live.js
 * 
 * 3. With curl:
 *    - curl https://your-domain.com/api/health
 * 
 * Configuration:
 * - Set API_BASE to your live server URL (e.g., 'https://your-domain.com' or 'http://localhost:3000')
 * - Set AUTH_TOKEN if testing authenticated endpoints
 */

// ============================================
// CONFIGURATION
// ============================================

// Set this to your live server URL
const API_BASE = 'https://your-live-domain.com'; // TODO: Update this!

// Optional: Auth token for protected routes
const AUTH_TOKEN = ''; // TODO: Add if you have auth

// Enable/disable detailed logging
const VERBOSE = true;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Test an API endpoint
 */
async function testAPI(name, endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📡 Testing: ${name}`);
  console.log(`   Method: ${method}`);
  console.log(`   URL: ${url}`);
  if (body) console.log(`   Body:`, JSON.stringify(body, null, 2));
  console.log(`${'='.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    // Try to parse JSON, fallback to text
    let data;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    
    const statusIcon = response.ok ? '✅' : '❌';
    console.log(`\n${statusIcon} Status: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Success: ${response.ok}`);
    
    if (VERBOSE) {
      console.log(`   Response:`, data);
    }
    
    return {
      name,
      success: response.ok,
      status: response.status,
      duration,
      data,
      error: response.ok ? null : data
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ Error: ${error.message}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Stack:`, error.stack);
    
    return {
      name,
      success: false,
      status: 0,
      duration,
      error: error.message,
      data: null
    };
  }
}

/**
 * Print test summary
 */
function printSummary(results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        console.log(`     Status: ${r.status}`);
        console.log(`     Error: ${r.error || 'Unknown error'}`);
      });
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
  
  return { total, passed, failed, passRate };
}

// ============================================
// TEST SUITES
// ============================================

/**
 * Test Health Check
 */
async function testHealthCheck() {
  return await testAPI('Health Check', '/api/health');
}

/**
 * Test Authentication Endpoints
 */
async function testAuthEndpoints() {
  const results = [];
  
  results.push(await testAPI('Get Session', '/api/auth/session'));
  results.push(await testAPI('Register', '/api/auth/register', 'POST', {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#'
  }));
  results.push(await testAPI('Login', '/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'admin123'
  }));
  
  return results;
}

/**
 * Test Products API
 */
async function testProductsAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Products', '/api/products'));
  results.push(await testAPI('Get Product by ID', '/api/products/1'));
  results.push(await testAPI('Get Product Variants', '/api/products/1/variants'));
  results.push(await testAPI('Product Recommendations', '/api/products/recommendations'));
  
  return results;
}

/**
 * Test Categories API
 */
async function testCategoriesAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Categories', '/api/categories'));
  
  return results;
}

/**
 * Test Coupons API
 */
async function testCouponsAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Coupons', '/api/admin/coupons'));
  results.push(await testAPI('Create Coupon', '/api/admin/coupons', 'POST', {
    code: `TEST${Date.now()}`,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 100,
    maxUses: 100,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  return results;
}

/**
 * Test Customers API
 */
async function testCustomersAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Customers', '/api/admin/customers'));
  results.push(await testAPI('Get Customer by ID', '/api/admin/customers/1'));
  
  return results;
}

/**
 * Test Orders API
 */
async function testOrdersAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Orders', '/api/admin/orders'));
  results.push(await testAPI('Get Order by ID', '/api/admin/orders/1'));
  results.push(await testAPI('Export Orders', '/api/admin/orders/export'));
  
  return results;
}

/**
 * Test Suppliers API
 */
async function testSuppliersAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Suppliers', '/api/admin/suppliers'));
  results.push(await testAPI('Get Supplier by ID', '/api/admin/suppliers/supplier-001'));
  results.push(await testAPI('Create Supplier', '/api/admin/suppliers', 'POST', {
    name: 'Test Supplier',
    email: 'test@supplier.com',
    phone: '+1-555-9999',
    address: '123 Test Street, Test City, TC 12345',
    status: 'ACTIVE',
    paymentTerms: 'NET_30'
  }));
  
  return results;
}

/**
 * Test Purchase Orders API
 */
async function testPurchaseOrdersAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Purchase Orders', '/api/admin/purchase-orders'));
  results.push(await testAPI('Get Purchase Order by ID', '/api/admin/purchase-orders/PO-2024-001'));
  results.push(await testAPI('Create Purchase Order', '/api/admin/purchase-orders', 'POST', {
    supplierId: 'supplier-001',
    expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Test purchase order',
    items: [
      {
        productId: '1',
        quantity: 10,
        unitCost: 100
      }
    ]
  }));
  
  return results;
}

/**
 * Test Inventory Reports API
 */
async function testInventoryReportsAPI() {
  const results = [];
  
  results.push(await testAPI('Stock Report', '/api/admin/inventory/reports/stock'));
  results.push(await testAPI('Movement Report', '/api/admin/inventory/reports/movement'));
  results.push(await testAPI('Purchase Report', '/api/admin/inventory/reports/purchase'));
  results.push(await testAPI('Valuation Report', '/api/admin/inventory/reports/valuation'));
  results.push(await testAPI('Cost Analysis Report', '/api/admin/inventory/reports/cost-analysis'));
  
  return results;
}

/**
 * Test Inventory Movements API
 */
async function testInventoryMovementsAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Inventory Movements', '/api/admin/inventory/movements'));
  results.push(await testAPI('Get Movements by Product', '/api/admin/inventory/movements/product/1'));
  
  return results;
}

/**
 * Test Inventory Adjustments API
 */
async function testInventoryAdjustmentsAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Inventory Adjustments', '/api/admin/inventory/adjustments'));
  results.push(await testAPI('Get Adjustment by ID', '/api/admin/inventory/adjustments/1'));
  results.push(await testAPI('Create Adjustment', '/api/admin/inventory/adjustments', 'POST', {
    type: 'ADDITION',
    reason: 'TEST',
    notes: 'Test adjustment',
    items: [
      {
        productId: '1',
        quantity: 5,
        reason: 'TEST',
        notes: 'Test item'
      }
    ]
  }));
  
  return results;
}

/**
 * Test Analytics API
 */
async function testAnalyticsAPI() {
  const results = [];
  
  results.push(await testAPI('Get Analytics Data', '/api/admin/analytics'));
  results.push(await testAPI('Get Admin Stats', '/api/admin/stats'));
  
  return results;
}

/**
 * Test Upload API
 */
async function testUploadAPI() {
  const results = [];
  
  results.push(await testAPI('Get Admin Upload', '/api/admin/upload', 'GET'));
  
  return results;
}

/**
 * Test Reels API
 */
async function testReelsAPI() {
  const results = [];
  
  results.push(await testAPI('Get All Reels', '/api/reels'));
  results.push(await testAPI('Get Admin Reels', '/api/admin/reels'));
  
  return results;
}

/**
 * Test Settings API
 */
async function testSettingsAPI() {
  const results = [];
  
  results.push(await testAPI('Get Settings', '/api/settings'));
  results.push(await testAPI('Get Homepage Settings', '/api/homepage/settings'));
  
  return results;
}

// ============================================
// MAIN TEST RUNNER
// ============================================

/**
 * Run all API tests
 */
async function testAllAPIs() {
  console.log('\n🚀 Starting Comprehensive API Tests');
  console.log(`🌐 Server: ${API_BASE}`);
  console.log(`🔐 Auth: ${AUTH_TOKEN ? 'Enabled' : 'Disabled'}`);
  console.log(`📝 Verbose: ${VERBOSE}\n`);
  
  const allResults = [];
  
  // Run test suites
  allResults.push(await testHealthCheck());
  allResults.push(...await testAuthEndpoints());
  allResults.push(...await testProductsAPI());
  allResults.push(...await testCategoriesAPI());
  allResults.push(...await testCouponsAPI());
  allResults.push(...await testCustomersAPI());
  allResults.push(...await testOrdersAPI());
  allResults.push(...await testSuppliersAPI());
  allResults.push(...await testPurchaseOrdersAPI());
  allResults.push(...await testInventoryReportsAPI());
  allResults.push(...await testInventoryMovementsAPI());
  allResults.push(...await testInventoryAdjustmentsAPI());
  allResults.push(...await testAnalyticsAPI());
  allResults.push(...await testUploadAPI());
  allResults.push(...await testReelsAPI());
  allResults.push(...await testSettingsAPI());
  
  // Print summary
  const summary = printSummary(allResults);
  
  return summary;
}

/**
 * Run quick smoke tests (critical endpoints only)
 */
async function runSmokeTests() {
  console.log('\n🔥 Running Smoke Tests (Critical Endpoints Only)');
  console.log(`🌐 Server: ${API_BASE}\n`);
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testAPI('Get All Products', '/api/products'));
  results.push(await testAPI('Get All Categories', '/api/categories'));
  results.push(await testAPI('Get All Suppliers', '/api/admin/suppliers'));
  results.push(await testAPI('Get All Purchase Orders', '/api/admin/purchase-orders'));
  results.push(await testAPI('Stock Report', '/api/admin/inventory/reports/stock'));
  
  const summary = printSummary(results);
  
  return summary;
}

// ============================================
// EXPORTS (for Node.js)
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testAPI,
    testAllAPIs,
    runSmokeTests,
    testHealthCheck,
    testProductsAPI,
    testSuppliersAPI,
    testPurchaseOrdersAPI,
    testInventoryReportsAPI
  };
}

// ============================================
// AUTO-RUN (for Browser)
// ============================================

// To run automatically in browser, uncomment the following lines:
// testAllAPIs();
// OR for quick tests:
// runSmokeTests();

console.log(`
╔════════════════════════════════════════════════════════════╗
║           API Test Script Loaded Successfully!              ║
╠════════════════════════════════════════════════════════════╣
║  Usage:                                                    ║
║    1. Update API_BASE to your server URL                   ║
║    2. (Optional) Add AUTH_TOKEN for protected routes       ║
║    3. Run: testAllAPIs() for full tests                    ║
║       OR runSmokeTests() for quick tests                   ║
╚════════════════════════════════════════════════════════════╝
`);
