import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying seeded data...\n');

  // Count products
  const totalProducts = await prisma.products.count();
  const activeProducts = await prisma.products.count({ where: { isActive: 1 } });

  console.log(`Products:`);
  console.log(`  Total: ${totalProducts}`);
  console.log(`  Active: ${activeProducts}`);

  // Count variants
  const totalVariants = await prisma.product_variants.count();
  const activeVariants = await prisma.product_variants.count({ where: { isActive: 1 } });

  console.log(`\nProduct Variants:`);
  console.log(`  Total: ${totalVariants}`);
  console.log(`  Active: ${activeVariants}`);

  // Check Aveeno products
  const aveenoProducts = await prisma.products.findMany({
    where: { brandName: 'Aveeno' },
    take: 5,
    select: { id: true, name: true, slug: true, price: true, isActive: true },
  });

  console.log(`\nAveeno Products (first 5):`);
  if (aveenoProducts.length > 0) {
    aveenoProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.slug}) - ৳${p.price} - Active: ${p.isActive === 1 ? 'Yes' : 'No'}`);
    });
  } else {
    console.log('  ✗ No Aveeno products found');
  }

  // Check CeraVe products
  const ceraveProducts = await prisma.products.findMany({
    where: { brandName: 'CeraVe' },
    take: 5,
    select: { id: true, name: true, slug: true, price: true, isActive: true },
  });

  console.log(`\nCeraVe Products (first 5):`);
  if (ceraveProducts.length > 0) {
    ceraveProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.slug}) - ৳${p.price} - Active: ${p.isActive === 1 ? 'Yes' : 'No'}`);
    });
  } else {
    console.log('  ✗ No CeraVe products found');
  }

  // Check categories
  const categoriesWithProducts = await prisma.categories.findMany({
    where: {
      products: { some: { isActive: 1 } },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { products: true } },
    },
    take: 10,
  });

  console.log(`\nCategories with Products (first 10):`);
  if (categoriesWithProducts.length > 0) {
    categoriesWithProducts.forEach(c => {
      console.log(`  - ${c.name}: ${c._count.products} products`);
    });
  } else {
    console.log('  ✗ No categories with products found');
  }

  // Sample variant check
  const sampleProduct = await prisma.products.findFirst({
    where: { brandName: { in: ['Aveeno', 'CeraVe'] } },
  });

  if (sampleProduct) {
    const variants = await prisma.product_variants.findMany({
      where: { productId: sampleProduct.id },
      select: { id: true, name: true, price: true, stock: true, isActive: true },
    });

    console.log(`\nSample Product: ${sampleProduct.name}`);
    console.log(`  Variants: ${variants.length}`);
    variants.forEach(v => {
      console.log(`    - ${v.name}: ৳${v.price} | Stock: ${v.stock} | Active: ${v.isActive === 1 ? 'Yes' : 'No'}`);
    });
  }

  console.log(`\n✅ Verification complete!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });