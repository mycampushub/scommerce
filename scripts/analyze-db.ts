import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Database Analysis\n');

  // Count all categories
  const totalCategories = await prisma.categories.count();
  const activeCategories = await prisma.categories.count({ where: { isActive: 1 } });

  console.log(`Categories:`);
  console.log(`  Total: ${totalCategories}`);
  console.log(`  Active: ${activeCategories}`);

  // Count all brands
  const totalBrands = await prisma.brands.count();
  const activeBrands = await prisma.brands.count({ where: { isActive: 1 } });

  console.log(`\nBrands:`);
  console.log(`  Total: ${totalBrands}`);
  console.log(`  Active: ${activeBrands}`);

  // Check for Aveeno and CeraVe brands
  const aveenoBrands = await prisma.brands.findMany({
    where: {
      OR: [
        { name: { contains: 'Aveeno' } },
        { name: { contains: 'aveeno' } },
      ],
    },
  });

  const ceraveBrands = await prisma.brands.findMany({
    where: {
      OR: [
        { name: { contains: 'CeraVe' } },
        { name: { contains: 'cerave' } },
        { name: { contains: 'CeraVe' } },
      ],
    },
  });

  console.log(`\nAveeno brands found: ${aveenoBrands.length}`);
  if (aveenoBrands.length > 0) {
    aveenoBrands.forEach(b => console.log(`  - ${b.name} (${b.id}) - Active: ${b.isActive}`));
  }

  console.log(`\nCeraVe brands found: ${ceraveBrands.length}`);
  if (ceraveBrands.length > 0) {
    ceraveBrands.forEach(b => console.log(`  - ${b.name} (${b.id}) - Active: ${b.isActive}`));
  }

  // List sample categories
  const sampleCategories = await prisma.categories.findMany({
    take: 20,
    orderBy: { id: 'asc' },
  });

  console.log(`\nSample categories (first 20):`);
  sampleCategories.forEach(c => {
    console.log(`  - ${c.name} (${c.id}) - Active: ${c.isActive}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });