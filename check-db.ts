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

  await prisma.$disconnect();
}

main().catch(console.error);
