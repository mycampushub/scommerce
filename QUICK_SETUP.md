# 🚀 Quick Setup: Vercel + Supabase + Image Storage

## What You Need to Deploy Your E-Commerce App

---

## 📦 **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Next.js App                                        │ │
│  │  ├── Homepage, Product Pages, Cart, Checkout         │ │
│  │  ├── Admin Dashboard (9 pages)                      │ │
│  │  ├── API Routes (Next.js API)                      │ │
│  │  └── Upload API (/api/upload)                      │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   SUPABASE (Backend)                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                 │ │
│  │  ├── Users, Products, Categories, Orders            │ │
│  │  ├── CartItems, OrderItems, AdminLogs               │ │
│  │  └── All relations configured                       │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Supabase Storage                                  │ │
│  │  └── Products Bucket (Product Images)               │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ **Deployment Checklist**

### Step 1: Supabase Setup

#### 1.1 Create Supabase Account
- Go to [supabase.com](https://supabase.com)
- Sign up (free)
- Create new project
- Wait for database to be ready (~2 minutes)

#### 1.2 Get Database Connection String
1. Go to your project
2. Settings → Database
3. Scroll to "Connection string"
4. Copy "URI" (example: `postgresql://postgres.xxxx:xxxx@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`)

#### 1.3 Get API Keys
1. Settings → API
2. Copy these three values:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

#### 1.4 Create Storage Bucket for Images
1. Go to Storage → New bucket
2. Create bucket:
   - **Name:** `products`
   - **Public bucket:** ✅ YES (make it public)
3. Click "Create bucket"

#### 1.5 Set Storage Policies (SQL Editor)
Go to SQL Editor in Supabase and run:

```sql
-- Allow public read access to products bucket
CREATE POLICY "Public Read Access for Products"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'products'
);

-- Allow authenticated uploads
CREATE POLICY "Authenticated Upload for Products"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated deletes
CREATE POLICY "Authenticated Delete for Products"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);
```

#### 1.6 Run Database Migration
```bash
# From your project directory
bun run db:push
```

---

### Step 2: GitHub Setup

#### 2.1 Create GitHub Repository
1. Go to github.com → New repository
2. Name: `ecommerce-app`
3. Make it public (or private)
4. Click "Create repository"

#### 2.2 Push Code to GitHub
```bash
# From your project directory
git init
git add .
git commit -m "Initial commit: E-commerce app with admin dashboard"
git branch -M main
git remote add origin https://github.com/yourusername/ecommerce-app.git
git push -u origin main
```

---

### Step 3: Vercel Deployment

#### 3.1 Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

#### 3.2 Deploy via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Login with GitHub
3. Click "Add New" → "Project"
4. Import your `ecommerce-app` repository
5. Configure:

**Framework Preset:** Next.js
**Root Directory:** `./` (default)

**Environment Variables:**
Add these in "Environment Variables" section:

```
DATABASE_URL = [Your Supabase database connection string from Step 1.2]
SUPABASE_URL = [Your Project URL from Step 1.3]
SUPABASE_ANON_KEY = [Your anon key from Step 1.3]
SUPABASE_SERVICE_ROLE_KEY = [Your service_role key from Step 1.3]
NEXTAUTH_SECRET = [Generate with: openssl rand -base64 32]
NEXTAUTH_URL = [Will be auto-filled after deploy]
```

6. Click "Deploy"
7. Wait ~2-3 minutes
8. Your app is live! 🎉

---

### Step 4: Post-Deployment

#### 4.1 Update NEXTAUTH_URL
After first deploy:
1. Go to Vercel Dashboard → Your project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to your Vercel domain
   - Example: `https://your-app.vercel.app`

#### 4.2 Test Image Upload
1. Go to your admin dashboard: `https://your-app.vercel.app/admin`
2. Navigate to Products → Add Product
3. Try uploading images
4. Check Supabase Dashboard → Storage → products bucket
5. Images should appear there

#### 4.3 Test API Routes
```bash
# Test stats API
curl https://your-app.vercel.app/api/admin/stats

# Test products API
curl https://your-app.vercel.app/api/admin/products
```

#### 4.4 Set Up Custom Domain (Optional)
1. Go to Vercel → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Done!

---

## 📊 **What's Included**

### ✅ Frontend (Vercel)
- Homepage with product catalog
- Category pages (saree, salwar, tops, etc.)
- Product detail pages
- Shopping cart functionality
- Checkout flow
- Admin dashboard (9 pages)

### ✅ Backend (Supabase)
- PostgreSQL database with all tables
- User authentication ready
- Product, Category, Order management
- Cart and order items tracking
- Admin logging

### ✅ API Routes (Vercel Serverless)
- `/api/admin/products` - CRUD operations
- `/api/admin/orders` - Order management
- `/api/admin/customers` - Customer management
- `/api/admin/categories` - Category management
- `/api/admin/stats` - Dashboard statistics
- `/api/upload` - Image upload to Supabase Storage

### ✅ Image Storage (Supabase Storage)
- Products bucket for image uploads
- CDN via Fastly
- Transformations supported
- Public access for frontend

---

## 💰 **Pricing Summary**

### Free Tier (Perfect for Launch):

| Service | Cost | Included |
|----------|-------|----------|
| Vercel | **$0** | 100GB bandwidth, serverless functions |
| Supabase Database | **$0** | 500MB storage, 1GB bandwidth |
| Supabase Storage | **$0** | 1GB storage, 2GB bandwidth |
| **Total** | **$0/mo** | ✅ Ready for production! |

### Paid Tier (Growth):

| Service | Cost | Upgrade When... |
|----------|-------|---------------|
| Vercel Pro | **$20/mo** | Need more bandwidth, faster builds |
| Supabase Pro | **$25/mo** | Need >500MB DB or >1GB storage |
| **Total** | **$45/mo** | Scaling to thousands of orders |

---

## 🔧 **Environment Variables Reference**

### Required Variables:

```env
# Database
DATABASE_URL="postgresql://postgres.xxxx:xxxx@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Supabase API
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# NextAuth (if using authentication)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"
```

---

## 🐛 **Troubleshooting**

### Issue: Database Connection Error

**Solution:**
1. Verify DATABASE_URL is correct
2. Check Supabase project is active
3. Ensure Vercel environment variables are set

### Issue: Images Not Uploading

**Solution:**
1. Check SUPABASE_SERVICE_ROLE_KEY is correct
2. Verify "products" bucket exists and is public
3. Check storage policies allow uploads
4. Check Vercel logs for errors

### Issue: Build Failed

**Solution:**
1. Check all environment variables are set
2. Run `bun run lint` locally to check for errors
3. Check Vercel build logs in dashboard

### Issue: 404 on API Routes

**Solution:**
1. Ensure `/app/api/` folder exists
2. Check route file exports proper HTTP methods
3. Verify file names are lowercase

---

## 📞 **Resources**

- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Supabase Storage: https://supabase.com/docs/guides/storage

---

## 🎉 **You're All Set!**

Your e-commerce application is ready for deployment!

**Time to Live: ~10 minutes**

1. Create Supabase project (2 min)
2. Get connection strings & keys (2 min)
3. Create storage bucket (1 min)
4. Push to GitHub (2 min)
5. Deploy to Vercel (2 min)
6. Test and go live! (1 min)

---

**Questions? Check these guides:**
- `/home/z/my-project/DEPLOYMENT_GUIDE.md` - Detailed deployment options
- `/home/z/my-project/IMAGE_STORAGE_GUIDE.md` - Complete image storage guide
- `/home/z/my-project/backend-structure.md` - Backend API structure (if separating)

**Need help? Let me know!**
