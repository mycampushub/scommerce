# Migrating from Cloudflare Pages to Workers

## Why Migrate?

1. **Simpler local development** - `wrangler dev` works more reliably with Workers
2. **Direct control over worker.js** - No more `.open-next/` directory structure issues
3. **Better compatibility** - OpenNext outputs a `worker.js` that's designed for Workers

---

## ✅ What's Already Done

1. ✅ Your `worker.js` is already in `.open-next/worker.js`
2. ✅ Bindings are correctly configured in `wrangler.toml`
3. ✅ Code uses `getCloudflareContext()` correctly

---

## 🔧 Step-by-Step Migration

### Step1: Update `wrangler.toml` (Already Done ✅)

Your `wrangler.toml` now has:
```toml
name = "scommerce"
compatibility_date = "2026-04-30"
compatibility_flags = ["nodejs_compat"]

main = ".open-next/worker.js"
node_compat = true

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

### Step2: Test Locally with Workers

```bash
cd "D:\modern ecommerce\scommerce"

# Kill any existing processes
taskkill /F /IM node.exe

# Run with wrangler (Workers mode)
npx wrangler dev --port 8788
```

Then test:
- `http://127.0.0.1:8788/` - Home page
- `http://127.0.0.1:8788/api/test-bindings` - Test bindings

### Step3: Deploy to Cloudflare Workers

```bash
cd "D:\modern ecommerce\scommerce"

# Deploy directly to Workers
npx wrangler deploy
```

This will:
1. Upload your `worker.js`
2. Create/update the Worker named `scommerce`
3. Bind D1, R2, KV automatically (from `wrangler.toml`)

---

## 🧪 Test Bindings

After deployment, test:
```bash
curl https://scommerce.<your-subdomain>.workers.dev/api/test-bindings
```

Expected output:
```json
{
  "bindingsPresent": true,
  "hasDB": true,
  "hasBUCKET": true,
  "hasKV": true
}
```

---

## 📝 Key Differences: Pages vs Workers

| Feature | Pages | Workers |
|---------|-------|---------|
| **URL** | `scommerce.pages.dev` | `scommerce.<subdomain>.workers.dev` |
| **Configuration** | `pages_build_output_dir` | `main = "worker.js"` |
| **Bindings** | Set in Dashboard | In `wrangler.toml` |
| **Local Dev** | `wrangler pages dev` | `wrangler dev` |
| **Deployment** | Git integration or `wrangler pages deploy` | `wrangler deploy` |

---

## 🚀 Quick Commands

| Command | Description |
|---------|-------------|
| `npx wrangler dev` | Test locally (Workers mode) |
| `npx wrangler deploy` | Deploy to Cloudflare Workers |
| `npx wrangler tail` | View real-time logs |

---

## ⚠️ Important Notes

1. **Custom Domain** - You'll need to set up a custom domain or use the `.workers.dev` subdomain
2. **Environment Variables** - Set in `wrangler.toml` or via `wrangler secret put`
3. **Middleware** - Should work the same (already fixed redirect loops)

---

## ✅ Next Steps

1. **Test locally**: `npx wrangler dev --port 8788`
2. **Verify bindings work**: Visit `http://127.0.0.1:8788/api/test-bindings`
3. **Deploy**: `npx wrangler deploy`
4. **Test production**: Visit `https://scommerce.<subdomain>.workers.dev`

The migration is simple because **OpenNext already outputs a Workers-compatible `worker.js`! 🎉
