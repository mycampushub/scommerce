# 🚀 E-Commerce Deployment Guide

Choose the deployment strategy that fits your needs:

---

## 📌 **Strategy 1: All-in-One on Vercel (RECOMMENDED)**

**Best for:** Most e-commerce projects, fastest deployment, simplest setup

### ✅ Advantages:
- Zero code changes needed
- Automatic serverless scaling
- Built-in CDN and edge network
- Simple CI/CD from GitHub
- Free tier available

### 🚀 Deployment Steps:

#### 1. Prepare for Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

#### 2. Set Environment Variables

Create `.env.production`:
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="your-vercel-domain.com"
```

#### 3. Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Or use Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub
4. Add environment variables
5. Click "Deploy"

#### 4. Database Options

**Option A: Vercel Postgres (Easiest)**
- Built-in database in Vercel
- Automatic backups
- $20/month for Pro plan

**Option B: Supabase (Free tier available)**
- PostgreSQL database
- Good free tier
- Get connection string from Supabase dashboard

**Option C: Neon (Free tier available)**
- Serverless PostgreSQL
- Auto-scaling
- Good free tier

**Option D: PlanetScale (MySQL)**
- Serverless MySQL
- Good free tier
- If you prefer MySQL over PostgreSQL

---

## 📌 **Strategy 2: Separate Frontend (Vercel) + Backend (Railway)**

**Best for:** Need custom backend logic, microservices architecture

### 🏗️ Architecture:
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │         │   Database      │
│   (Vercel)      │◄──────►│   (Railway)     │◄──────►│  (Supabase/     │
│                 │ HTTPS  │                 │  TCP    │   Railway DB)   │
│ Next.js App     │        │  Express.js     │         │                 │
│ (no API routes) │        │  API Server    │         │  PostgreSQL     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Frontend Setup (Vercel):

#### 1. Remove `/app/api` directory
```bash
# Remove API routes from frontend
rm -rf src/app/api
```

#### 2. Create API Client

Create `src/lib/api-client.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
      );
    }
    const response = await fetch(url.toString());
    return response.json() as Promise<T>;
  }

  async post<T>(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<T>;
  }

  async put<T>(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<T>;
  }

  async delete<T>(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

#### 3. Update Frontend Components

Example for products page:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  price: number;
  // ... other fields
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: Product[] }>('/api/admin/products');
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  // ... rest of component
}
```

#### 4. Deploy Frontend to Vercel

Create `.env.production`:
```env
NEXT_PUBLIC_API_URL="https://your-backend-url.railway.app"
```

Deploy:
```bash
vercel --prod
```

---

### Backend Setup (Railway):

#### 1. Create Backend Repository

```bash
# Create new backend folder
mkdir ecommerce-backend
cd ecommerce-backend

# Initialize
npm init -y
npm install express cors helmet dotenv
npm install -D typescript @types/node @types/express @types/cors tsx
```

#### 2. Backend Structure

```
ecommerce-backend/
├── src/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── customers.ts
│   │   │   ├── categories.ts
│   │   │   └── stats.ts
│   │   └── public/
│   │       └── products.ts
│   ├── lib/
│   │   ├── db.ts
│   │   └── middleware.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env
```

#### 3. Main Server File

`src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import { productsRouter } from './api/admin/products';
import { ordersRouter } from './api/admin/orders';
import { customersRouter } from './api/admin/customers';
import { categoriesRouter } from './api/admin/categories';
import { statsRouter } from './api/admin/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin/products', productsRouter);
app.use('/api/admin/orders', ordersRouter);
app.use('/api/admin/customers', customersRouter);
app.use('/api/admin/categories', categoriesRouter);
app.use('/api/admin/stats', statsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});
```

#### 4. Example API Route

`src/api/admin/products.ts`:
```typescript
import { Router } from 'express';
import { db } from '../../lib/db';

const router = Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';

    let products = await db.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });

    if (search) {
      products = products.filter(
        p => p.name.toLowerCase().includes(search.toLowerCase()) ||
             p.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category) {
      products = products.filter(p => p.category.slug === category);
    }

    if (status === 'active') {
      products = products.filter(p => p.isActive);
    } else if (status === 'inactive') {
      products = products.filter(p => !p.isActive);
    }

    res.json({
      success: true,
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    const product = await db.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        categoryId: body.categoryId,
        images: body.images,
        stock: parseInt(body.stock),
        lowStockAlert: parseInt(body.lowStockAlert) || 10,
        isActive: body.isActive ?? true,
        isFeatured: body.isFeatured ?? false,
        attributes: body.attributes
      },
      include: { category: true }
    });

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await db.product.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;

    const product = await db.product.update({
      where: { id: req.params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.comparePrice !== undefined && {
          comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.stock !== undefined && { stock: parseInt(body.stock) }),
        ...(body.lowStockAlert !== undefined && {
          lowStockAlert: parseInt(body.lowStockAlert),
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.attributes !== undefined && { attributes: body.attributes }),
      },
      include: { category: true }
    });

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await db.product.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

export { router as productsRouter };
```

#### 5. Database Connection

`src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}
```

#### 6. Environment Variables

`.env`:
```env
DATABASE_URL="your-database-connection-string"
FRONTEND_URL="https://your-frontend.vercel.app"
PORT=3001
```

#### 7. Package.json

```json
{
  "name": "ecommerce-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^6.11.1",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "zod": "^4.0.2"
  },
  "devDependencies": {
    "prisma": "^6.11.1",
    "typescript": "^5",
    "tsx": "^4.7.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20"
  }
}
```

#### 8. Deploy Backend to Railway

1. Push backend to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Add environment variables:
   - `DATABASE_URL`: Your database connection string
   - `FRONTEND_URL`: Your Vercel frontend URL
5. Railway will automatically deploy
6. Copy the Railway URL (e.g., `https://your-backend.up.railway.app`)
7. Update frontend's `NEXT_PUBLIC_API_URL` environment variable

---

## 📌 **Strategy 3: Other Backend Options**

### Render (Alternative to Railway)

Similar setup to Railway:
1. Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

2. Push to GitHub
3. Go to [render.com](https://render.com)
4. Click "New +" → "Web Service"
5. Connect GitHub repo
6. Set environment variables
7. Deploy

### Fly.io

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login:
```bash
flyctl auth signup
flyctl auth login
```

3. Deploy:
```bash
cd ecommerce-backend
flyctl launch
flyctl deploy
```

### AWS Lambda + API Gateway

More complex, for enterprise scale:
- Use Serverless Framework
- Deploy Express app to Lambda
- API Gateway for HTTP routing

---

## 🗄️ **Database Options**

### For Production:

| Provider | Free Tier | Best For | Pricing |
|-----------|-----------|-----------|---------|
| **Supabase** | ✅ 500MB | Startups | Free + Pro from $25/mo |
| **Neon** | ✅ 0.5GB | Serverless | Free + Pro from $19/mo |
| **Vercel Postgres** | ❌ Paid | Vercel users | $20/mo |
| **PlanetScale** | ✅ 5GB | MySQL users | Free + Pro from $29/mo |
| **Railway Postgres** | ✅ 1GB | Railway users | Free + Pro from $5/mo |
| **AWS RDS** | ❌ 12mo | Enterprise | Starts from $15/mo |
| **Google Cloud SQL** | ❌ 90days | Enterprise | Starts from $10/mo |

### Recommended: Supabase (Best Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Use as `DATABASE_URL`

---

## 🔐 **Security Checklist**

### For Production:

- [ ] Use HTTPS everywhere (automatic on Vercel/Railway)
- [ ] Enable CORS only for your frontend domain
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting on API
- [ ] Add authentication (NextAuth.js or similar)
- [ ] Validate all inputs with Zod
- [ ] Enable Helmet.js security headers
- [ ] Set up logging and monitoring
- [ ] Implement backup strategy for database
- [ ] Use strong passwords and API keys

---

## 📊 **Cost Comparison**

### Free Tier Options:

| Platform | Frontend | Backend | Database | Monthly Cost |
|----------|----------|---------|----------|--------------|
| **Vercel + Supabase** | ✅ Free | ❌ N/A (Vercel handles both) | ✅ Free | **$0** |
| **Vercel + Railway** | ✅ Free | ✅ Free (hobby) | ✅ Free (hobby) | **$0** |
| **Render + Render** | ✅ Free | ✅ Free (hobby) | ✅ Free (hobby) | **$0** |

### Paid Tier (Production):

| Platform | Frontend | Backend | Database | Monthly Cost |
|----------|----------|---------|----------|--------------|
| **Vercel + Supabase** | $20 | $0 | $25 | **$45** |
| **Vercel + Railway** | $20 | $5 | $5 | **$30** |
| **Render + Render** | $7 | $7 | $7 | **$21** |

---

## 🎯 **My Recommendation**

**For your project:**

1. **Start with Strategy 1 (All-in-One on Vercel)**
   - Fastest deployment
   - No code changes needed
   - Automatic scaling
   - Use Supabase for free database

2. **Later, if needed, migrate to Strategy 2**
   - If you need custom backend logic
   - If you want microservices
   - If backend needs different resources than frontend

---

## 🚀 Quick Start (Recommended Path)

```bash
# 1. Prepare current project
git add .
git commit -m "Ready for deployment"

# 2. Push to GitHub
git push origin main

# 3. Create Supabase project
# Go to supabase.com → New Project → Get DATABASE_URL

# 4. Deploy to Vercel
# a. Install Vercel CLI
npm i -g vercel

# b. Login and deploy
vercel login
vercel --prod

# c. Add environment variables in Vercel dashboard:
#    - DATABASE_URL (from Supabase)
#    - NEXTAUTH_SECRET (generate: openssl rand -base64 32)

# 5. Done! 🎉
```

---

## 📝 **Next Steps**

1. Choose your deployment strategy
2. Set up database (Supabase recommended)
3. Add environment variables
4. Deploy to chosen platform
5. Test thoroughly
6. Set up monitoring and alerts

Need help with any specific step? Let me know!
