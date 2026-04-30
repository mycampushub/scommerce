#!/bin/bash
echo "Testing Cloudflare bindings via wrangler..."
echo "Make sure wrangler is running: npx wrangler pages dev .open-next --port 8788"
echo ""
echo "Testing bindings endpoint:"
curl -s <a href="http://127.0.0.1:8788/api/test-bindings">http://127.0.0.1:8788/api/test-bindings</a> 2>/dev/null || echo "Cannot connect - is wrangler running?"
