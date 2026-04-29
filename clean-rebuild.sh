#!/bin/bash
# Clean rebuild script to fix binding issues and Node.js API warnings
# Run this to clean everything and rebuild from scratch

echo "🧹 Cleaning build artifacts..."
rm -rf .next .vercel .wrangler

echo "🧹 Cleaning dependencies..."
rm -rf node_modules bun.lockb

echo "📦 Reinstalling dependencies..."
bun install

echo "🔨 Building Next.js..."
bun run build

echo "☁️ Generating Cloudflare Pages output..."
npx @cloudflare/next-on-pages@1.13.16 --skip-build

echo "✨ Checking wrangler.toml..."
if grep -q "pages_build_output_dir" wrangler.toml; then
    echo "❌ ERROR: wrangler.toml still has invalid 'pages_build_output_dir' line!"
    echo "Please remove this line from wrangler.toml and run again"
    exit 1
else
    echo "✅ wrangler.toml looks good!"
fi

echo "📊 Ready to commit and deploy"
echo "Run these commands:"
echo "  git add ."
echo "  git commit -m \"fix: clean rebuild with corrected wrangler.toml\""
echo "  git push"
