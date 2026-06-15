/**
 * Create admin user script
 * Run with: bun run scripts/create-admin.ts
 */
import { hashPassword } from '../src/lib/bcrypt-wrapper';
import { generateSecureId } from '../src/lib/crypto-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'admin@scommerce.com';
  const password = 'admin123';

  console.log('Creating admin user...');

  // Check if admin user already exists
  const existing = await prisma.users.findFirst({
    where: { email }
  });

  if (existing) {
    console.log('Admin user already exists:', email);
    console.log('User ID:', existing.id, 'Role:', existing.role);
    await prisma.$disconnect();
    process.exit(0);
  }

  // Create admin user
  const id = generateSecureId();
  const hashedPassword = await hashPassword(password);
  const currentTime = new Date().toISOString();

  try {
    await prisma.users.create({
      data: {
        id,
        email,
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        emailVerified: 1, // Int, not boolean
        createdAt: currentTime,
        updatedAt: currentTime
      }
    });

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', id);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});