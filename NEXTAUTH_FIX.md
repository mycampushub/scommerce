# Fix: Browser Security Error (chrome-error://chromewebdata/)

## The Error
```
Unsafe attempt to load URL https://639318a0.scommerce-4a3.pages.dev/ 
from frame with URL chrome-error://chromewebdata/. 
Domains, protocols and ports must match.
```

## What This Means
This error occurs when:
1. **iframe Issue** - A page is trying to load in an iframe from a different domain
2. **Redirect Loop** - The middleware is causing infinite redirects
3. **Invalid URL** - The site is redirecting to an invalid URL

## Solution 1: Check Middleware Redirects

Your `src/middleware.ts` has complex redirect logic. The issue might be:
- Redirecting to `/login` when already on `/login` (infinite loop)
- Invalid `redirect` parameter in URL

### Fix: Add loop protection to middleware
```typescript
// Add this check in middleware.ts
if (pathname === '/login' && sessionToken) {
  // Prevent redirect loop - check if we're already redirecting
  const redirectTo = request.nextUrl.searchParams.get('redirect')
  if (redirectTo && redirectTo.includes('login')) {
    // Avoid loop - just continue
    return NextResponse.next()
  }
}
```

## Solution 2: Check Deployed Site URL

The URL `639318a0.scommerce-4a3.pages.dev` is a **preview deployment** URL.

### Use the main URL instead:
```
https://scommerce.pages.dev
```

Or check your actual deployment URL:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate: **Compute > Workers & Pages > scommerce**
3. Look for **Deployments** tab
4. Find the **latest successful deployment**
5. Click **Visit Site** to get the correct URL

## Solution 3: Disable Middleware Temporarily (Test)

To test if middleware is causing the issue:

1. Rename middleware file:
   ```bash
   mv src/middleware.ts src/middleware.ts.backup
   ```

2. Rebuild and redeploy:
   ```bash
   npm run build:cloudflare
   # Or push to trigger GitHub Actions
   ```

3. Test the site without middleware

## Solution 4: Check for Invalid Environment Variables

If you have `NEXTAUTH_URL` or similar set in Cloudflare Pages:

1. Go to **Settings > Variables and Secrets**
2. Check for any URL variables
3. Make sure they don't have trailing slashes or invalid characters

## Solution 5: Clear Browser Cache

Sometimes the error is cached:

1. Open Chrome in Incognito mode
2. Or clear browser cache: `Ctrl + Shift + Delete`
3. Try accessing the site again

## Quick Test

After deployment, test these URLs:
- `https://scommerce.pages.dev/` (home page)
- `https://scommerce.pages.dev/login` (login page)
- `https://scommerce.pages.dev/api/test-bindings` (test API)

If you get the error on ALL pages, it's likely middleware.
If only on specific pages, check the redirect logic for those pages.

## Most Likely Cause

Based on your middleware code, the issue is probably:
1. **Login page redirect loop** - Middleware redirects to login, which redirects back
2. **Invalid redirect parameter** - `?redirect=` parameter causing issues

### Quick Fix for Middleware
Add this at the start of your middleware function:
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // PREVENT INFINITE LOOPS
  if (pathname === '/login' && request.nextUrl.searchParams.has('session')) {
    return NextResponse.next()
  }
  
  // ... rest of your middleware code
}
```
