# API Debugging System

This is a comprehensive API debugging system that captures and logs all API requests, responses, and errors across the entire application.

## Features

✅ **Covers ALL API endpoints** - Automatically logs every API request in your app  
✅ **Captures ALL error types** - 400, 401, 403, 404, 500, and more  
✅ **Detailed request/response logging** - Headers, query params, timing, error stacks  
✅ **Error summary** - Quick overview of errors by status code and path  
✅ **Real-time diagnostics** - Test API endpoints and view results  
✅ **Security conscious** - Sensitive data (auth tokens, cookies) are redacted  

## Available Endpoints

### 1. `/api/debug/logs` - View API Logs

**GET** - Retrieve debug logs

Query Parameters:
- `summary=true` - Return summary statistics instead of full logs
- `method=GET` - Filter by HTTP method (GET, POST, PUT, DELETE, etc.)
- `path=/api/admin` - Filter by path (partial match)
- `status=500` - Filter by HTTP status code
- `hasError=true` - Filter for errors only
- `limit=50` - Limit number of results

Examples:
```bash
# Get summary of all API activity
GET /api/debug/logs?summary=true

# Get all 500 errors
GET /api/debug/logs?status=500

# Get all errors for /api/admin/products
GET /api/debug/logs?path=/api/admin/products&hasError=true

# Get recent 50 logs
GET /api/debug/logs?limit=50
```

**DELETE** - Clear all debug logs

```bash
DELETE /api/debug/logs
```

### 2. `/api/debug/bindings` - Check Cloudflare Bindings

**GET** - Check if Cloudflare bindings (D1, KV, R2) are accessible

```bash
GET /api/debug/bindings
```

Response includes:
- Whether bindings are found
- Available binding keys
- Binding types (DB, KV, BUCKET)

### 3. `/api/debug/diagnostics` - System Diagnostics

**GET** - Get system diagnostics

Query Parameters:
- `full=true` - Include detailed request object inspection

```bash
GET /api/debug/diagnostics
GET /api/debug/diagnostics?full=true
```

**POST** - Test API endpoints or log errors

Action: `test-api`
```bash
POST /api/debug/diagnostics?action=test-api
{
  "endpoint": "/api/admin/products",
  "method": "GET",
  "headers": {},
  "body": {}
}
```

Action: `log-error`
```bash
POST /api/debug/diagnostics?action=log-error
{
  "error": {
    "message": "Custom error message",
    "stack": "Error stack trace..."
  }
}
```

## Response Format

### Summary Response (`?summary=true`)
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalLogs": 150,
  "statsByStatus": {
    "success": 120,
    "clientError": 20,
    "serverError": 10,
    "redirect": 0,
    "unknown": 0
  },
  "errorSummary": {
    "totalErrors": 30,
    "errorsByStatus": {
      "400": 5,
      "401": 8,
      "403": 3,
      "404": 4,
      "500": 10
    },
    "errorsByPath": {
      "/api/admin/products": 5,
      "/api/admin/orders": 3,
      "/api/admin/categories": 2
    },
    "recentErrors": [...]
  },
  "recentLogs": [...]
}
```

### Full Log Entry
```json
{
  "id": "1234567890-abc123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "method": "GET",
  "path": "/api/admin/products",
  "query": {},
  "headers": {
    "user-agent": "...",
    "authorization": "***REDACTED***"
  },
  "responseStatus": 500,
  "responseHeaders": {},
  "responseBody": {},
  "responseTime": 125,
  "error": {
    "message": "Database connection error",
    "stack": "Error: Database connection error\n    at ...",
    "name": "Error"
  },
  "environment": {
    "nodeEnv": "production",
    "bindingsFound": true,
    "hasDB": true,
    "hasKV": true,
    "hasBUCKET": true
  },
  "ip": "...",
  "userAgent": "..."
}
```

## Usage Examples

### Check API Health
```bash
curl "https://your-app.com/api/debug/logs?summary=true"
```

### Find all 500 errors
```bash
curl "https://your-app.com/api/debug/logs?status=500"
```

### Debug specific API endpoint
```bash
# Test the endpoint
curl -X POST "https://your-app.com/api/debug/diagnostics?action=test-api" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/api/admin/products", "method": "GET"}'

# View logs for that endpoint
curl "https://your-app.com/api/debug/logs?path=/api/admin/products"
```

## Error Classification

The debugging system categorizes errors by status code:

- **2xx (Success)**: Request completed successfully
- **3xx (Redirect)**: Redirect responses
- **4xx (Client Error)**: 
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (authentication required)
  - 403: Forbidden (permission denied)
  - 404: Not Found
  - 409: Conflict
  - 429: Rate Limit Exceeded
- **5xx (Server Error)**: Internal server errors

## Security

The debug system automatically redacts sensitive data:
- Authorization headers
- Cookies
- API keys
- Request bodies (to prevent logging sensitive data)

## Integration with API Routes

To use the debugging system in your API routes, you can use the `withApiDebug` wrapper:

```typescript
import { withApiDebug, NotFoundError } from '@/lib/api-wrapper';

export async function GET(request: Request) {
  return withApiDebug(request, 'GET', async (req, env) => {
    // Your API logic here
    const data = await fetchSomething();
    
    if (!data) {
      throw new NotFoundError('Product not found');
    }
    
    return NextResponse.json({ data });
  });
}
```

Or continue using existing patterns - the debug system captures all errors automatically.

## Limitations

- Logs are stored in memory and will be cleared on redeploy
- Maximum of 500 logs are kept (oldest are removed)
- Request bodies are not logged for security reasons
- Response bodies larger than 5KB are truncated
