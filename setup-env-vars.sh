#!/bin/bash

# Script to help set up environment variables for Cloudflare Workers deployment
# This script generates secure random values for required environment variables

echo "=========================================="
echo "Environment Variables Setup Script"
echo "=========================================="
echo ""

# Generate a secure random JWT secret (64 characters)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | cut -c1-64)

# Generate an admin secret for admin registration
ADMIN_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | cut -c1-64)

echo "Generated Environment Variables:"
echo "================================"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "ADMIN_SECRET=$ADMIN_SECRET"
echo ""
echo "=========================================="
echo ""
echo "How to use these variables:"
echo ""
echo "Option 1: Add to wrangler.toml (for development):"
echo "----------------------------------------"
echo "[vars]"
echo "JWT_SECRET=\"$JWT_SECRET\""
echo "ADMIN_SECRET=\"$ADMIN_SECRET\""
echo ""
echo "Option 2: Add to Cloudflare Dashboard (production):"
echo "-------------------------------------------------"
echo "1. Go to: https://dash.cloudflare.com/"
echo "2. Navigate to: Workers & Pages > scommerce > Settings > Environment Variables"
echo "3. Add the following variables:"
echo "   - Name: JWT_SECRET, Value: $JWT_SECRET"
echo "   - Name: ADMIN_SECRET, Value: $ADMIN_SECRET"
echo ""
echo "Option 3: Add to .dev.vars (for local wrangler dev):"
echo "--------------------------------------------------"
echo "JWT_SECRET=$JWT_SECRET"
echo "ADMIN_SECRET=$ADMIN_SECRET"
echo ""
echo "=========================================="
echo ""
echo "After setting these variables, rebuild and redeploy your application:"
echo "  npm run build:cloudflare"
echo "  wrangler pages deploy .open-next"
echo ""
