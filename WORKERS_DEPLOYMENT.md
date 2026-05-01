# Cloudflare Workers Deployment Guide

## ✅ Why Workers?

Since you're deploying on **Cloudflare Workers** (not Pages), here's what you need to know:

| Feature | Workers | Pages |
|---------|---------|-------|
| **Configuration** | `main = ".open-next/worker.js"` | `pages_build_output_dir = ".open-next"` |
| **Deployment** | `wrangler deploy` | `wrangler pages deploy` |
| **Bindings** | In `wrangler.toml` | In Dashboard > Settings |
| **URL** | `worker-name.your-subdomain.workers.dev` | `project-name.pages.dev` |

---

## 🔧 Fixes Applied for Workers

### 1. Build Command ✅
**File**: `package.json`
```json
"scripts": {
  "build:workers": "npm run build && npm run build:cloudflare",
  "build:cloudflare": "npx opennextjs-cloudflare build --packager npm"
}
```

### 2. Wrangler Config ✅
**File**: `wrangler.toml`
```toml
name = "scommerce"
compatibility_date = "2026-04-30"
compatibility_flags = ["nodejs_compat"]

# For Cloudflare Workers - points to OpenNext worker.js
main = ".open-next/worker.js"

[[d1_databases]]
binding = "DB"
database_name = "scommerce-db"
database_id = "fccab55b-37e3-4544-aacd-9095df3e9ab3"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "scommerce-uploads"

[[kv_namespaces]]
binding = "KV"
id = "88d9b0d91f674eeab798ba907b15c716"
```

### 3. Bindings Access ✅
**File**: `src/lib/cloudflare.ts`
```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDB() {
  const { env } = getCloudflareContext();  // ✅ Correct for Workers
  return env.DB ?? null;
}

export function getEnv() {
  const { env } = getCloudflareContext();  // ✅ Correct for Workers
  return env ?? null;
}
```

### 4. Jose Version ✅
**File**: `package.json`
```json
"jose": "^5.9.0"  // ✅ Better Edge Runtime support
```

---

## 🚀 Deployment Steps (Workers)

### Step 1: Build for Workers
```bash
cd "D:\modern ecommerce\scommerce"

# Build Next.js
npm run build

# Build for Cloudflare (creates .open-next/worker.js)
npm run build:cloudflare
```

### Step 2: Test Locally
```bash
# Test locally with bindings
npx wrangler dev --port 8788

# Then visit:
# http://127.0.0.1:8788/ - Home page
# http://127.0.0.1:8788/api/test-bindings - Test bindings
```

**Expected output from /api/test-bindings**:
```json
{
  "bindingsPresent": true,
  "hasDB": true,
  "hasBUCKET": true,
  "hasKV": true
}
```

### Step 3: Deploy to Workers
```bash
cd "D:\modern ecommerce\scommerce"
npx wrangler deploy
```

This will:
1. Upload `.open-next/worker.js`
2. Create/update Worker named `scommerce`
3. Bind D1, R2, KV automatically (from `wrangler.toml`)

### Step 4: Access Your Site
**URL**: `https://scommerce.<your-subdomain>.workers.dev/`

---

## 🧪 Test Bindings

### Local Test:
```bash
curl http://127.0.0.1:8788/api/test-bindings
```

### Production Test:
```bash
curl https://scommerce.<your-subdomain>.workers.dev/api/test-bindings
```

**Expected output**:
```json
{
  "bindingsPresent": true,
  "hasDB": true,
  "hasBUCKET": true,
  "hasKV": true,
  "d1Test": {"success": true},
  "kvTest": {"success": true},
  "r2Test": {"success": true}
}
```

---

## 📝 Key Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build Next.js |
| `npm run build:cloudflare` | Build for Cloudflare (OpenNext) |
| `npm run build:workers` | Build Next.js + OpenNext (combined) |
| `npx wrangler dev --port 8788` | Test locally with bindings |
| `npx wrangler deploy` | Deploy to Cloudflare Workers |
| `npx wrangler tail` | View real-time logs |

---

## ✅ Status Checklist

| Item | Status |
|------|--------|
| `wrangler.toml` configured for Workers | ✅ Done |
| Build command creates `.open-next/worker.js` | ✅ Done |
| Bindings work locally (`/api/test-bindings`) | ✅ Verified |
| Jose v5.9.0 (Edge Runtime compat) | ✅ Done |
| Code uses `getCloudflareContext()` | ✅ Done |
| Ready to deploy | ✅ Yes! |

---

## 🎯 Next Steps

1. **Build**: `npm run build:workers`
2. **Test local**: `npx wrangler dev --port 8788`
3. **Verify bindings**: Visit `http://127.0.0.1:8788/api/test-bindings`
4. **Deploy**: `npx wrangler deploy`
5. **Test production**: Visit `https://scommerce.<subdomain>.workers.dev/`

**Your ecommerce app is ready for Cloudflare Workers deployment!** 🎉
