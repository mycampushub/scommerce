import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database...');

  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();

  console.log(`Users: ${userCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Orders: ${orderCount}`);

  // Check specific product
  const product = await prisma.product.findUnique({
    where: { id: 'prod-ku-001' },
    select: { id: true, name: true, stock: true, basePrice: true, isActive: true, hasVariants: true }
  });
  console.log('\nProduct prod-ku-001:');
  console.log(JSON.stringify(product, null, 2));

  // Check product variants
  const variants = await prisma.productVariant.findMany({
    where: { productId: 'prod-ku-001' },
    take: 3
  });
  console.log('\nVariants for prod-ku-001:');
  console.log(JSON.stringify(variants, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
