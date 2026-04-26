# 🖼️ Image Storage Guide for E-Commerce

Complete guide for storing product images in your Vercel + Supabase deployment.

---

## 🏆 **RECOMMENDED: Supabase Storage**

### Why Supabase Storage is Perfect for E-Commerce:

✅ **Integrated with Supabase Database** - Same platform, same setup
✅ **Generous Free Tier** - 1GB storage, 2GB bandwidth/month
✅ **Built-in CDN** - Powered by Fastly, global edge network
✅ **Row Level Security** - Same as your database
✅ **Image Transformations** - Resize, crop, convert on the fly
✅ **Easy Upload API** - Simple REST API with SDK
✅ **No Extra Configuration** - Works out of the box

---

## 📊 **Storage Options Comparison**

| Provider | Free Storage | Free Bandwidth | Paid Storage | Paid Bandwidth | Best For |
|----------|-------------|---------------|--------------|----------------|----------|
| **Supabase Storage** | 1 GB | 2 GB/mo | 100 GB | 200 GB/mo ($25) | ✅ E-commerce (RECOMMENDED) |
| **Vercel Blob** | 0.5 GB | 100 GB/mo | $0.15/GB | $0.15/GB | Vercel-first projects |
| **Cloudinary** | 25 GB | 25 GB/mo | 500 GB | 1 TB/mo ($89) | Image-heavy apps |
| **AWS S3** | 12 mo free | 100 GB/mo | $0.023/GB | $0.09/GB | Enterprise |
| **Cloudflare R2** | 10 GB | Free egress | $0.015/GB | Free egress | Cost optimization |
| **Backblaze B2** | 10 GB | 1 GB/mo | $0.005/GB | $0.01/GB | Lowest cost |

---

## 🚀 **Implementation: Supabase Storage**

### Step 1: Setup Supabase Storage Bucket

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Storage** on the left sidebar
4. Click **"New bucket"**
5. Create bucket:
   - Name: `products`
   - Make public: ✅ YES (for product images)
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

### Step 2: Configure Bucket Policies

**Row Level Security Policy** (from SQL Editor):

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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

-- Allow authenticated users to delete their files
CREATE POLICY "Authenticated Delete for Products"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND
  auth.role() = 'authenticated'
);
```

### Step 3: Install Supabase SDK

```bash
npm install @supabase/supabase-js
```

### Step 4: Set Environment Variables

Add these to `.env.local` and Vercel environment variables:

```env
# Supabase Configuration
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find keys:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy `Project URL`, `anon public`, and `service_role` keys

### Step 5: Upload API Route

Your upload API is already created at: `/api/upload`

Features:
- ✅ Multiple image upload
- ✅ Drag & drop support
- ✅ File type validation (JPEG, PNG, WebP, GIF)
- ✅ File size limit (5MB)
- ✅ Unique filename generation
- ✅ Progress indication
- ✅ Delete functionality

### Step 6: Use in Product Form

```tsx
'use client'

import { useState } from 'react'
import { ImageUpload } from '@/components/admin/image-upload'

export default function AddProductForm() {
  const [images, setImages] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '0'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Convert images to URLs array
    const imageUrls = images.map(img => img.url)

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        images: JSON.stringify(imageUrls),
        stock: parseInt(formData.stock),
        price: parseFloat(formData.price)
      })
    })

    // Handle response...
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Other form fields */}
      <div>
        <label className="block text-sm font-medium mb-2">Product Images</label>
        <ImageUpload
          onImagesChange={setImages}
          maxImages={5}
          maxSize={5}
        />
      </div>

      <button type="submit">Create Product</button>
    </form>
  )
}
```

---

## 💡 **Advanced Features**

### Image Transformations (Supabase)

Resize images on the fly:

```typescript
// Original image URL
const originalUrl = 'https://your-project.supabase.co/storage/v1/object/public/products/image.jpg'

// Resized to 400x400
const resizedUrl = `${originalUrl}?width=400&height=400`

// Cropped
const croppedUrl = `${originalUrl}?width=400&height=400&resize=cover`

// Quality
const optimizedUrl = `${originalUrl}?quality=80&format=webp`
```

### Image Optimization

Automatically convert to WebP:

```typescript
// In your upload route
const { data, error } = await supabase.storage
  .from('products')
  .upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
    transform: {
      format: 'webp',
      quality: 80
    }
  })
```

---

## 🎨 **Alternative Storage Options**

### Option 2: Vercel Blob (Good for Vercel Projects)

**Pros:**
- Native Vercel integration
- Simple SDK
- Automatic CDN

**Cons:**
- No free tier for storage (0.5GB only)
- Higher costs for large volumes

**Setup:**

```bash
npm install @vercel/blob
```

```typescript
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  const file = await request.formData().get('file') as File;

  const blob = await put(file.name, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
```

**Pricing:**
- $0.15/GB storage
- $0.15/GB bandwidth

---

### Option 3: Cloudinary (Best for Image-Heavy Apps)

**Pros:**
- Excellent free tier (25GB!)
- Auto-optimization
- Advanced transformations
- AI-powered features

**Cons:**
- Need to migrate if you outgrow
- More complex setup

**Setup:**

```bash
npm install cloudinary
```

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const result = await cloudinary.uploader.upload(file.path, {
  folder: 'products',
  transformation: [
    { width: 800, height: 800, crop: 'fill' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
});
```

---

### Option 4: AWS S3 + CloudFront (Enterprise)

**Pros:**
- Industry standard
- Extremely reliable
- Highly scalable
- Low cost at scale

**Cons:**
- Complex setup
- CDN requires extra setup
- Steeper learning curve

**Setup:**
```bash
npm install @aws-sdk/client-s3
```

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const command = new PutObjectCommand({
  Bucket: 'your-bucket',
  Key: filePath,
  Body: buffer,
  ContentType: file.type,
});

await s3.send(command);
```

---

## 📈 **Cost Estimates**

### Example: 500 Products, 5 Images Each (2,500 Total Images)

**Assumption:** Average 500KB per image

| Provider | Storage (1.25 GB) | Bandwidth (10 GB/mo) | Monthly Cost |
|----------|-------------------|----------------------|--------------|
| **Supabase Free** | ✅ Included | ✅ Included | **$0** |
| **Supabase Pro** | ✅ Included | ✅ Included | **$25** |
| **Vercel Blob** | $0.19 | $1.50 | **$1.69** |
| **Cloudinary Free** | ✅ Included | ✅ Included | **$0** |
| **Cloudinary Pro** | ✅ Included | ✅ Included | **$89** |
| **AWS S3** | $0.03 | $0.90 | **$0.93** |
| **Cloudflare R2** | $0.02 | $0 | **$0.02** |

---

## 🎯 **Recommendation**

### For Your E-Commerce Project:

**Phase 1: Start (Free)**
- Use **Supabase Storage Free Tier**
- Perfect for testing and initial launch
- Up to 1,000+ product images
- Zero cost

**Phase 2: Growth ($25/mo)**
- Upgrade to **Supabase Pro**
- 100GB storage (enough for 200,000+ product images)
- 200GB bandwidth
- Enhanced features

**Phase 3: Scale ($89/mo)**
- Migrate to **Cloudinary** (if needed)
- Advanced image optimization
- AI-powered features
- Better CDN performance

---

## 🔄 **Migration Strategy**

### From Supabase to Cloudinary (When Needed):

1. **Export from Supabase:**
```typescript
const { data, error } = await supabase.storage
  .from('products')
  .list('', { limit: 100 })
```

2. **Upload to Cloudinary:**
```typescript
for (const file of data) {
  const { data: blob } = await supabase.storage
    .from('products')
    .createSignedUrl(file.name, 60)

  await cloudinary.uploader.upload(blob.signedUrl, {
    folder: 'products'
  })
}
```

3. **Update database URLs:**
```typescript
await db.product.updateMany({
  data: { images: newCloudinaryUrls }
})
```

---

## ✅ **Deployment Checklist**

### Before Deploying to Production:

- [ ] Create Supabase Storage bucket named "products"
- [ ] Set bucket to public
- [ ] Configure RLS policies for public read, authenticated write
- [ ] Add SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY to environment variables
- [ ] Test image upload locally
- [ ] Test image deletion
- [ ] Verify CDN URLs are accessible
- [ ] Test with multiple file uploads
- [ ] Validate file size limits
- [ ] Test drag & drop functionality
- [ ] Test on mobile devices

---

## 🚨 **Common Issues & Solutions**

### Issue 1: Upload Fails with CORS Error

**Solution:** Add CORS policy in Supabase Dashboard:
- Go to Storage → Policies
- Add CORS policy for your Vercel domain

### Issue 2: Images Not Showing

**Solution:** Check:
- Bucket is set to public
- RLS policy allows public read
- URL is correct (https, not http)

### Issue 3: File Size Limit Exceeded

**Solution:** Increase limit in bucket settings:
- Go to Storage → Your bucket
- Change "File size limit" to desired MB

### Issue 4: Slow Image Loading

**Solution:**
- Use Supabase image transformations to resize
- Implement lazy loading in frontend
- Use next/image component for optimization

---

## 🎉 **You're Ready!**

Your image storage setup is complete:

✅ Upload API: `/api/upload`
✅ Image Upload Component: `/components/admin/image-upload.tsx`
✅ Supabase Storage Integration
✅ Multiple file support
✅ Drag & drop
✅ Progress tracking
✅ Delete functionality

**Next Steps:**
1. Create Supabase bucket
2. Set environment variables
3. Test locally
4. Deploy to Vercel
5. Monitor storage usage

---

Need help with any specific part? Let me know!
