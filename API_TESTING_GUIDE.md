# API Testing Guide for Live Server

This guide explains how to test your APIs on live/production servers using the provided test scripts.

## 📁 Files

1. **`test-apis-live.js`** - Browser-based test script
2. **`test-apis-cli.js`** - Command-line test script (Node.js)

---

## 🌐 Method 1: Browser Console Testing (Recommended)

Use this method to test your live server from your browser.

### Step 1: Open Your Live Server

Navigate to your live server in your browser:
```
https://your-domain.com
```

### Step 2: Open Developer Console

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Opt+I` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Opt+K` (Mac)
- **Safari**: Press `Cmd+Opt+I` (Mac), enable Developer menu first in Preferences

### Step 3: Copy and Paste the Test Script

1. Open `test-apis-live.js` in your editor
2. Copy the entire content
3. Paste it into the browser console
4. Press `Enter`

### Step 4: Configure the Test Script

Before running tests, update the configuration at the top of the script:

```javascript
// Set this to your live server URL
const API_BASE = 'https://your-domain.com'; // TODO: Update this!

// Optional: Auth token for protected routes
const AUTH_TOKEN = ''; // TODO: Add if you have auth

// Enable/disable detailed logging
const VERBOSE = true;
```

### Step 5: Run the Tests

**Full Test Suite:**
```javascript
testAllAPIs()
```

**Quick Smoke Tests (Critical Endpoints Only):**
```javascript
runSmokeTests()
```

### Step 6: Review Results

The script will display:
- ✅/❌ status for each test
- Response status codes
- Response times
- Detailed response data (if VERBOSE is enabled)
- Final summary with pass rate

---

## 💻 Method 2: Command-Line Testing (Node.js)

Use this method for automated testing or CI/CD pipelines.

### Prerequisites

- Node.js installed on your machine
- Access to your live server URL

### Usage

**Basic Usage (Local Server):**
```bash
node test-apis-cli.js
```

**Test Live Server:**
```bash
node test-apis-cli.js --url https://your-domain.com
```

**Test with Authentication:**
```bash
node test-apis-cli.js --url https://your-domain.com --token YOUR_AUTH_TOKEN
```

**Quick Mode (Less Verbose):**
```bash
node test-apis-cli.js --url https://your-domain.com --quick
```

**Smoke Tests Only:**
```bash
node test-apis-cli.js --url https://your-domain.com --smoke
```

**Show Help:**
```bash
node test-apis-cli.js --help
```

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--url <url>` | Set API base URL | `http://localhost:3000` |
| `--token <token>` | Set auth token for protected routes | (none) |
| `--smoke` | Run only smoke tests (critical endpoints) | false |
| `--quick` | Quick mode (less verbose) | false |
| `--help` | Show help message | - |

---

## 🧪 Testing Specific Endpoints

### Test Suppliers and Purchase Orders

**In Browser Console:**
```javascript
// Test Suppliers
await testSuppliersAPI()

// Test Purchase Orders
await testPurchaseOrdersAPI()
```

**Command-Line:**
The CLI runs all tests, but you can modify the script to test specific endpoints.

### Test Inventory Reports

**In Browser Console:**
```javascript
// Test all inventory reports
await testInventoryReportsAPI()

// Test specific report
await testAPI('Stock Report', '/api/admin/inventory/reports/stock')
```

### Test Inventory Adjustments

**In Browser Console:**
```javascript
// Test adjustments API
await testInventoryAdjustmentsAPI()

// Create a new adjustment
await testAPI('Create Adjustment', '/api/admin/inventory/adjustments', 'POST', {
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
})
```

---

## 📊 Understanding Test Results

### Test Summary Example

```
============================================================
📊 TEST SUMMARY
============================================================

Total Tests: 45
✅ Passed: 42
❌ Failed: 3
📈 Pass Rate: 93.3%

❌ Failed Tests:
   - Create Supplier
     Status: 401
     Error: Unauthorized
   - Create Purchase Order
     Status: 401
     Error: Unauthorized
   - Create Adjustment
     Status: 401
     Error: Unauthorized

============================================================
```

### Common Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 OK | Success | None needed |
| 201 Created | Resource created | None needed |
| 400 Bad Request | Invalid request | Check request body/parameters |
| 401 Unauthorized | Missing/invalid auth | Add valid AUTH_TOKEN |
| 403 Forbidden | Insufficient permissions | Check user permissions |
| 404 Not Found | Resource doesn't exist | Verify endpoint and IDs |
| 500 Internal Server Error | Server error | Check server logs |

---

## 🔒 Testing Authenticated Endpoints

Some endpoints require authentication. To test them:

### Step 1: Get Your Auth Token

1. Login to your application
2. Open browser Developer Tools
3. Go to **Application** tab
4. Find your auth token in:
   - **Cookies** (if using cookies)
   - **Local Storage** (if storing token there)
   - **Session Storage**

### Step 2: Add Token to Test Script

**In `test-apis-live.js`:**
```javascript
const AUTH_TOKEN = 'your-auth-token-here';
```

**Command-Line:**
```bash
node test-apis-cli.js --url https://your-domain.com --token your-auth-token-here
```

---

## 🚀 CI/CD Integration

You can integrate the CLI test script into your CI/CD pipeline:

### GitHub Actions Example

```yaml
name: API Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run API Tests
        run: |
          node test-apis-cli.js \
            --url ${{ secrets.LIVE_SERVER_URL }} \
            --token ${{ secrets.AUTH_TOKEN }} \
            --smoke
```

---

## 📝 Custom Test Cases

To add custom test cases, modify the test scripts:

### Example: Add Custom Test

**In `test-apis-live.js`:**
```javascript
async function testCustomEndpoint() {
  return await testAPI('My Custom Test', '/api/custom-endpoint', 'POST', {
    param1: 'value1',
    param2: 'value2'
  });
}

// Add to testAllAPIs() function:
async function testAllAPIs() {
  const allResults = [];
  
  // ... existing tests ...
  
  // Add your custom test
  allResults.push(await testCustomEndpoint());
  
  // ...
}
```

---

## 🔍 Troubleshooting

### Issue: CORS Error in Browser

**Problem:** Browser blocks requests due to CORS policy.

**Solution:**
1. Ensure your server allows CORS from your testing domain
2. Or use the CLI script instead (no CORS restrictions)
3. Or use a browser extension that disables CORS for testing

### Issue: 401 Unauthorized on All Protected Routes

**Problem:** Auth token is missing or invalid.

**Solution:**
1. Verify your auth token is correct
2. Check if token has expired
3. Ensure you're using the correct auth header format

### Issue: Connection Refused

**Problem:** Cannot connect to the server.

**Solution:**
1. Verify the server URL is correct
2. Check if the server is running
3. Ensure firewall allows connections
4. Check if you need to use HTTPS instead of HTTP

### Issue: 500 Internal Server Error

**Problem:** Server encountered an error.

**Solution:**
1. Check server logs for detailed error messages
2. Verify request body format matches expected schema
3. Check if required database tables exist and have data

---

## 📋 Test Coverage

The test scripts cover the following endpoints:

### ✅ Health & Status
- `/api/health`

### ✅ Authentication
- `/api/auth/session`
- `/api/auth/register`
- `/api/auth/login`

### ✅ Products
- `/api/products`
- `/api/products/[id]`
- `/api/products/[id]/variants`
- `/api/products/recommendations`

### ✅ Categories
- `/api/categories`

### ✅ Coupons
- `/api/admin/coupons`
- Create coupon endpoint

### ✅ Customers
- `/api/admin/customers`
- `/api/admin/customers/[id]`

### ✅ Orders
- `/api/admin/orders`
- `/api/admin/orders/[id]`
- `/api/admin/orders/export`

### ✅ Suppliers
- `/api/admin/suppliers`
- `/api/admin/suppliers/[id]`
- Create supplier endpoint

### ✅ Purchase Orders
- `/api/admin/purchase-orders`
- `/api/admin/purchase-orders/[id]`
- Create purchase order endpoint

### ✅ Inventory Reports
- `/api/admin/inventory/reports/stock`
- `/api/admin/inventory/reports/movement`
- `/api/admin/inventory/reports/purchase`
- `/api/admin/inventory/reports/valuation`
- `/api/admin/inventory/reports/cost-analysis`

### ✅ Inventory Adjustments
- `/api/admin/inventory/adjustments`
- `/api/admin/inventory/adjustments/[id]`
- Create adjustment endpoint

### ✅ Analytics
- `/api/admin/analytics`
- `/api/admin/stats`

### ✅ Settings
- `/api/settings`
- `/api/homepage/settings`

---

## 🎯 Best Practices

1. **Test Before Deployment:** Always run smoke tests before deploying to production
2. **Use Environment Variables:** Store sensitive data (tokens, URLs) in environment variables
3. **Monitor Response Times:** Keep track of API response times
4. **Test Authenticated Endpoints:** Ensure protected routes work correctly
5. **Review Failed Tests:** Investigate and fix all failed tests before going live
6. **Automate in CI/CD:** Integrate tests into your deployment pipeline

---

## 📞 Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify your API base URL and auth token are correct
3. Ensure the server is running and accessible
4. Check network connectivity and firewall settings

---

## 📄 License

This test script is part of your project and follows the same license.
