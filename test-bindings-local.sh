#!/bin/bash
# Test Cloudflare bindings locally

echo "Testing Cloudflare bindings..."
echo "Make sure 'npx wrangler pages dev .open-next' is running in another terminal"
echo ""

# Wait a bit for server to start
sleep 5

# Test the bindings endpoint
echo "Testing bindings via API..."
curl -s http://localhost:8788/api/test-bindings || echo "Failed to connect - is wrangler running?"

echo ""
echo "If you see binding results, the fix is working!"
