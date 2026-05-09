import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('Testing database queries...');

  try {
    // Test 1: Count users
    const userCount = await prisma.user.count();
    console.log(`✓ Users: ${userCount}`);

    // Test 2: Count products
    const productCount = await prisma.product.count();
    console.log(`✓ Products: ${productCount}`);

    // Test 3: Count orders
    const orderCount = await prisma.order.count();
    console.log(`✓ Orders: ${orderCount}`);

    // Test 4: Get orders with items
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✓ Recent orders: ${orders.length}`);
    console.log(`  Order #1: ${orders[0]?.orderNumber} - ${orders[0]?.status}`);

    // Test 5: Get order stats
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' }
    });
    console.log(`✓ Pending orders: ${pendingOrders}`);

    // Test 6: Get top products
    const topProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`✓ Top products: ${topProducts.length}`);
    console.log(`  Product #1: ${topProducts[0]?.name} - ${topProducts[0]?.price}`);

    console.log('\n✓ All database tests passed!');
  } catch (error) {
    console.error('✗ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
