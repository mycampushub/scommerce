#!/usr/bin/env bun
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Insert Default Admin User (password: admin123)
  await prisma.users.create({
    data: {
      id: 'admin-001',
      email: 'admin@scommerce.com',
      name: 'Admin User',
      password: 'pbkdf2$100000$245cfd1a81687a32a2c548503b960472c1ca4092a3ca9c059b9f6d047fe70884$19674afc0599cdfe8e9fc3e9ce3d498b02cf29133e4c88f266553bd7c7e5ac7d11f993e5dca14ab2207b5d23a491b935f3b24855a7d21e927b9d222c5b479733',
      role: 'admin',
      emailVerified: 1,
    },
  });
  console.log('✓ Admin user created');

  // Insert Categories
  const categories = [
    { id: 'cat-saree', name: 'Sarees', slug: 'saree', description: 'Beautiful traditional sarees for every occasion' },
    { id: 'cat-salwar', name: 'Salwar Suits', slug: 'salwar', description: 'Elegant salwar suits for modern women' },
    { id: 'cat-lehengas', name: 'Lehengas', slug: 'lehengas', description: 'Stunning lehengas for special occasions' },
    { id: 'cat-kurtas', name: 'Kurtas', slug: 'kurtas', description: 'Comfortable and stylish kurtas' },
    { id: 'cat-menswear', name: 'Menswear', slug: 'menswear', description: 'Trendy menswear collection' },
    { id: 'cat-gowns', name: 'Gowns', slug: 'gowns', description: 'Elegant gowns for formal events' },
    { id: 'cat-tops', name: 'Tops', slug: 'tops', description: 'Casual and formal tops' },
    { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', description: 'Fashion accessories to complete your look' },
  ];

  for (const cat of categories) {
    await prisma.categories.create({ data: cat });
  }
  console.log(`✓ ${categories.length} categories created`);

  // Insert Brands
  const brands = [
    { id: 'brand-001', name: 'Luxury Sarees', slug: 'luxury-sarees', description: 'Premium quality silk sarees', country: 'India', featured: 1, sortOrder: 1 },
    { id: 'brand-002', name: 'Modern Fashion', slug: 'modern-fashion', description: 'Contemporary ethnic wear', country: 'Bangladesh', featured: 1, sortOrder: 2 },
    { id: 'brand-003', name: 'Elegant Style', slug: 'elegant-style', description: 'Traditional with modern touch', country: 'Pakistan', featured: 0, sortOrder: 3 },
    { id: 'brand-004', name: 'Royal Collection', slug: 'royal-collection', description: 'Luxury bridal wear', country: 'India', featured: 1, sortOrder: 4 },
  ];

  for (const brand of brands) {
    await prisma.brands.create({ data: brand });
  }
  console.log(`✓ ${brands.length} brands created`);

  // Insert Products
  const products = [
    { id: 'prod-001', name: 'Silk Saree - Royal Blue', slug: 'silk-saree-royal-blue', description: 'Pure silk saree with intricate golden embroidery', categoryId: 'cat-saree', price: 3500, basePrice: 3500, comparePrice: 4500, images: '["https://example.com/saree-1.jpg"]', stock: 50, isFeatured: 1, brandId: 'brand-001', material: 'Silk', color: 'Blue', availableSizes: '["6m", "6.5m"]', availableColors: '["Blue", "Gold"]' },
    { id: 'prod-002', name: 'Cotton Salwar Suit', slug: 'cotton-salwar-suit', description: 'Comfortable cotton salwar suit with embroidery', categoryId: 'cat-salwar', price: 1800, basePrice: 1800, comparePrice: 2200, images: '["https://example.com/salwar-1.jpg"]', stock: 30, isFeatured: 1, brandId: 'brand-002', material: 'Cotton', color: 'Green', availableSizes: '["S", "M", "L", "XL"]', availableColors: '["Green", "Pink"]' },
    { id: 'prod-003', name: 'Bridal Lehenga', slug: 'bridal-lehenga', description: 'Heavy work bridal lehenga with dupatta', categoryId: 'cat-lehengas', price: 15000, basePrice: 15000, comparePrice: 18000, images: '["https://example.com/lehenga-1.jpg"]', stock: 15, isFeatured: 1, brandId: 'brand-004', material: 'Velvet', color: 'Red', availableSizes: '["S", "M", "L"]', availableColors: '["Red", "Maroon"]' },
    { id: 'prod-004', name: 'Cotton Kurta', slug: 'cotton-kurta', description: 'Casual cotton kurta for everyday wear', categoryId: 'cat-kurtas', price: 800, basePrice: 800, comparePrice: 1000, images: '["https://example.com/kurta-1.jpg"]', stock: 100, isFeatured: 1, brandId: 'brand-002', material: 'Cotton', color: 'White', availableSizes: '["S", "M", "L", "XL", "XXL"]', availableColors: '["White", "Blue", "Grey"]' },
    { id: 'prod-005', name: 'Formal Shirt', slug: 'formal-shirt', description: 'Premium cotton formal shirt', categoryId: 'cat-menswear', price: 1200, basePrice: 1200, comparePrice: 1500, images: '["https://example.com/shirt-1.jpg"]', stock: 75, brandId: 'brand-003', material: 'Cotton', color: 'White', availableSizes: '["S", "M", "L", "XL"]', availableColors: '["White", "Light Blue"]' },
    { id: 'prod-006', name: 'Evening Gown', slug: 'evening-gown', description: 'Elegant evening gown for parties', categoryId: 'cat-gowns', price: 8000, basePrice: 8000, comparePrice: 10000, images: '["https://example.com/gown-1.jpg"]', stock: 20, isFeatured: 1, brandId: 'brand-004', material: 'Silk', color: 'Black', availableSizes: '["S", "M", "L"]', availableColors: '["Black", "Navy"]' },
    { id: 'prod-007', name: 'Casual Top', slug: 'casual-top', description: 'Comfortable casual top', categoryId: 'cat-tops', price: 600, basePrice: 600, comparePrice: 800, images: '["https://example.com/top-1.jpg"]', stock: 80, brandId: 'brand-002', material: 'Cotton', color: 'Pink', availableSizes: '["S", "M", "L", "XL"]', availableColors: '["Pink", "Yellow", "White"]' },
  ];

  for (const product of products) {
    await prisma.products.create({ data: product as any });
  }
  console.log(`✓ ${products.length} products created`);

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });