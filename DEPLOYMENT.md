# Cloudflare Workers Deployment Guide

This guide explains how to properly deploy SCommerce to Cloudflare Workers.

## Problem: Static Assets Not Loading (404 Errors)

If you're seeing 404 errors for:
- `_next/static/css/*.css`
- `_next/static/chunks/*.js`
- `_next/static/media/*.woff2`
- `logo.svg`, `manifest.json`

This is because static assets are not being served properly in your deployment.

## Solution

### Option 1: Cloudflare Pages Deployment (Recommended)

Cloudflare Pages has better support for static assets and is easier to set up.

#### Step 1: Build for Cloudflare
```bash
npm run build:cloudflare
# or
bun run build:cloudflare
```

This creates a `.open-next` folder with all the built files.

#### Step 2: Deploy to Cloudflare Pages
```bash
wrangler pages deploy .open-next/assets
```

#### Step 3: Set up environment variables in Cloudflare Dashboard
1. Go to your Cloudflare Dashboard → Pages → SCommerce → Settings → Environment variables
2. Add the following:
   - `DATABASE_URL` (if using external DB)
   - `NEXT_PUBLIC_SITE_URL` = `https://scommerce.demo-web.workers.dev`
   - `NEXTAUTH_SECRET` (generate a random string)
   - `JWT_SECRET` (generate a random string)

### Option 2: Cloudflare Workers with R2

#### Step 1: Build the app
```bash
npm run build:cloudflare
```

#### Step 2: Copy public folder assets to .open-next/assets
```bash
# Copy public folder assets to build output
cp public/* .open-next/assets/
```

#### Step 3: Upload static assets to R2
```bash
# Using wrangler
wrangler r2 object put scommerce-uploads/logo.svg --file=public/logo.svg
wrangler r2 object put scommerce-uploads/favicon.ico --file=public/favicon.ico
wrangler r2 object put scommerce-uploads/manifest.json --file=public/manifest.json

# Or upload entire _next/static folder
wrangler r2 object put scommerce-uploads/_next/static/ --path=.open-next/assets/_next/static/
```

#### Step 4: Deploy the worker
```bash
wrangler deploy
```

#### Step 5: Update worker code to serve from R2
The `_worker.js` file is already configured to serve static assets from R2.
Make sure your wrangler.toml has the correct R2 binding:
```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "scommerce-uploads"
```

## Alternative: Use Cloudflare Pages Functions

If you're having issues with Workers, try Cloudflare Pages with Functions:

1. Create a new Cloudflare Pages project
2. Connect it to your GitHub repository
3. Set build settings:
   - Build command: `npm run build:cloudflare`
   - Build output directory: `.open-next/assets`
4. Set environment variables
5. Deploy automatically on push

## Troubleshooting

### Static assets still 404?

1. **Check if assets are in R2:**
   ```bash
   wrangler r2 object list scommerce-uploads
   ```

2. **Check worker logs:**
   ```bash
   wrangler tail
   ```

3. **Verify R2 bucket binding in wrangler.toml:**
   Make sure `bucket_name` matches your actual R2 bucket name.

4. **Clear cache:**
   ```bash
   wrangler cache purge
   ```

### Database issues?

1. **Initialize D1 database:**
   ```bash
   wrangler d1 execute scommerce-db --file=db/schema.sql
   ```

2. **Check D1 bindings:**
   Make sure the `database_id` in wrangler.toml matches your actual D1 database.

### Need to update deployed code?

1. Make changes locally
2. Run `npm run build:cloudflare`
3. Run `wrangler deploy` (for Workers) or `wrangler pages deploy .open-next/assets` (for Pages)

## Deployment Checklist

Before deploying to production:

- [ ] Build completes without errors: `npm run build:cloudflare`
- [ ] Static assets are uploaded to R2 (for Workers) or included in build output (for Pages)
- [ ] D1 database is initialized with schema
- [ ] Environment variables are set in Cloudflare Dashboard
- [ ] Test deployment locally first
- [ ] Monitor worker logs after deployment: `wrangler tail`

## Quick Deploy Command (Workers)

```bash
# Full deployment script
npm run build:cloudflare && \
wrangler deploy
```

## Quick Deploy Command (Pages)

```bash
# Full deployment script
npm run build:cloudflare && \
cp public/* .open-next/assets/ && \
wrangler pages deploy .open-next/assets
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [OpenNext for Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
