# Cloudflare Pages Deployment Guide

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com
2. **GitHub Repository** - Push your code to GitHub
3. **Cloudflare API Token** - Create at https://dash.cloudflare.com/profile/api-tokens

## Method 1: Deploy via Cloudflare Dashboard (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Fix Cloudflare bindings detection"
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Compute (Workers) > Workers & Pages**
3. Click **Create Application** > **Pages** > **Connect to Git**
4. Select your GitHub repository
5. Configure build settings:
   - **Framework preset**: `Next.js (Static HTML)`
   - **Build command**: `npm run build:cloudflare`
   - **Build output directory**: `.open-next`

### Step 3: Configure Environment Variables & Bindings

In Cloudflare Pages settings, go to **Settings > Variables and Secrets** and add:

#### D1 Database Binding
1. Create a D1 database: `npx wrangler d1 create scommerce-db`
2. Add binding in Pages settings:
   - Variable name: `DB`
   - D1 database: `scommerce-db`

#### R2 Bucket Binding
1. Create an R2 bucket: `npx wrangler r2 bucket create scommerce-uploads`
2. Add binding in Pages settings:
   - Variable name: `BUCKET`
   - R2 bucket: `scommerce-uploads`

#### KV Namespace Binding
1. Create KV namespace: `npx wrangler kv namespace create scommerce-kv`
2. Add binding in Pages settings:
   - Variable name: `KV`
   - KV namespace: `<your-kv-id>`

### Step 4: Deploy

Click **Save and Deploy**. Cloudflare will automatically build and deploy your site.

## Method 2: Automatic Deployment via GitHub Actions

### Step 1: Add GitHub Secrets

Go to your GitHub repository > **Settings > Secrets and variables > Actions** and add:

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID (found in the dashboard URL)

### Step 2: Push Workflow File

The `.github/workflows/deploy.yml` file is already created. Just push to main branch:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add Cloudflare Pages deployment workflow"
git push origin main
```

GitHub Actions will automatically deploy your site.

## Method 3: Manual Deployment via Wrangler

### Build and Deploy

```bash
# Install dependencies
npm install

# Build for Cloudflare
npm run build:cloudflare

# Deploy to Cloudflare Pages
npx wrangler pages deploy .open-next --project-name=scommerce
```

## Verify Bindings Work

After deployment, test your bindings:

1. Visit your deployed site: `https://scommerce.pages.dev`
2. Check browser console/network tab for any errors
3. Test API endpoints that use D1, R2, or KV

You can also check if bindings are working by visiting:
`https://scommerce.pages.dev/api/test-bindings`

## Build Commands Summary

| Command | Description |
|---------|-------------|
| `npm run build` | Build Next.js normally |
| `npm run build:cloudflare` | Build for Cloudflare Pages (uses opennextjs-cloudflare) |
| `npx wrangler pages dev .open-next` | Run locally with Cloudflare bindings |
| `npx wrangler pages deploy .open-next` | Deploy manually to Cloudflare |

## Troubleshooting

### Bindings not detected?
- Ensure `wrangler.toml` has correct bindings
- Run `npx wrangler types` to update types
- Check Cloudflare Pages > Settings > Variables and Secrets

### Build fails?
- Check Node.js version (use 18+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run build`

### API routes not working?
- Ensure you're using `getCloudflareContext()` from `@opennextjs/cloudflare`
- Don't use `getEnv(request)` - it's been updated to use the correct method
