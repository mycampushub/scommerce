import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Activating brands...');

  // Activate brands only
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

  // Check which brands exist
  const aveeno = await prisma.brands.findFirst({ where: { name: 'Aveeno' } });
  const cerave = await prisma.brands.findFirst({ where: { name: 'CeraVe' } });

  if (aveeno) {
    console.log(`✓ Aveeno brand found: ID=${aveeno.id}`);
  } else {
    console.log(`✗ Aveeno brand NOT found in database`);
  }

  if (cerave) {
    console.log(`✓ CeraVe brand found: ID=${cerave.id}`);
  } else {
    console.log(`✗ CeraVe brand NOT found in database`);
  }

  // Check which categories exist
  const categoriesToCheck = [
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

  console.log('\n📋 Checking categories:');
  for (const catId of categoriesToCheck) {
    const cat = await prisma.categories.findUnique({ where: { id: catId } });
    if (cat) {
      console.log(`✓ ${cat.name} (${catId}) - Active: ${cat.isActive === 1 ? 'Yes' : 'No'}`);
    } else {
      console.log(`✗ ${catId} - Not found`);
    }
  }

  console.log('\n✅ Brand activation completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });