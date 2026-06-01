import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database...');

    // Check categories
    const categories = await prisma.$queryRawUnsafe('SELECT id, name, slug, isActive FROM categories LIMIT 10');
    console.log('Categories found:', categories.length);
    console.log('Categories:', JSON.stringify(categories, null, 2));

    // Check users
    const users = await prisma.$queryRawUnsafe('SELECT id, email, name, role FROM users LIMIT 5');
    console.log('\nUsers found:', users.length);
    console.log('Users:', JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();