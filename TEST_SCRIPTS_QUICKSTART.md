# API Testing Scripts - Quick Start Guide

Three test scripts are available to test your live server APIs.

---

## 📁 Test Scripts

1. **`test-apis-live.js`** - Browser-based testing (recommended for quick tests)
2. **`test-apis-cli.js`** - Command-line testing with Node.js
3. **`test-apis-curl.sh`** - Command-line testing with curl (no dependencies)

---

## 🚀 Quick Start

### Option 1: Browser Testing (Easiest)

1. Open your live server in browser: `https://your-domain.com`
2. Press `F12` to open Developer Console
3. Copy contents of `test-apis-live.js` and paste into console
4. Update `API_BASE` at the top of the script:
   ```javascript
   const API_BASE = 'https://your-domain.com';
   ```
5. Run tests:
   ```javascript
   testAllAPIs()  // Full test suite
   runSmokeTests()  // Quick smoke tests
   ```

### Option 2: Node.js CLI (Best for automation)

```bash
# Test live server
node test-apis-cli.js --url https://your-domain.com

# With authentication
node test-apis-cli.js --url https://your-domain.com --token YOUR_TOKEN

# Smoke tests only
node test-apis-cli.js --url https://your-domain.com --smoke

# Quick mode (less verbose)
node test-apis-cli.js --url https://your-domain.com --quick
```

### Option 3: Curl Script (No dependencies)

```bash
# Make script executable
chmod +x test-apis-curl.sh

# Run tests
./test-apis-curl.sh https://your-domain.com

# With authentication
./test-apis-curl.sh https://your-domain.com "your-auth-token"
```

---

## 📊 What Gets Tested

### Critical Endpoints (Smoke Tests)
- ✅ Health Check
- ✅ Products API
- ✅ Categories API
- ✅ Suppliers API
- ✅ Purchase Orders API
- ✅ Inventory Reports

### Full Test Suite Includes
- Authentication endpoints
- All inventory management endpoints
- Order management
- Analytics
- Settings
- Upload functionality

---

## 🔒 Testing Protected Routes

Some endpoints require authentication:

**Browser:**
```javascript
const AUTH_TOKEN = 'your-token-here';
testAllAPIs();
```

**CLI:**
```bash
node test-apis-cli.js --url https://your-domain.com --token YOUR_TOKEN
```

**Curl:**
```bash
./test-apis-curl.sh https://your-domain.com "your-auth-token"
```

---

## 📋 Test Results

The scripts will show:
- ✅/❌ Status for each test
- HTTP status codes
- Response times
- Detailed response data
- Final summary with pass rate

Example output:
```
============================================================
📊 TEST SUMMARY
============================================================

Total Tests: 45
✅ Passed: 42
❌ Failed: 3
📈 Pass Rate: 93.3%
```

---

## 📖 Full Documentation

For detailed instructions, see **`API_TESTING_GUIDE.md`**

---

## 🎯 Recommended Workflow

1. **Before Deployment:** Run smoke tests on staging
2. **After Deployment:** Run full test suite on production
3. **Troubleshooting:** Use browser script for quick debugging
4. **CI/CD:** Use CLI script in your pipeline

---

## 🛠️ Troubleshooting

### CORS Error (Browser)
- Use the CLI or curl script instead
- Or configure CORS on your server

### 401 Unauthorized
- Add valid AUTH_TOKEN
- Check token hasn't expired

### Connection Refused
- Verify server URL is correct
- Check server is running
- Ensure firewall allows connections

---

## 📝 File Summary

| File | Use When | Requirements |
|------|----------|--------------|
| `test-apis-live.js` | Quick browser tests | Modern browser |
| `test-apis-cli.js` | Automation/CI/CD | Node.js |
| `test-apis-curl.sh` | No Node.js available | curl + bash |
| `API_TESTING_GUIDE.md` | Full documentation | - |
| `TEST_SCRIPTS_QUICKSTART.md` | Quick reference | - |

---

## ✅ Next Steps

1. Choose a test script based on your needs
2. Update the API_BASE to your live server URL
3. Run the tests
4. Review results and fix any issues
5. Integrate into your deployment process

---

**Need Help?** Check `API_TESTING_GUIDE.md` for detailed instructions.
