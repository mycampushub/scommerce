# Backend for Railway Deployment Structure

## Directory Structure
/backend
  ├── /src
  │   ├── /api
  │   │   ├── /admin
  │   │   │   ├── products.ts
  │   │   │   ├── orders.ts
  │   │   │   ├── customers.ts
  │   │   │   ├── categories.ts
  │   │   │   └── stats.ts
  │   │   └── /public
  │   │       └── products.ts
  │   ├── /lib
  │   │   ├── db.ts
  │   │   └── middleware.ts
  │   ├── /prisma
  │   │   └── schema.prisma
  │   └── index.ts
  ├── package.json
  └── tsconfig.json

## Express.js Backend Example (backend/src/index.ts)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { productsRouter } from './api/admin/products';
import { ordersRouter } from './api/admin/orders';
import { customersRouter } from './api/admin/customers';
import { categoriesRouter } from './api/admin/categories';
import { statsRouter } from './api/admin/stats';

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
  console.log(`Backend server running on port ${PORT}`);
});

## Backend package.json

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
    "@types/cors": "^2.8.17"
  }
}

## Example API Route (backend/src/api/admin/products.ts)

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

export { router as productsRouter };
