#!/usr/bin/env node

/**
 * API Test Script for Command Line (Node.js)
 * 
 * Usage:
 *   node test-apis-cli.js [options]
 * 
 * Options:
 *   --url <url>        Set API base URL (default: http://localhost:3000)
 *   --token <token>    Set auth token for protected routes
 *   --smoke            Run only smoke tests (critical endpoints)
 *   --quick            Quick mode (less verbose)
 *   --help             Show help
 * 
 * Examples:
 *   node test-apis-cli.js --url https://your-domain.com
 *   node test-apis-cli.js --url https://your-domain.com --token abc123
 *   node test-apis-cli.js --smoke
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url: 'http://localhost:3000',
  token: '',
  smoke: false,
  verbose: true
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url':
      options.url = args[++i];
      break;
    case '--token':
      options.token = args[++i];
      break;
    case '--smoke':
      options.smoke = true;
      break;
    case '--quick':
      options.verbose = false;
      break;
    case '--help':
      console.log(`
API Test Script for Command Line

Usage:
  node test-apis-cli.js [options]

Options:
  --url <url>        Set API base URL (default: http://localhost:3000)
  --token <token>    Set auth token for protected routes
  --smoke            Run only smoke tests (critical endpoints)
  --quick            Quick mode (less verbose)
  --help             Show help

Examples:
  node test-apis-cli.js --url https://your-domain.com
  node test-apis-cli.js --url https://your-domain.com --token abc123
  node test-apis-cli.js --smoke
      `);
      process.exit(0);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Make HTTP request
 */
function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
        ...headers
      }
    };
    
    if (body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }
    
    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData,
            headers: res.headers
          });
        } catch {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Test an API endpoint
 */
async function testAPI(name, endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${options.url}${endpoint}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📡 Testing: ${name}`);
  console.log(`   Method: ${method}`);
  console.log(`   URL: ${url}`);
  if (body && options.verbose) console.log(`   Body:`, JSON.stringify(body, null, 2));
  console.log(`${'='.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(method, url, body, headers);
    const duration = Date.now() - startTime;
    
    const statusIcon = response.status >= 200 && response.status < 300 ? '✅' : '❌';
    console.log(`\n${statusIcon} Status: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Success: ${response.status >= 200 && response.status < 300}`);
    
    if (options.verbose) {
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    }
    
    return {
      name,
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      duration,
      data: response.data,
      error: response.status >= 200 && response.status < 300 ? null : response.data
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ Error: ${error.message}`);
    console.log(`   Duration: ${duration}ms`);
    
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
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
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

async function testHealthCheck() {
  return await testAPI('Health Check', '/api/health');
}

async function testProductsAPI() {
  const results = [];
  results.push(await testAPI('Get All Products', '/api/products'));
  results.push(await testAPI('Get Product by ID', '/api/products/1'));
  results.push(await testAPI('Get Product Variants', '/api/products/1/variants'));
  results.push(await testAPI('Product Recommendations', '/api/products/recommendations'));
  return results;
}

async function testCategoriesAPI() {
  const results = [];
  results.push(await testAPI('Get All Categories', '/api/categories'));
  return results;
}

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

async function testInventoryReportsAPI() {
  const results = [];
  results.push(await testAPI('Stock Report', '/api/admin/inventory/reports/stock'));
  results.push(await testAPI('Movement Report', '/api/admin/inventory/reports/movement'));
  results.push(await testAPI('Purchase Report', '/api/admin/inventory/reports/purchase'));
  results.push(await testAPI('Valuation Report', '/api/admin/inventory/reports/valuation'));
  results.push(await testAPI('Cost Analysis Report', '/api/admin/inventory/reports/cost-analysis'));
  return results;
}

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

async function testOrdersAPI() {
  const results = [];
  results.push(await testAPI('Get All Orders', '/api/admin/orders'));
  results.push(await testAPI('Get Order by ID', '/api/admin/orders/1'));
  results.push(await testAPI('Export Orders', '/api/admin/orders/export'));
  return results;
}

async function testAnalyticsAPI() {
  const results = [];
  results.push(await testAPI('Get Analytics Data', '/api/admin/analytics'));
  results.push(await testAPI('Get Admin Stats', '/api/admin/stats'));
  return results;
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function testAllAPIs() {
  console.log('\n🚀 Starting Comprehensive API Tests');
  console.log(`🌐 Server: ${options.url}`);
  console.log(`🔐 Auth: ${options.token ? 'Enabled' : 'Disabled'}`);
  console.log(`📝 Verbose: ${options.verbose}\n`);
  
  const allResults = [];
  
  allResults.push(await testHealthCheck());
  allResults.push(...await testProductsAPI());
  allResults.push(...await testCategoriesAPI());
  allResults.push(...await testSuppliersAPI());
  allResults.push(...await testPurchaseOrdersAPI());
  allResults.push(...await testInventoryReportsAPI());
  allResults.push(...await testInventoryAdjustmentsAPI());
  allResults.push(...await testOrdersAPI());
  allResults.push(...await testAnalyticsAPI());
  
  const summary = printSummary(allResults);
  
  // Exit with error code if any tests failed
  process.exit(summary.failed > 0 ? 1 : 0);
}

async function runSmokeTests() {
  console.log('\n🔥 Running Smoke Tests (Critical Endpoints Only)');
  console.log(`🌐 Server: ${options.url}\n`);
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testAPI('Get All Products', '/api/products'));
  results.push(await testAPI('Get All Categories', '/api/categories'));
  results.push(await testAPI('Get All Suppliers', '/api/admin/suppliers'));
  results.push(await testAPI('Get All Purchase Orders', '/api/admin/purchase-orders'));
  results.push(await testAPI('Stock Report', '/api/admin/inventory/reports/stock'));
  
  const summary = printSummary(results);
  
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Run tests
(async () => {
  try {
    if (options.smoke) {
      await runSmokeTests();
    } else {
      await testAllAPIs();
    }
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  }
})();
