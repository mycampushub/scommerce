# Fix: OpenNext Cloudflare Build Error (bun not found)

## Problem
When running `npx opennextjs-cloudflare build`, you get:
```
/bin/sh: 1: bun: not found
Error: Command failed: bun run build
```

## Solution 1: Install bun (Recommended)

### Local Development
```bash
# Install bun
curl -fsSL https://bun.sh/install | bash

# Or on Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"

# Then build
npm run build:cloudflare
```

### GitHub Actions
The updated `.github/workflows/deploy.yml` now installs bun automatically:
```yaml
- name: Install bun
  uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest
```

## Solution 2: Use npm instead of bun

If you can't use bun, modify `package.json`:
```json
{
  "scripts": {
    "build:cloudflare": "BUN_INSTALL=node npx opennextjs-cloudflare build"
  }
}
```

## Solution 3: Use Cloudflare Dashboard (Easiest)

1. Push code to GitHub
2. Go to Cloudflare Dashboard > Pages > Create Project
3. Connect GitHub repo
4. Set build command: `npm run build:cloudflare`
5. Cloudflare will handle bun installation automatically

**No need to install bun locally!**

## Verification

After fixing, run:
```bash
npm run build:cloudflare
```

Should output:
```
┌─────────────────────────────┐
│ OpenNext — Cloudflare build │
└─────────────────────────────┘
...
OpenNext build complete.
```
