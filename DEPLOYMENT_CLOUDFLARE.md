# Cloudflare Pages Deployment Guide

This guide explains how to deploy this Next.js 16 e-commerce application to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally

## Deployment Options

### Option 1: Cloudflare Pages with Node.js (Recommended for this project)

This option provides the most compatibility with Next.js features.

#### Step 1: Push Code to Git Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push -u origin main
```

#### Step 2: Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **Create application**
3. Select **Pages** > **Connect to Git**
4. Choose your Git provider and repository
5. Configure build settings:

**Build Settings:**
```
Framework preset: Next.js
Build command: bun install && bun run build
Build output directory: .next/standalone
```

**Environment Variables:**
Copy from `.env.cloudflare.example`:
```
DATABASE_URL=file:///mnt/data/custom.db
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NEXT_PUBLIC_URL=https://your-project.pages.dev
NODE_ENV=production
```

6. Click **Save and Deploy**

#### Step 3: Configure Database

For SQLite on Cloudflare Pages, you have two options:

**Option A: Use Cloudflare D1 (Recommended)**
```bash
# Create D1 database
wrangler d1 create ecommerce-db

# Add binding to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "ecommerce-db"
database_id = "your-database-id"

# Run migrations
wrangler d1 migrations apply ecommerce-db --remote
```

Update `.env` to use D1:
```
DATABASE_URL="your-d1-database-binding"
```

**Option B: Use SQLite in Pages**
- SQLite files are ephemeral on Cloudflare Pages
- Use Cloudflare KV or Durable Objects for persistence
- Consider using Cloudflare D1 for production

#### Step 4: Configure Email (Optional)

For password reset emails, use one of:
- **Resend**: `RESEND_API_KEY`
- **SendGrid**: `SENDGRID_API_KEY`
- **Cloudflare Email Routing**: Setup forwarding rules

### Option 2: Cloudflare Pages with Static Export (Limited Features)

For static export, modify `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "export",
  // ... other config
}
```

⚠️ **Limitations:**
- No API routes (requires separate backend)
- No server-side rendering
- No database connections

Not recommended for this e-commerce project.

## Post-Deployment Steps

### 1. Run Database Migrations

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Push schema to D1
wrangler d1 execute ecommerce-db --remote --file=./prisma/schema.sql
```

### 2. Verify Environment Variables

In Cloudflare Dashboard > Workers & Pages > Your Project > Settings > Environment variables:

Check that all required variables are set:
- ✅ DATABASE_URL
- ✅ JWT_SECRET
- ✅ NEXT_PUBLIC_URL
- ✅ NODE_ENV

### 3. Test Application

1. Visit your deployed URL
2. Test user registration and login
3. Test product browsing and cart functionality
4. Test order placement (COD)
5. Test password reset flow

### 4. Setup Custom Domain (Optional)

1. Go to your project in Cloudflare Dashboard
2. Navigate to **Custom domains**
3. Add your domain (e.g., `shop.yourdomain.com`)
4. Update DNS records as instructed
5. Update `NEXT_PUBLIC_URL` environment variable

### 5. Enable Analytics (Optional)

In Cloudflare Dashboard:
- Go to **Web Analytics**
- Enable for your Pages project
- Track visitor metrics and page views

## Cloudflare Pages Specific Considerations

### Database Persistence

**SQLite Limitations:**
- SQLite files are not persistent across deployments
- Each build recreates the environment
- Data is lost on redeploy

**Solutions:**
1. **Cloudflare D1** (Recommended):
   - Persistent SQLite-compatible database
   - Free tier: 5GB storage, 5M rows/day
   - Excellent for serverless applications

2. **Cloudflare Durable Objects**:
   - For stateful applications
   - Better for real-time features
   - More complex setup

3. **External Database**:
   - PostgreSQL/MySQL on external provider
   - Use connection pooling for better performance
   - Examples: Neon, Supabase, PlanetScale

### File Uploads

Cloudflare Pages doesn't support persistent file uploads:
- Use Cloudflare R2 for object storage
- Or external services: AWS S3, Vercel Blob, Cloudinary
- Store image URLs in database, not files

### Email Services

Configure one of the following:

**Resend (Recommended for Cloudflare):**
```bash
npm install resend
```

**SendGrid:**
```bash
npm install @sendgrid/mail
```

**Cloudflare Email Routing:**
- Free and built-in to Cloudflare
- Setup forwarding rules
- Limited outbound sending

### Caching Strategy

Cloudflare Pages automatically caches:
- Static assets (CSS, JS, images)
- HTML pages with proper cache headers

Configure caching in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate',
        },
      ],
    },
  ],
}
```

## Performance Optimization

### 1. Enable Edge Functions

For API routes that need to run at the edge:

```typescript
// app/api/products/route.ts
export const runtime = 'edge';
export const preferredRegion = 'auto';
```

### 2. Optimize Images

Use `next/image` for automatic optimization:
```typescript
import Image from 'next/image';

<Image
  src={product.image}
  alt={product.name}
  width={500}
  height={500}
  priority
/>
```

### 3. Use Cloudflare Images (Optional)

Enable Cloudflare Images for CDN optimization:
```
CLOUDFLARE_IMAGES_API_TOKEN=your-token
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your-id
```

## Monitoring and Logging

### Cloudflare Analytics

Enable in Dashboard:
- **Web Analytics**: Page views, visitors, performance
- **Analytics Engine**: Custom events, API metrics

### Error Tracking

Integrate with:
- **Sentry**: Excellent for error tracking
- **LogRocket**: Session replay + error tracking
- **Cloudflare Workers Analytics**: Built-in logging

Example Sentry setup:
```bash
npm install @sentry/nextjs
```

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files
- Use different secrets for staging/production
- Rotate secrets regularly

### 2. Rate Limiting

Cloudflare provides built-in rate limiting:
- Enable in Dashboard > Security > WAF > Rate Limiting Rules
- Protect API endpoints from abuse
- Free tier: 1 request/second per IP

### 3. Web Application Firewall (WAF)

Enable Cloudflare WAF:
- Blocks common attacks (SQL injection, XSS)
- Custom rules for your application
- Free tier includes basic protection

### 4. HTTP Headers

Add security headers in `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}
```

## Troubleshooting

### Build Errors

**Error: "Cannot find module"**
- Check `package.json` dependencies
- Ensure `bun install` runs successfully

**Error: "Database connection failed"**
- Verify `DATABASE_URL` environment variable
- Check D1 database binding

### Runtime Errors

**Error: "JWT_SECRET not set"**
- Add `JWT_SECRET` to environment variables
- Minimum 32 characters recommended

**Error: "Failed to send email"**
- Verify email service API keys
- Check email provider dashboard for quota limits

### Performance Issues

**Slow page loads:**
- Enable Cloudflare caching
- Optimize images
- Use Edge Functions for API routes

**High memory usage:**
- Optimize database queries
- Implement pagination
- Use caching (Cloudflare KV)

## CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run lint

      - name: Build
        run: bun run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v2
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .next/standalone --project-name=your-project
```

## Cost Summary

**Cloudflare Pages Free Tier:**
- Unlimited sites
- 500 builds/month
- Bandwidth: Unlimited
- D1: 5GB storage, 5M rows/day
- Requests: 100K/day

**Paid Tier (if needed):**
- $20/month for Workers
- $5/month per D1 database (1GB)
- Pay-as-you-go for additional usage

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

## Support

For issues specific to this deployment:
- Check Cloudflare Dashboard logs
- Review build output in Git provider
- Enable detailed error logging in your application
