import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking admin users...');

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['admin', 'staff']
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBanned: true
    }
  });

  console.log('Admin/Staff users:');
  for (const user of users) {
    console.log(`  - ${user.email} (${user.role}) - ${user.name || 'No name'} - Banned: ${user.isBanned}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
