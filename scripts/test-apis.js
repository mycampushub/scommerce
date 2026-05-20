#!/usr/bin/env node
/**
 * API Test Script for SCommerce (Node.js version)
 * Tests all inventory and admin APIs to verify they are working correctly
 * Run with: node scripts/test-apis.js
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let results = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

async function testAPI(name, url, method = 'GET', body = null) {
  info(`Testing: ${name}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (response.ok && data.success !== false) {
      success(`${name} - Status: ${response.status}`);
      // Show data count if available
      if (data.data && Array.isArray(data.data)) {
        log(`  → Found ${data.data.length} items`, 'blue');
      } else if (data.products && Array.isArray(data.products)) {
        log(`  → Found ${data.products.length} products`, 'blue');
      }
      return { name, passed: true, message: `Status: ${response.status}`, details: data };
    } else {
      error(`${name} - Status: ${response.status}`);
      console.log('  Response:', JSON.stringify(data, null, 2));
      return { name, passed: false, message: `Status: ${response.status} - ${data.error || data.message || 'Unknown error'}`, details: data };
    }
  } catch (e) {
    error(`${name} - Error: ${e.message}`);
    return { name, passed: false, message: `Exception: ${e.message}`, details: e.stack };
  }
}

async function runTests() {
  log('\n========================================', 'cyan');
  log('  SCommerce API Test Suite (Node.js)', 'cyan');
  log('========================================\n', 'cyan');
  
  info(`Base URL: ${BASE_URL}`);
  info(`Testing Time: ${new Date().toISOString()}\n`);

  // ==================== Products API ====================
  log('\n--- Products API ---', 'cyan');
  results.push(await testAPI('Get All Products', '/api/admin/products'));
  results.push(await testAPI('Get Active Products', '/api/admin/products?isActive=true'));

  // ==================== Suppliers API ====================
  log('\n--- Suppliers API ---', 'cyan');
  results.push(await testAPI('Get All Suppliers', '/api/admin/suppliers'));
  results.push(await testAPI('Get Active Suppliers', '/api/admin/suppliers?activeOnly=true'));

  // ==================== Purchase Orders API ====================
  log('\n--- Purchase Orders API ---', 'cyan');
  results.push(await testAPI('Get All Purchase Orders', '/api/admin/purchase-orders'));
  results.push(await testAPI('Get Pending Purchase Orders', '/api/admin/purchase-orders?status=PENDING'));

  // ==================== Inventory Movements API ====================
  log('\n--- Inventory Movements API ---', 'cyan');
  results.push(await testAPI('Get All Inventory Movements', '/api/admin/inventory/movements'));
  results.push(await testAPI('Get Purchase Movements', '/api/admin/inventory/movements?movementType=PURCHASE'));
  results.push(await testAPI('Get Sale Movements', '/api/admin/inventory/movements?movementType=SALE'));

  // ==================== Inventory Adjustments API ====================
  log('\n--- Inventory Adjustments API ---', 'cyan');
  results.push(await testAPI('Get All Stock Adjustments', '/api/admin/inventory/adjustments'));
  results.push(await testAPI('Get Pending Adjustments', '/api/admin/inventory/adjustments?approved=false'));

  // ==================== Inventory Reports API ====================
  log('\n--- Inventory Reports API ---', 'cyan');
  
  // Stock Status Report
  results.push(await testAPI('Stock Status Report', '/api/admin/inventory/reports/stock'));
  
  // Valuation Report
  results.push(await testAPI('Inventory Valuation Report', '/api/admin/inventory/reports/valuation'));
  
  // Cost Analysis Report
  results.push(await testAPI('Cost Analysis Report', '/api/admin/inventory/reports/cost-analysis'));
  
  // Movement Report
  results.push(await testAPI('Movement Report', '/api/admin/inventory/reports/movement?days=30'));
  
  // Purchase Report
  results.push(await testAPI('Purchase Report', '/api/admin/inventory/reports/purchase?days=30'));

  // ==================== Inventory Alerts API ====================
  log('\n--- Inventory Alerts API ---', 'cyan');
  results.push(await testAPI('Get All Inventory Alerts', '/api/admin/inventory/alerts'));
  results.push(await testAPI('Get Unresolved Alerts', '/api/admin/inventory/alerts?isResolved=false'));

  // ==================== Stats API ====================
  log('\n--- Admin Stats API ---', 'cyan');
  results.push(await testAPI('Admin Stats', '/api/admin/stats'));

  // ==================== Summary ====================
  log('\n========================================', 'cyan');
  log('  Test Summary', 'cyan');
  log('========================================\n', 'cyan');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  success(`Passed: ${passed}/${total}`);
  if (failed > 0) {
    error(`Failed: ${failed}/${total}`);
  }

  log('\n--- Failed Tests ---', 'red');
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length === 0) {
    success('All tests passed!');
  } else {
    failedTests.forEach(test => {
      error(`${test.name}: ${test.message}`);
    });
  }

  log('\n--- Detailed Results ---', 'cyan');
  results.forEach(result => {
    if (result.passed) {
      success(`${result.name}: ${result.message}`);
    } else {
      error(`${result.name}: ${result.message}`);
    }
  });

  log('\n========================================\n', 'cyan');

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(err => {
  error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
