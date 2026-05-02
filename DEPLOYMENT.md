# Cloudflare Deployment Guide

## Quick Answer: How to Copy Public Assets?

The `cp public/* .open-next/assets/` command runs **locally on your computer**, NOT on Cloudflare.

---

## 🚀 Easiest Method: Cloudflare Pages (One Command!)

### Prerequisites

```bash
# Install Wrangler (once)
npm install -g wrangler

# Login to Cloudflare (once)
wrangler login
```

### One-Command Deployment

```bash
npm run deploy:pages
```

This single command does everything:
1. ✅ Builds for Cloudflare Workers
2. ✅ Copies public assets (logo.svg, manifest.json, favicon.ico, etc.)
3. ✅ Deploys to Cloudflare Pages

**Done!** Your app will be live in ~30 seconds.

---

## 🔧 Alternative: Cloudflare Workers Deployment

If you prefer Cloudflare Workers over Pages:

### Step 1: Build and Copy Assets

```bash
npm run build:cloudflare
```

This shows output like:
```
Copying public folder assets to .open-next/assets...
✓ Created .open-next/assets directory
  ✓ Copied: favicon.ico
  ✓ Copied: logo.svg
  ✓ Copied: manifest.json
  ✓ Copied: robots.txt
  ✓ Copied: sw.js

✓ Copied 6 file(s), 0 skipped
```

### Step 2: Deploy

```bash
npm run deploy:workers
```

Or manually:

```bash
wrangler deploy
```

### Step 3: Upload Static Assets to R2 (Workers Only)

```bash
wrangler r2 object put scommerce-uploads/logo.svg --file=public/logo.svg
wrangler r2 object put scommerce-uploads/favicon.ico --file=public/favicon.ico
wrangler r2 object put scommerce-uploads/manifest.json --file=public/manifest.json
```

---

## 📝 Manual Copy (If scripts fail)

If you want to manually copy public files:

```bash
# Linux/Mac
cp public/* .open-next/assets/

# Windows PowerShell
Copy-Item public\* .open-next\assets\

# Windows CMD
xcopy /E /I public\* .open-next\assets\
```

---

## 🎯 Pages vs Workers

| Feature | Pages | Workers |
|---------|--------|---------|
| Easiest deployment | ✅ | ❌ |
| Automatic static assets | ✅ | ❌ |
| Custom worker logic | ❌ | ✅ |
| R2/D1 bindings | ❌ | ✅ |
| Full control | ❌ | ✅ |

**Recommendation**: Use Pages for this project unless you specifically need Workers features.

---

## 🔍 Troubleshooting

### Static assets 404?

**Pages:**
```bash
wrangler pages cache clear
```

**Workers:**
```bash
# Check R2 bucket
wrangler r2 object list scommerce-uploads

# View logs
wrangler tail
```

### Database not working?

Initialize D1:

```bash
wrangler d1 execute scommerce-db --file=db/schema.sql
```

---

## ✅ Complete Workflow

```bash
# 1. Login (once)
wrangler login

# 2. Make changes to code

# 3. Deploy (every time)
npm run deploy:pages
```

That's all you need!
