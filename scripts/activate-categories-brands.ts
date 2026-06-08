import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Activating categories and brands...');

  // Categories to activate - include parent categories first
  const categoriesToActivate = [
    // Parent categories
    'cat-body-care',
    'cat-baby-care',
    'cat-skincare',
    'cat-hair-care',
    // Subcategories
    'cat-body-lotion',
    'cat-body-cream',
    'cat-body-wash',
    'cat-baby-lotion',
    'cat-baby-cream',
    'cat-baby-wash',
    'cat-face-wash',
    'cat-cleanser',
    'cat-serum',
    'cat-moisturizer',
    'cat-day-cream',
    'cat-night-cream',
    'cat-eye-cream',
    'cat-face-scrub',
    'cat-shampoo',
    'cat-conditioner',
  ];

  // Activate categories
  const activatedCategories = await prisma.categories.updateMany({
    where: {
      id: { in: categoriesToActivate },
    },
    data: {
      isActive: 1,
    },
  });

  console.log(`✓ Activated ${activatedCategories.count} categories`);

  // Create missing categories if needed
  const missingCategories = [
    {
      id: 'cat-baby-sunscreen',
      name: 'Baby Sunscreen',
      slug: 'baby-sunscreen',
      description: 'Sunscreen for babies and kids',
      parentId: 'cat-baby-care',
      isActive: 1,
      sortOrder: 125,
    },
    {
      id: 'cat-diaper-rash-cream',
      name: 'Diaper Rash Cream',
      slug: 'diaper-rash-cream',
      description: 'Diaper rash creams and ointments',
      parentId: 'cat-baby-care',
      isActive: 1,
      sortOrder: 126,
    },
  ];

  for (const cat of missingCategories) {
    await prisma.categories.upsert({
      where: { id: cat.id },
      update: { isActive: 1 },
      create: {
        ...cat,
        updatedAt: new Date(),
      },
    });
    console.log(`✓ Ensured category exists: ${cat.name}`);
  }

  // Activate brands
  const activatedBrands = await prisma.brands.updateMany({
    where: {
      name: { in: ['Aveeno', 'CeraVe'] },
    },
    data: {
      isActive: 1,
      featured: 1,
    },
  });

  console.log(`✓ Activated ${activatedBrands.count} brands`);

  // Verify
  const activeCategories = await prisma.categories.count({
    where: { isActive: 1 },
  });

  const activeBrands = await prisma.brands.count({
    where: { isActive: 1 },
  });

  console.log(`\n📊 Summary:`);
  console.log(`  Active categories: ${activeCategories}`);
  console.log(`  Active brands: ${activeBrands}`);
  console.log('\n✅ Categories and brands activation completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });