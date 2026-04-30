# Deployment Checklist for Cloudflare Pages

## ✅ Fixes Applied

1. **Fixed binding detection** - Updated `src/lib/cloudflare.ts` to use `getCloudflareContext()` from `@opennextjs/cloudflare`
2. **Fixed R2 binding name** - Changed `scommerce_uploads` to `BUCKET` in `src/db/types.ts`
3. **Updated all API routes** - Changed from `getEnv(request)` to `getEnv()` (now uses correct method)
4. **Fixed TypeScript errors** - Added proper type annotations to all `response.json()` calls
5. **Added `output: 'standalone'`** - Updated `next.config.mjs` for Cloudflare compatibility
6. **Fixed GitHub Actions** - Updated workflow to install bun before building

## 🚀 Quick Deployment Steps

### Option 1: Cloudflare Dashboard (Easiest)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Fix Cloudflare bindings detection"
   git push origin main
   ```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate: **Compute > Workers & Pages > Create > Pages**
   - Select **Connect to Git**
   - Choose your repository
   - Configure build:
     - **Framework preset**: `Next.js (Static HTML)`
     - **Build command**: `npm run build:cloudflare`
     - **Build output directory**: `.open-next`

3. Add bindings in **Settings > Variables and Secrets**:
   - **D1 Database**: Variable name `DB`, select `scommerce-db`
   - **R2 Bucket**: Variable name `BUCKET`, select `scommerce-uploads`
   - **KV Namespace**: Variable name `KV`, select your KV namespace

4. Click **Save and Deploy**

### Option 2: GitHub Actions (Automatic)

1. Add GitHub Secrets:
   - Go to repo **Settings > Secrets and variables > Actions**
   - Add `CLOUDFLARE_API_TOKEN` (from https://dash.cloudflare.com/profile/api-tokens)
   - Add `CLOUDFLARE_ACCOUNT_ID` (found in dashboard URL)

2. Push code:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add Cloudflare deployment workflow"
   git push origin main
   ```

3. GitHub Actions will automatically deploy your site

## 🔧 Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build Next.js normally |
| `npm run build:cloudflare` | Build for Cloudflare (uses opennextjs-cloudflare) |
| `npx wrangler pages dev .open-next` | Run locally with bindings |
| `npx opennextjs-cloudflare build` | Build manually for Cloudflare |

## ✅ Verification

After deployment, test bindings at:
```
https://your-site.pages.dev/api/test-bindings
```

Expected output:
```json
{
  "bindingsPresent": true,
  "hasDB": true,
  "hasBUCKET": true,
  "hasKV": true,
  "d1Test": { "success": true },
  "kvTest": { "success": true },
  "r2Test": { "success": true }
}
```

## 🐛 Troubleshooting

**Bindings not detected?**
- Ensure `wrangler.toml` has correct bindings
- Check Cloudflare Pages > Settings > Variables and Secrets
- Redeploy after adding bindings

**Build fails with "bun not found"?**
- The workflow now installs bun automatically
- For local builds, install bun: `curl -fsSL https://bun.sh/install | bash`

**TypeScript errors?**
- Run `npm run build` to see all errors
- All `.json()` calls should have `as any` annotation
