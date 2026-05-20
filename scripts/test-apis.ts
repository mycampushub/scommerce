#!/usr/bin/env bun
/**
 * API Test Script for SCommerce
 * Tests all inventory and admin APIs to verify they are working correctly
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

type TestResult = {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
};

const results: TestResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, 'green');
}

function error(message: string) {
  log(`✗ ${message}`, 'red');
}

function info(message: string) {
  log(`ℹ ${message}`, 'blue');
}

function warn(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

async function testAPI(name: string, url: string, method: string = 'GET', body?: any): Promise<TestResult> {
  info(`Testing: ${name}`);
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    if (response.ok && data.success !== false) {
      success(`${name} - Status: ${response.status}`);
      return { name, passed: true, message: `Status: ${response.status}`, details: data };
    } else {
      error(`${name} - Status: ${response.status}`);
      console.log('  Response:', data);
      return { name, passed: false, message: `Status: ${response.status} - ${data.error || 'Unknown error'}`, details: data };
    }
  } catch (e: any) {
    error(`${name} - Error: ${e.message}`);
    return { name, passed: false, message: `Exception: ${e.message}`, details: e };
  }
}

async function runTests() {
  log('\n========================================', 'cyan');
  log('  SCommerce API Test Suite', 'cyan');
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
runTests().catch(error => {
  error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
